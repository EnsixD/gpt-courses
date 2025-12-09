import React from 'react';
import { View, Role } from '../types';
import { Calendar, BookOpen, FileText, Settings, Info } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  role: Role;
  onChangeView: (view: View) => void;
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, role, onChangeView, isCollapsed }) => {
  const NavItem = ({ view, label, icon: Icon }: { view: View; label: string; icon: any }) => {
    // Check if parent view is active
    const isActive = currentView === view || (view === View.COURSES && currentView === View.COURSE_STUDENTS);
    
    return (
      <button
        onClick={() => onChangeView(view)}
        className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 mb-2 font-medium relative overflow-hidden group ${
          isActive
            ? 'bg-slate-800 text-white shadow-lg shadow-slate-200'
            : 'text-slate-600 hover:bg-white hover:shadow-md hover:text-blue-600'
        } ${isCollapsed ? 'justify-center gap-0' : 'gap-3'}`}
        title={isCollapsed ? label : ''}
      >
        <Icon size={22} className={`shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-500'}`} />
        
        <div className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
             <span className="ml-1">{label}</span>
        </div>
      </button>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-10 opacity-100 mb-2'}`}>
         <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-3 flex items-center gap-2">
            {title}
            <span className="h-[1px] bg-slate-200 flex-1"></span>
         </h3>
      </div>
  );

  return (
    <div 
        className={`${isCollapsed ? 'w-20' : 'w-72'} bg-slate-50/80 backdrop-blur-md border border-white/50 p-4 rounded-3xl h-full shadow-sm flex flex-col transition-all duration-300 relative`}
    >
      <div className="flex-1 py-2">
        <SectionHeader title="Основное" />
        <NavItem view={View.CALENDAR} label="Календарь" icon={Calendar} />
        <NavItem view={View.COURSES} label="Мои курсы" icon={BookOpen} />

        <div className={`my-4 border-t border-slate-200/50 ${isCollapsed ? 'mx-2' : 'mx-0'}`}></div>

        <SectionHeader title="Дополнительно" />
        <NavItem view={View.MATERIALS} label="Методички" icon={FileText} />
        {role === Role.ADMIN && (
          <NavItem view={View.ADMIN} label="Админка" icon={Settings} />
        )}
        <NavItem view={View.ABOUT} label="О платформе" icon={Info} />
      </div>
    </div>
  );
};