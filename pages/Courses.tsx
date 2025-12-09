

import React, { useState, useEffect } from 'react';
import { GraduationCap, ArrowRight, BookDashed, Plus, X, Loader2, CheckCircle2, Clock, Trash2, AlertTriangle, Video, FileText } from 'lucide-react';
import { View, User, Role, Course } from '../types';
import { API_URL, GROUPS_DATA } from '../constants';

interface CoursesProps {
    onNavigate: (view: View) => void;
    onCourseSelect: (courseId: string) => void;
    user: User;
}

export const Courses: React.FC<CoursesProps> = ({ onNavigate, onCourseSelect, user }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [enrollmentStatuses, setEnrollmentStatuses] = useState<Record<string, string | null>>({});
    
    // Create Course Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCourseTitle, setNewCourseTitle] = useState('');
    const [newCourseHours, setNewCourseHours] = useState('');
    const [newCourseSpec, setNewCourseSpec] = useState('НА');
    const [targetGroup, setTargetGroup] = useState<string>('0');
    const [isCreating, setIsCreating] = useState(false);

    const fetchCourses = async () => {
        try {
            const response = await fetch(`${API_URL}/api/courses`);
            if (response.ok) {
                const data = await response.json();
                setCourses(data);
                
                // If student, check enrollments
                if (user.role === Role.STUDENT) {
                    checkEnrollments(data);
                }
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkEnrollments = async (courseList: Course[]) => {
        const statuses: Record<string, string | null> = {};
        for (const course of courseList) {
            try {
                const res = await fetch(`${API_URL}/api/enrollments/${user.username}/${course.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.enrolled) {
                        statuses[course.id] = data.status || 'active';
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
        setEnrollmentStatuses(statuses);
    };

    useEffect(() => {
        fetchCourses();
    }, [user.groupId]); // Re-fetch if group changes

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const response = await fetch(`${API_URL}/api/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newCourseTitle,
                    totalHours: Number(newCourseHours),
                    specialization: newCourseSpec,
                    year: 1,
                    teacherName: user.name,
                    targetGroup: targetGroup === '0' ? null : targetGroup
                })
            });

            if (response.ok) {
                await fetchCourses();
                setIsCreateModalOpen(false);
                setNewCourseTitle('');
                setNewCourseHours('');
                setTargetGroup('0');
            }
        } catch (error) {
            console.error("Error creating course:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот курс? Все материалы и оценки будут потеряны.')) return;
        
        try {
            const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setCourses(prev => prev.filter(c => c.id !== courseId));
            } else {
                alert('Не удалось удалить курс');
            }
        } catch (error) {
            console.error("Error deleting course:", error);
        }
    };

    const handleEnroll = async (courseId: string) => {
        try {
            const response = await fetch(`${API_URL}/api/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    courseId: courseId
                })
            });

            if (response.ok) {
                setEnrollmentStatuses(prev => ({ ...prev, [courseId]: 'pending' }));
                alert("Заявка на участие отправлена. Ожидайте подтверждения преподавателя.");
            }
        } catch (error) {
            console.error("Error enrolling:", error);
        }
    };

    const handleEnterRoom = (courseId: string) => {
        // We pass the ID via onCourseSelect but App.tsx needs to handle the view change to ROOM
        // We will abuse onCourseSelect to pass data, but we need to tell App to go to ROOM.
        // Actually, we need to add a way to navigate to ROOM.
        // For now, let's use onNavigate(View.COURSE_ROOM) and handle the ID in App state.
        // To keep it simple without changing props too much:
        // We will use a special 'room:' prefix or similar if we can't change props, 
        // OR we just assume onCourseSelect sets the ID, then we call onNavigate(ROOM).
        onCourseSelect(courseId); // Sets selectedCourseId in App
        onNavigate(View.COURSE_ROOM); // Switches view
    };

    const handleOpenMaterials = (courseId: string) => {
        onCourseSelect(courseId);
        onNavigate(View.COURSE_DETAILS);
    }

    // STRICT VISIBILITY LOGIC
    const visibleCourses = user.role === Role.STUDENT 
        ? courses.filter(c => {
            if (!user.groupId || user.groupId === '0') {
                return false;
            }
            const isEnrolled = enrollmentStatuses[c.id];
            const isGlobal = !c.targetGroup || c.targetGroup === '0';
            const matchesGroup = c.targetGroup === user.groupId;
            return isEnrolled || isGlobal || matchesGroup;
        }) 
        : courses;

    const needsGroupSelection = user.role === Role.STUDENT && (!user.groupId || user.groupId === '0');

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm h-full overflow-y-auto flex flex-col relative">
             <div className="mb-8 shrink-0 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-mono font-bold text-slate-800 mb-1">Курсы</h2>
                    <p className="text-sm text-slate-400">
                        {user.role === Role.STUDENT
                         ? "Ваши учебные программы"
                         : "Доступные учебные программы"}
                    </p>
                </div>
                {(user.role === Role.TEACHER || user.role === Role.ADMIN) && (
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        Создать курс
                    </button>
                )}
             </div>

             {/* Group Warning for Students */}
             {needsGroupSelection && (
                 <div className="mb-8 bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col items-center gap-4 animate-fadeIn text-center">
                     <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0 mb-2">
                         <AlertTriangle size={32} />
                     </div>
                     <div className="flex-1">
                         <h4 className="font-bold text-slate-800 text-lg">Вы не выбрали группу!</h4>
                         <p className="text-slate-600 mt-2 max-w-md mx-auto">
                             Для отображения списка курсов необходимо указать вашу учебную группу в профиле. Без этого система не может подобрать для вас учебную программу.
                         </p>
                         <button 
                            onClick={() => onNavigate(View.PROFILE)} 
                            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold uppercase text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                         >
                            Перейти в профиль
                         </button>
                     </div>
                 </div>
             )}

             {isLoading ? (
                 <div className="flex-1 flex items-center justify-center">
                     <Loader2 className="animate-spin text-blue-500" size={40} />
                 </div>
             ) : visibleCourses.length === 0 ? (
                 !needsGroupSelection && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 pb-20">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 relative">
                            <BookDashed size={48} className="text-slate-300" />
                            <div className="absolute -bottom-2 -right-2 bg-blue-100 text-blue-600 p-2 rounded-full">
                                <GraduationCap size={20} />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Курсы не найдены</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                            Для вашей группы пока нет активных курсов.
                        </p>
                    </div>
                 )
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                    {visibleCourses.map(course => {
                        const status = enrollmentStatuses[course.id];
                        const isTeacher = user.role === Role.TEACHER || user.role === Role.ADMIN;
                        
                        let targetGroupName = "";
                        if (course.targetGroup) {
                            for (const grps of Object.values(GROUPS_DATA)) {
                                const g = grps.find(g => g.id === course.targetGroup);
                                if (g) targetGroupName = g.name;
                            }
                        }

                        return (
                            <div key={course.id} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all group flex flex-col relative">
                                {isTeacher && (
                                    <button 
                                        onClick={() => handleDeleteCourse(course.id)}
                                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors z-10"
                                        title="Удалить курс"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <GraduationCap size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded mr-8">
                                        {course.specialization}
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{course.title}</h3>
                                <div className="text-xs text-slate-500 mb-6 flex flex-col gap-1">
                                    <span>Преподаватель: <span className="font-bold text-slate-700">{course.teacherName}</span></span>
                                    <span>Объем: {course.totalHours} часов</span>
                                    {targetGroupName && (
                                        <span className="text-blue-600 font-bold mt-1">Группа: {targetGroupName}</span>
                                    )}
                                </div>

                                <div className="mt-auto space-y-2">
                                    {isTeacher ? (
                                        <>
                                            <button 
                                                onClick={() => handleEnterRoom(course.id)}
                                                className="w-full bg-slate-800 hover:bg-blue-600 text-white py-2.5 rounded-xl font-bold transition-all text-xs uppercase flex items-center justify-center gap-2"
                                            >
                                                <Video size={16} /> Live Комната
                                            </button>
                                            <button 
                                                onClick={() => handleOpenMaterials(course.id)}
                                                className="w-full border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 py-2.5 rounded-xl font-bold transition-all text-xs uppercase flex items-center justify-center gap-2"
                                            >
                                                <FileText size={16} /> Материалы
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {status === 'active' ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button 
                                                        onClick={() => handleEnterRoom(course.id)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95"
                                                    >
                                                        <Video size={16} /> Live
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenMaterials(course.id)}
                                                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 border border-slate-200"
                                                    >
                                                        <FileText size={16} /> Задания
                                                    </button>
                                                </div>
                                            ) : status === 'pending' ? (
                                                <button disabled className="w-full bg-amber-50 text-amber-600 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-default">
                                                    <Clock size={16} />
                                                    Заявка отправлена
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleEnroll(course.id)}
                                                    className="w-full bg-slate-800 hover:bg-blue-600 text-white py-2.5 rounded-xl font-bold transition-all text-xs uppercase shadow-md active:scale-95"
                                                >
                                                    Записаться
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                 </div>
             )}

            {/* Create Course Modal */}
            {isCreateModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-slideUp">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Новый курс</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Название курса</label>
                                <input 
                                    type="text"
                                    value={newCourseTitle}
                                    onChange={e => setNewCourseTitle(e.target.value)}
                                    placeholder="Основы программирования"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    required
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="space-y-1 flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Часов</label>
                                    <input 
                                        type="number"
                                        value={newCourseHours}
                                        onChange={e => setNewCourseHours(e.target.value)}
                                        placeholder="72"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Спец.</label>
                                    <input 
                                        type="text"
                                        value={newCourseSpec}
                                        onChange={e => setNewCourseSpec(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Целевая группа</label>
                                <select 
                                    value={targetGroup} 
                                    onChange={(e) => setTargetGroup(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                >
                                    <option value="0">Для всех групп</option>
                                    {Object.entries(GROUPS_DATA).map(([dept, groups]) => (
                                        <optgroup key={dept} label={dept}>
                                            {groups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            <button 
                                type="submit"
                                disabled={isCreating}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 mt-4 disabled:opacity-70"
                            >
                                {isCreating ? 'Создание...' : 'Создать курс'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};