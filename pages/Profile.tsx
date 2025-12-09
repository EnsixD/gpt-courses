

import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { GROUPS_DATA, API_URL } from '../constants';
import { Save, Loader2, CheckCircle, Plus, X } from 'lucide-react';

interface ProfileProps {
    user: User;
    onUpdateUser?: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
    // Student State
    const [selectedGroup, setSelectedGroup] = useState<string>(user.groupId || "0");
    
    // Teacher State
    const [curatedGroups, setCuratedGroups] = useState<string[]>(user.curatedGroups || []);
    const [groupToAdd, setGroupToAdd] = useState<string>("0");

    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Sync state if user prop updates from parent
    useEffect(() => {
        if (user.groupId) setSelectedGroup(user.groupId);
        if (user.curatedGroups) setCuratedGroups(user.curatedGroups);
    }, [user]);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        setShowSuccess(false);
        try {
            const body: any = { username: user.username };
            if (user.role === Role.STUDENT) body.groupId = selectedGroup;
            if (user.role === Role.TEACHER) body.curatedGroups = curatedGroups;

            const res = await fetch(`${API_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                if (onUpdateUser) {
                    onUpdateUser({ ...user, groupId: selectedGroup, curatedGroups: curatedGroups });
                }
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                alert('Ошибка при сохранении');
            }
        } catch (e) {
            console.error(e);
            alert('Ошибка соединения');
        } finally {
            setIsSaving(false);
        }
    };

    const addCuratedGroup = () => {
        if (groupToAdd !== "0" && !curatedGroups.includes(groupToAdd)) {
            setCuratedGroups([...curatedGroups, groupToAdd]);
            setGroupToAdd("0");
        }
    };

    const removeCuratedGroup = (id: string) => {
        setCuratedGroups(curatedGroups.filter(g => g !== id));
    };

    const getGroupName = (id: string) => {
        for (const groups of Object.values(GROUPS_DATA)) {
            const g = groups.find(g => g.id === id);
            if (g) return g.name;
        }
        return id;
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm h-full overflow-y-auto">
            <h2 className="text-2xl font-mono font-bold text-slate-800 mb-6">Настройки Профиля</h2>
            <div className="max-w-xl space-y-6">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-3xl font-bold shadow-inner">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
                        <span className="text-sm font-mono text-slate-400">@{user.username}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-1">
                    <label className="text-xs font-bold uppercase text-slate-500">ФИО</label>
                    <input disabled value={user.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 font-medium cursor-not-allowed opacity-70" />
                </div>
                <div className="grid grid-cols-1 gap-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Роль</label>
                    <input disabled value={user.role} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 uppercase font-bold tracking-wider cursor-not-allowed opacity-70" />
                </div>

                {/* STUDENT GROUP SELECTION */}
                {user.role === Role.STUDENT && (
                    <div className="grid grid-cols-1 gap-1 p-4 border border-blue-100 bg-blue-50/30 rounded-2xl">
                        <label className="text-xs font-bold uppercase text-blue-600 mb-2 block">Учебная группа</label>
                        <div className="flex gap-2">
                            <select 
                                id="sel_group"
                                value={selectedGroup}
                                onChange={(e) => {
                                    setSelectedGroup(e.target.value);
                                    setShowSuccess(false);
                                }}
                                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                            >
                                <option value="0">-- Выберите вашу группу --</option>
                                {Object.entries(GROUPS_DATA).map(([dept, groups]) => (
                                    <optgroup key={dept} label={dept}>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <button 
                                onClick={handleSaveSettings}
                                disabled={isSaving || selectedGroup === "0"}
                                className={`px-4 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 min-w-[60px] ${
                                    showSuccess 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : showSuccess ? <CheckCircle size={20} /> : <Save size={20} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                            <span className="font-bold text-red-400">*</span> Обязательно выберите правильную группу. От этого зависит, какие курсы и расписание вы будете видеть.
                        </p>
                    </div>
                )}
                
                {/* TEACHER CURATORSHIP */}
                {user.role === Role.TEACHER && (
                    <div className="grid grid-cols-1 gap-1 p-4 border border-blue-100 bg-blue-50/30 rounded-2xl">
                         <label className="text-xs font-bold uppercase text-blue-600 mb-2 block">Кураторство групп</label>
                         
                         <div className="flex flex-wrap gap-2 mb-3">
                             {curatedGroups.map(gid => (
                                 <span key={gid} className="bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                                     {getGroupName(gid)}
                                     <button onClick={() => removeCuratedGroup(gid)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                                 </span>
                             ))}
                             {curatedGroups.length === 0 && <span className="text-sm text-slate-400 italic">Нет курируемых групп</span>}
                         </div>

                         <div className="flex gap-2">
                            <select 
                                value={groupToAdd}
                                onChange={(e) => setGroupToAdd(e.target.value)}
                                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                <option value="0">Добавить группу...</option>
                                {Object.entries(GROUPS_DATA).map(([dept, groups]) => (
                                    <optgroup key={dept} label={dept}>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <button onClick={addCuratedGroup} className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-2 rounded-xl transition-colors">
                                <Plus size={20} />
                            </button>
                         </div>

                         <div className="mt-4 pt-4 border-t border-blue-200/50 flex justify-end">
                             <button 
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className={`px-6 py-2 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 font-bold uppercase text-xs gap-2 ${
                                    showSuccess 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : showSuccess ? <CheckCircle size={16} /> : <Save size={16} />}
                                <span>Сохранить</span>
                            </button>
                         </div>
                    </div>
                )}

                 <div className="grid grid-cols-1 gap-1">
                    <label className="text-xs font-bold uppercase text-slate-500">ID Пользователя</label>
                    <input disabled value={user.id} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-400 font-mono text-sm cursor-not-allowed opacity-70" />
                </div>
            </div>
        </div>
    );
};