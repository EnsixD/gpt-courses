import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday
  
  // Adjust for Monday start (Russian locale style)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const changeMonth = (increment: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
  };

  const setToday = () => {
      const now = new Date();
      setCurrentDate(now);
      setSelectedDate(now);
  };

  const handleDateClick = (date: Date) => {
      setSelectedDate(date);
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty slots for previous month (visual placeholders)
    for (let i = 0; i < startDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[6rem] bg-slate-50/50 rounded-xl border border-slate-100"></div>
      );
    }

    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayOfWeek = dateObj.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 is Sunday, 6 is Saturday
        
        const isToday = isCurrentMonth && day === today.getDate();
        const isSelected = selectedDate && 
                           dateObj.getDate() === selectedDate.getDate() && 
                           dateObj.getMonth() === selectedDate.getMonth() && 
                           dateObj.getFullYear() === selectedDate.getFullYear();
        
        // Base styling for all day cells
        let cellClass = "min-h-[6rem] p-3 rounded-xl flex flex-col justify-between transition-all duration-200 cursor-pointer border relative overflow-hidden group";
        
        let bgClass = "";
        let textClass = "";
        let borderClass = "";

        if (isSelected) {
            // Selected state - no transform scale to prevent overflow, but strong visual cues
            bgClass = "bg-white";
            borderClass = "border-blue-500 shadow-md ring-1 ring-blue-500 z-10";
            textClass = "text-blue-600";
        } else if (isToday) {
            // Today state
            bgClass = "bg-blue-50/50";
            borderClass = "border-blue-300";
            textClass = "text-blue-600";
        } else if (isWeekend) {
            // Weekend state
            bgClass = "bg-slate-100/60";
            borderClass = "border-slate-100 hover:border-slate-300";
            textClass = "text-slate-400"; 
        } else {
            // Normal weekday
            bgClass = "bg-white";
            borderClass = "border-slate-200 hover:border-blue-300 hover:shadow-md";
            textClass = "text-slate-700";
        }

        days.push(
            <div 
                key={day} 
                onClick={() => handleDateClick(dateObj)}
                className={`${cellClass} ${bgClass} ${borderClass}`}
            >
                {isSelected && (
                    <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500 rounded-bl-2xl flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                )}
                
                <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold font-mono ${textClass} ${isSelected ? 'scale-110' : ''} transition-transform`}>{day}</span>
                    {isToday && !isSelected && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>}
                </div>
                
                {/* Content Placeholder */}
                <div className="mt-auto space-y-1">
                   {/* Fake event lines for visuals */}
                   {isToday && !isSelected && (
                      <div className="h-1 w-2/3 bg-blue-200 rounded-full"></div>
                   )}
                   {isSelected && (
                       <div className="flex justify-end">
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">Выбрано</span>
                       </div>
                   )}
                </div>
            </div>
        );
    }
    return days;
  };

  return (
    <div className="flex gap-4 h-full overflow-hidden">
        {/* Left Panel - Notifications/Events Info */}
        <div className="hidden lg:flex w-72 bg-white rounded-3xl p-6 flex-col shadow-sm border border-slate-100 shrink-0 h-full overflow-hidden">
            <div className="mb-6 shrink-0">
                <h2 className="text-lg font-bold font-mono text-slate-800 mb-1">События</h2>
                <p className="text-xs text-slate-400">Планирование и напоминания</p>
            </div>

            {selectedDate ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                     <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl mb-6 shadow-lg shadow-blue-200 text-white shrink-0">
                        <div className="text-[10px] font-bold text-blue-100 uppercase tracking-wider mb-2 opacity-80">Выбрана дата</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black font-mono tracking-tighter">
                                {selectedDate.getDate()}
                            </span>
                            <span className="text-lg font-bold">
                                {monthNames[selectedDate.getMonth()]}
                            </span>
                        </div>
                        <div className="text-sm text-blue-100 mt-1 font-medium opacity-80">
                            {selectedDate.toLocaleDateString('ru-RU', { weekday: 'long' })}
                        </div>
                     </div>

                     <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 mb-4 overflow-y-auto">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                             <Clock size={32} className="text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-500 font-bold">Нет событий</p>
                        <p className="text-xs text-slate-400 mt-1 px-4">На этот день пока ничего не запланировано.</p>
                     </div>

                     <button className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 mt-auto shrink-0">
                        <Plus size={16} />
                        Добавить событие
                     </button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300 animate-pulse">
                        <CalendarIcon size={32} />
                     </div>
                     <p className="text-slate-600 font-bold text-sm">Выберите дату</p>
                     <p className="text-xs text-slate-400 mt-2 max-w-[180px] leading-relaxed">Нажмите на любой день в календаре, чтобы управлять событиями.</p>
                </div>
            )}
        </div>

        {/* Right Panel - Calendar Grid */}
        <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col border border-slate-100">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex gap-3 items-center">
                    <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors bg-white border border-slate-200 text-slate-600 shadow-sm active:scale-95">
                        <ChevronLeft size={20}/>
                    </button>
                    <div className="flex flex-col justify-center px-2 min-w-[160px]">
                        <h2 className="text-xl font-black font-mono text-slate-800 uppercase tracking-tight leading-none">
                            {monthNames[currentDate.getMonth()]}
                        </h2>
                        <span className="text-xs font-bold text-slate-400 tracking-widest mt-1">{currentDate.getFullYear()}</span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors bg-white border border-slate-200 text-slate-600 shadow-sm active:scale-95">
                         <ChevronRight size={20}/>
                    </button>
                </div>
                <button 
                    onClick={setToday}
                    className="bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-slate-200 hover:border-blue-200 shadow-sm"
                >
                    Сегодня
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 px-1 shrink-0">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => (
                    <div key={d} className={`text-center text-[10px] font-black uppercase tracking-widest py-2 rounded-lg ${i >= 5 ? 'text-red-300 bg-red-50/50' : 'text-slate-400 bg-slate-50'}`}>{d}</div>
                ))}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-7 gap-2 pb-2">
                    {renderCalendarDays()}
                </div>
            </div>
        </div>
    </div>
  );
};