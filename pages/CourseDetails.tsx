

import React, { useState, useEffect } from 'react';
import { User, Role, Course, CourseContent } from '../types';
import { API_URL } from '../constants';
import { ChevronLeft, Plus, FileText, CheckCircle2, BookOpen, Loader2, X, Upload, Download, Eye } from 'lucide-react';

interface CourseDetailsProps {
    courseId: string;
    user: User;
    onBack: () => void;
}

export const CourseDetails: React.FC<CourseDetailsProps> = ({ courseId, user, onBack }) => {
    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Student Progress State (completed items)
    const [progress, setProgress] = useState<Record<string, { completedAt: string, studentFile?: string }>>({});

    // Add Content State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [contentType, setContentType] = useState<'theory' | 'assignment'>('theory');
    const [contentTitle, setContentTitle] = useState('');
    const [contentDesc, setContentDesc] = useState('');
    const [contentHours, setContentHours] = useState('2');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Submit Work State (Student)
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [submitTargetId, setSubmitTargetId] = useState<string | null>(null);
    const [submitFile, setSubmitFile] = useState<File | null>(null);
    const [isSubmittingWork, setIsSubmittingWork] = useState(false);

    // Review Work State (Teacher)
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewContentId, setReviewContentId] = useState<string | null>(null);
    const [reviewSubmissions, setReviewSubmissions] = useState<any[]>([]);
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

    const fetchCourseDetails = async () => {
        try {
            const res = await fetch(`${API_URL}/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStudentProgress = async () => {
        if (user.role !== Role.STUDENT) return;
        try {
            const res = await fetch(`${API_URL}/api/progress/${user.username}/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                // Convert array to map for easy lookup
                const progMap: any = {};
                data.forEach((p: any) => {
                    progMap[p.contentId] = { completedAt: p.completedAt, studentFile: p.studentFile };
                });
                setProgress(progMap);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchCourseDetails();
        fetchStudentProgress();
    }, [courseId]);

    const handleAddContent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);

        const formData = new FormData();
        formData.append('title', contentTitle);
        formData.append('kind', contentType);
        formData.append('description', contentDesc);
        formData.append('hours', contentHours);
        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        try {
            const res = await fetch(`${API_URL}/api/courses/${courseId}/contents`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                await fetchCourseDetails();
                setIsAddModalOpen(false);
                setContentTitle('');
                setContentDesc('');
                setSelectedFile(null);
            }
        } catch (e) {
            console.error(e);
            alert("Ошибка при загрузке");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmitWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submitTargetId || !submitFile) return;
        
        setIsSubmittingWork(true);
        const formData = new FormData();
        formData.append('username', user.username);
        formData.append('courseId', courseId);
        formData.append('contentId', submitTargetId);
        formData.append('file', submitFile);

        try {
            const res = await fetch(`${API_URL}/api/submissions`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                await fetchStudentProgress();
                setIsSubmitModalOpen(false);
                setSubmitFile(null);
                setSubmitTargetId(null);
                alert("Работа успешно отправлена!");
            }
        } catch (e) {
            console.error(e);
            alert("Ошибка отправки");
        } finally {
            setIsSubmittingWork(false);
        }
    };

    const handleViewSubmissions = async (contentId: string) => {
        setReviewContentId(contentId);
        setIsReviewModalOpen(true);
        setIsLoadingSubmissions(true);
        try {
            const res = await fetch(`${API_URL}/api/submissions/${contentId}`);
            if (res.ok) {
                const data = await res.json();
                setReviewSubmissions(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingSubmissions(false);
        }
    };

    if (isLoading) {
         return (
             <div className="flex items-center justify-center h-full bg-white rounded-3xl">
                 <Loader2 className="animate-spin text-blue-500" size={40} />
             </div>
         );
    }

    if (!course) {
        return <div className="p-8">Course not found</div>;
    }

    const theoryContents = course.contents?.filter(c => c.kind === 'theory') || [];
    const assignmentContents = course.contents?.filter(c => c.kind === 'assignment') || [];
    const isTeacher = user.role === Role.TEACHER || user.role === Role.ADMIN;

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 shrink-0">
                <button 
                    onClick={onBack}
                    className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-mono font-bold text-slate-800">{course.title}</h2>
                        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                            {course.specialization}-{course.year}
                        </span>
                    </div>
                    <p className="text-sm text-slate-400">Преподаватель: {course.teacherName}</p>
                </div>
                
                {isTeacher && (
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="ml-auto bg-slate-800 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        Добавить материал
                    </button>
                )}
            </div>

            {/* Content Lists */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-8">
                
                {/* Theory Section */}
                <section>
                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <BookOpen size={20} className="text-blue-500" />
                        Теоретический материал
                    </h3>
                    
                    {theoryContents.length === 0 ? (
                        <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100 border-dashed">
                            Материалы еще не добавлены.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {theoryContents.map(item => (
                                <div key={item.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex items-start justify-between group hover:border-blue-200 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 font-bold text-sm">
                                            {item.hours}ч
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                                            {item.teacherFile && (
                                                <a href={`${API_URL}${item.teacherFile}`} target="_blank" className="inline-block mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">
                                                    Скачать файл
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <button className="text-slate-300 hover:text-green-500 transition-colors">
                                        <CheckCircle2 size={24} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Assignments Section */}
                <section>
                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-orange-500" />
                        Практические задания
                    </h3>

                    {assignmentContents.length === 0 ? (
                        <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100 border-dashed">
                            Задания еще не добавлены.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {assignmentContents.map(item => {
                                const submitted = progress[item.id];
                                return (
                                    <div key={item.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex items-start justify-between group hover:border-orange-200 transition-colors">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 font-bold text-sm">
                                                {item.hours}ч
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                                                <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                                                {item.teacherFile && (
                                                    <a href={`${API_URL}${item.teacherFile}`} target="_blank" className="inline-block mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">
                                                        Скачать задание
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {isTeacher ? (
                                             <button 
                                                onClick={() => handleViewSubmissions(item.id)}
                                                className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-200 transition-colors flex items-center gap-2"
                                             >
                                                <Eye size={14} />
                                                Проверить
                                             </button>
                                        ) : (
                                            <div>
                                                {submitted ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                                            <CheckCircle2 size={14} /> Сдано
                                                        </span>
                                                        {submitted.studentFile && (
                                                            <a href={`${API_URL}${submitted.studentFile}`} target="_blank" className="text-[10px] text-blue-500 hover:underline mt-1">
                                                                Посмотреть файл
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => {
                                                            setSubmitTargetId(item.id);
                                                            setIsSubmitModalOpen(true);
                                                        }}
                                                        className="bg-orange-50 text-orange-600 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-orange-500 hover:text-white transition-colors"
                                                    >
                                                        Сдать работу
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            {/* Add Content Modal (Teacher) */}
            {isAddModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-slideUp">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Добавить материал курса</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddContent} className="p-6 space-y-4">
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-2">
                                <button 
                                    type="button" 
                                    onClick={() => setContentType('theory')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${contentType === 'theory' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Теория
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setContentType('assignment')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${contentType === 'assignment' ? 'bg-white shadow text-orange-500' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Задание
                                </button>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Тема</label>
                                <input 
                                    type="text"
                                    value={contentTitle}
                                    onChange={e => setContentTitle(e.target.value)}
                                    placeholder="Введите название темы"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Описание</label>
                                <textarea 
                                    value={contentDesc}
                                    onChange={e => setContentDesc(e.target.value)}
                                    placeholder="Инструкции или краткое содержание..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 h-24 resize-none"
                                />
                            </div>

                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Часов на выполнение</label>
                                <input 
                                    type="number"
                                    value={contentHours}
                                    onChange={e => setContentHours(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Файл (презентация/документ)</label>
                                <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-all group">
                                    <div className="bg-slate-100 p-2 rounded-lg text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                                        <Upload size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600">
                                            {selectedFile ? selectedFile.name : 'Выберите файл'}
                                        </span>
                                    </div>
                                    <input type="file" className="hidden" onChange={e => e.target.files && setSelectedFile(e.target.files[0])} />
                                </label>
                            </div>

                            <button 
                                type="submit"
                                disabled={isUploading}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-95 mt-4 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isUploading ? <Loader2 className="animate-spin" /> : 'Добавить'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Submit Work Modal (Student) */}
            {isSubmitModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fadeIn">
                     <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-slideUp">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Сдать работу</h3>
                            <button onClick={() => { setIsSubmitModalOpen(false); setSubmitFile(null); }} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitWork} className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 mb-2">Загрузите файл с выполненным заданием.</p>
                            
                            <label className="flex items-center gap-3 border-2 border-dashed border-blue-200 rounded-xl p-6 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group bg-blue-50/30">
                                <div className="bg-white p-3 rounded-xl text-blue-400 group-hover:text-blue-600 group-hover:bg-blue-100 transition-colors shadow-sm">
                                    <Upload size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                                        {submitFile ? submitFile.name : 'Выберите файл...'}
                                    </span>
                                    {!submitFile && <span className="text-xs text-slate-400 mt-1">DOCX, PDF, ZIP до 10МБ</span>}
                                </div>
                                <input type="file" className="hidden" onChange={e => e.target.files && setSubmitFile(e.target.files[0])} required />
                            </label>

                            <button 
                                type="submit"
                                disabled={isSubmittingWork || !submitFile}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmittingWork ? <Loader2 className="animate-spin" /> : 'Отправить на проверку'}
                            </button>
                        </form>
                     </div>
                </div>
            )}

            {/* Review Modal (Teacher) */}
            {isReviewModalOpen && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fadeIn">
                     <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-slideUp">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                            <div>
                                <h3 className="font-bold text-slate-800">Проверка заданий</h3>
                                <p className="text-xs text-slate-400 mt-1">Список студентов, сдавших работу</p>
                            </div>
                            <button onClick={() => setIsReviewModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2">
                            {isLoadingSubmissions ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
                            ) : reviewSubmissions.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <p>Работ пока нет</p>
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    {reviewSubmissions.map((sub, idx) => (
                                        <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {sub.username.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700 text-sm">{sub.username}</div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {new Date(sub.completedAt).toLocaleString('ru-RU')}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {sub.studentFile && (
                                                <a 
                                                    href={`${API_URL}${sub.studentFile}`} 
                                                    target="_blank"
                                                    className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Download size={14} /> Скачать
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                     </div>
                 </div>
            )}
        </div>
    );
};