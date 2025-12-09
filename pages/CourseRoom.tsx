
import React, { useState, useEffect, useRef } from 'react';
import { User, Role, Course, ChatMessage, RoomState } from '../types';
import { API_URL } from '../constants';
import { ChevronLeft, Send, Video, Monitor, Lock, Unlock, Power, MessageSquare, LogOut, Users, RefreshCw } from 'lucide-react';
import { io, Socket } from "socket.io-client";

interface CourseRoomProps {
    courseId: string;
    user: User;
    onBack: () => void;
}

export const CourseRoom: React.FC<CourseRoomProps> = ({ courseId, user, onBack }) => {
    const [course, setCourse] = useState<Course | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [roomState, setRoomState] = useState<RoomState>({ courseId, isActive: false, isChatLocked: false, isScreenSharing: false });
    const [connectedUsers, setConnectedUsers] = useState<number>(0);
    
    // UI State
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    
    // WebRTC & Socket Refs
    const socketRef = useRef<Socket | null>(null);
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map()); // Map<SocketId, PeerConnection>
    const localStreamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null); // For Students to see stream
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isTeacher = user.role === Role.TEACHER || user.role === Role.ADMIN;
    
    // Helper to get socket URL (handles dev vs prod relative paths)
    const getSocketUrl = () => {
        if (API_URL === '') return window.location.origin;
        return API_URL;
    };

    // Initialize Socket and WebRTC Listeners
    useEffect(() => {
        // Connect to Socket.IO
        socketRef.current = io(getSocketUrl());

        const socket = socketRef.current;

        socket.on("connect", () => {
            console.log("Connected to socket server with ID:", socket.id);
            socket.emit("join-room", courseId, user.id);
        });

        // SIGNALING LOGIC
        socket.on("user-connected", (userSocketId: string) => {
            setConnectedUsers(prev => prev + 1);
            // If I am the teacher and I am sharing, initiate connection to this new user
            if (isTeacher && localStreamRef.current) {
                console.log("User connected, initiating stream for:", userSocketId);
                createPeerConnection(userSocketId, localStreamRef.current);
            }
        });

        socket.on("user-disconnected", (userSocketId: string) => {
            setConnectedUsers(prev => Math.max(0, prev - 1));
            // Close peer connection
            const pc = peerConnectionsRef.current.get(userSocketId);
            if (pc) {
                pc.close();
                peerConnectionsRef.current.delete(userSocketId);
            }
        });

        socket.on("offer", async (payload: { sdp: RTCSessionDescriptionInit, caller: string }) => {
            if (isTeacher) return; // Teachers don't receive offers in this topology
            console.log("Received offer from:", payload.caller);
            
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            // Handle incoming track
            pc.ontrack = (event) => {
                console.log("Received Track");
                const remoteStream = new MediaStream([event.track]);
                if (videoRef.current) {
                    videoRef.current.srcObject = remoteStream;
                    // Force play
                    videoRef.current.play().catch(e => console.warn("Autoplay blocked:", e));
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    // CRITICAL FIX: Must include 'caller' (my socket id) so teacher knows who sent this
                    socket.emit("ice-candidate", { 
                        target: payload.caller, 
                        candidate: event.candidate,
                        caller: socket.id 
                    });
                }
            };

            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            console.log("Sending answer to:", payload.caller);
            // CRITICAL FIX: Must include 'caller' (my socket id) so teacher knows who sent this
            socket.emit("answer", { 
                target: payload.caller, 
                sdp: answer, 
                caller: socket.id 
            });
            
            peerConnectionsRef.current.set(payload.caller, pc);
        });

        socket.on("answer", async (payload: { sdp: RTCSessionDescriptionInit, caller: string }) => {
            // payload.caller is the student ID
            const pc = peerConnectionsRef.current.get(payload.caller);
            if (pc) {
                console.log("Received answer from:", payload.caller);
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            } else {
                console.warn("Received answer for unknown PC:", payload.caller);
            }
        });

        socket.on("ice-candidate", async (payload: { candidate: RTCIceCandidateInit, caller: string }) => {
            const pc = peerConnectionsRef.current.get(payload.caller);
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            }
        });

        // SIGNAL: Student receives this when teacher starts sharing
        socket.on("sharing-started", (teacherSocketId: string) => {
            console.log("Sharing started signal received");
            setRoomState(prev => ({ ...prev, isScreenSharing: true }));
            // Student MUST request the stream now
            if (!isTeacher && socket.id) {
                console.log("Requesting stream...");
                socket.emit("request-stream", courseId, socket.id);
            }
        });

        socket.on("sharing-stopped", () => {
            console.log("Sharing stopped");
            setRoomState(prev => ({ ...prev, isScreenSharing: false }));
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            // Clean up connections on student side
            peerConnectionsRef.current.forEach(pc => pc.close());
            peerConnectionsRef.current.clear();
        });
        
        // SIGNAL: Teacher receives this when a student requests the stream
        socket.on("request-stream", (studentSocketId: string) => {
             console.log("Stream requested by:", studentSocketId);
             if (isTeacher && localStreamRef.current) {
                 createPeerConnection(studentSocketId, localStreamRef.current);
             }
        });

        socket.on("receive-message", (msg: ChatMessage) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on("room-state-changed", (newState: Partial<RoomState>) => {
            setRoomState(prev => ({ ...prev, ...newState }));
            // Handle case where student joins a room that is ALREADY sharing
            if (newState.isScreenSharing && !isTeacher) {
                // Short delay to ensure socket is ready
                setTimeout(() => {
                   if(socketRef.current?.id) {
                       console.log("Room state says sharing, requesting stream...");
                       socketRef.current.emit("request-stream", courseId, socketRef.current.id);
                   }
                }, 1000);
            }
        });

        return () => {
            socket.disconnect();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, [courseId, isTeacher, user.id]);

    // Initial Data Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [courseRes, roomRes, msgsRes] = await Promise.all([
                    fetch(`${API_URL}/api/courses/${courseId}`),
                    fetch(`${API_URL}/api/room/${courseId}`),
                    fetch(`${API_URL}/api/room/${courseId}/messages`)
                ]);
                
                if (courseRes.ok) setCourse(await courseRes.json());
                if (roomRes.ok) {
                    const roomData = await roomRes.json();
                    setRoomState({ 
                        courseId, 
                        isActive: !!roomData.isActive, 
                        isChatLocked: !!roomData.isChatLocked,
                        isScreenSharing: !!roomData.isScreenSharing 
                    });
                }
                if (msgsRes.ok) setMessages(await msgsRes.json());
            } catch (e) { console.error(e); }
        };
        fetchInitialData();
    }, [courseId]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    // --- WebRTC Functions (Teacher Only) ---

    const createPeerConnection = async (targetSocketId: string, stream: MediaStream) => {
        console.log("Creating PC for:", targetSocketId);
        // If connection already exists for this user, close it first to restart
        if (peerConnectionsRef.current.has(targetSocketId)) {
            peerConnectionsRef.current.get(targetSocketId)?.close();
        }

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Add tracks to connection
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit("ice-candidate", { 
                    target: targetSocketId, 
                    candidate: event.candidate,
                    caller: socketRef.current.id 
                });
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (socketRef.current) {
            socketRef.current.emit("offer", { 
                target: targetSocketId, 
                sdp: offer, 
                caller: socketRef.current.id // Teacher identifies self
            });
        }

        peerConnectionsRef.current.set(targetSocketId, pc);
    };

    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 30 }, 
                audio: false
            });

            localStreamRef.current = stream;
            setIsSharingScreen(true);
            
            // Notify server
            if (socketRef.current) {
                socketRef.current.emit("sharing-started", courseId);
            }
            
            // Update DB State
            await fetch(`${API_URL}/api/room/${courseId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isScreenSharing: 1 })
            });

            // Handle stream stop via browser UI
            stream.getVideoTracks()[0].onended = () => {
                stopScreenShare();
            };

        } catch (e) {
            console.error("Error sharing screen:", e);
        }
    };

    const stopScreenShare = async () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        setIsSharingScreen(false);
        
        if (socketRef.current) {
            socketRef.current.emit("sharing-stopped", courseId);
        }

        // Close all peer connections
        peerConnectionsRef.current.forEach(pc => pc.close());
        peerConnectionsRef.current.clear();

        await fetch(`${API_URL}/api/room/${courseId}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isScreenSharing: 0 })
        });
    };

    // --- Actions ---

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        if (socketRef.current) {
            const msg = { 
                id: Date.now().toString(), 
                courseId, 
                username: user.name, 
                role: user.role, 
                text: newMessage, 
                createdAt: new Date().toISOString() 
            };
            socketRef.current.emit("send-message", courseId, msg);
        }
        setNewMessage('');
    };

    const requestStreamRefresh = () => {
        if (socketRef.current) {
            console.log("Manually requesting stream refresh...");
            socketRef.current.emit("request-stream", courseId, socketRef.current.id);
        }
    }

    const startRoom = async () => {
        await fetch(`${API_URL}/api/room/${courseId}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: 1 })
        });
        setRoomState(prev => ({ ...prev, isActive: true }));
    };

    const endRoom = async () => {
        if (!window.confirm("Завершить занятие? Комната закроется.")) return;
        if (isSharingScreen) stopScreenShare();
        await fetch(`${API_URL}/api/room/${courseId}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: 0, isScreenSharing: 0 })
        });
        setRoomState(prev => ({ ...prev, isActive: false, isScreenSharing: false }));
    };

    const toggleChatLock = async () => {
        const newState = !roomState.isChatLocked;
        await fetch(`${API_URL}/api/room/${courseId}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isChatLocked: newState ? 1 : 0 })
        });
        setRoomState(prev => ({ ...prev, isChatLocked: newState }));
    };


    // --- Render ---

    if (!roomState.isActive && !isTeacher) {
        return (
            <div className="bg-white rounded-3xl p-8 shadow-sm h-full flex flex-col relative overflow-hidden">
                <button onClick={onBack} className="absolute top-8 left-8 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Monitor size={48} className="text-blue-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Ожидание преподавателя</h2>
                    <p className="text-slate-500 max-w-md">Комната откроется автоматически, как только занятие начнется.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-3xl overflow-hidden h-full flex flex-col shadow-2xl relative">
            
            {/* Header */}
            <div className="bg-slate-800/50 backdrop-blur-md p-4 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2">
                         <LogOut size={16} /> Выйти
                    </button>
                    <div>
                        <h2 className="font-bold text-white text-sm">{course?.title}</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-[10px] text-red-400 uppercase tracking-wider font-bold">В эфире</span>
                            {isTeacher && <span className="text-[10px] text-slate-500 ml-2 flex items-center gap-1"><Users size={12}/> {connectedUsers}</span>}
                        </div>
                    </div>
                </div>

                {isTeacher ? (
                    <div className="flex gap-2">
                        <button 
                            onClick={toggleChatLock}
                            className={`p-2 rounded-lg transition-colors ${roomState.isChatLocked ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            title={roomState.isChatLocked ? "Разблокировать чат" : "Заблокировать чат"}
                        >
                            {roomState.isChatLocked ? <Lock size={18} /> : <Unlock size={18} />}
                        </button>
                        <button onClick={endRoom} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2">
                            <Power size={16} /> Завершить
                        </button>
                    </div>
                ) : (
                    roomState.isScreenSharing && (
                        <button 
                            onClick={requestStreamRefresh} 
                            className="bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw size={14} /> Обновить поток
                        </button>
                    )
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Screen Share / Video Area */}
                <div className="flex-1 bg-black relative flex flex-col items-center justify-center overflow-hidden">
                    
                    {/* TEACHER: Local Preview Overlay */}
                    {isTeacher && isSharingScreen && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                            <p className="text-white bg-red-600 px-4 py-2 rounded-full text-sm font-bold animate-pulse shadow-lg">
                                Идет трансляция (WebRTC)
                            </p>
                        </div>
                    )}
                    
                    {/* TEACHER: Stop Button */}
                    {isSharingScreen && isTeacher && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                            <button onClick={stopScreenShare} className="bg-red-600/90 backdrop-blur hover:bg-red-700 text-white px-6 py-2 rounded-full text-xs font-bold uppercase shadow-lg">
                                Остановить
                            </button>
                        </div>
                    )}

                    {/* STUDENT: Remote Video Stream (WebRTC) */}
                    <video 
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-contain ${roomState.isScreenSharing && !isTeacher ? 'block' : 'hidden'}`}
                    />

                    {/* EMPTY STATE */}
                    {!roomState.isScreenSharing && !isSharingScreen && (
                        <div className="flex flex-col items-center justify-center text-slate-500">
                            <Monitor size={64} className="opacity-20 mb-4" />
                            <p className="text-sm font-mono">Экран не транслируется</p>
                            
                            {isTeacher && (
                                <button onClick={startScreenShare} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2 transition-all">
                                    <Monitor size={16} /> Начать демонстрацию
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Chat Panel */}
                <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
                    <div className="p-4 border-b border-slate-700 bg-slate-800">
                        <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare size={14} /> Чат курса
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.length === 0 && <div className="text-center text-slate-500 text-xs py-10 opacity-50">Сообщений пока нет</div>}
                        {messages.map((msg, idx) => {
                            const isMe = msg.username === user.name;
                            const isMsgTeacher = msg.role === Role.TEACHER || msg.role === Role.ADMIN;
                            return (
                                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className={`text-[10px] font-bold ${isMsgTeacher ? 'text-blue-400' : 'text-slate-400'}`}>{msg.username}</span>
                                    </div>
                                    <div className={`px-3 py-2 rounded-xl text-xs max-w-[90%] break-words leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-200 rounded-tl-none'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-slate-800 border-t border-slate-700">
                        {roomState.isChatLocked && !isTeacher ? (
                            <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                <Lock size={14} /> Чат заблокирован
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Сообщение..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                                <button type="submit" disabled={!newMessage.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50">
                                    <Send size={16} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {isTeacher && !roomState.isActive && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                    <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center max-w-md shadow-2xl">
                        <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-400">
                            <Video size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Начать занятие</h2>
                        <div className="flex gap-4 justify-center mt-6">
                             <button onClick={onBack} className="px-6 py-3 rounded-xl bg-slate-700 text-slate-300 font-bold uppercase text-xs hover:bg-slate-600">Отмена</button>
                             <button onClick={startRoom} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold uppercase text-xs hover:bg-blue-500 shadow-lg">Открыть комнату</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
