import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { LogOut, User as UserIcon, Bell, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onProfileClick: () => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onProfileClick, onToggleSidebar, isSidebarCollapsed }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.ADMIN: return <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Администратор</span>;
      case Role.TEACHER: return <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Преподаватель</span>;
      default: return <span className="bg-slate-500 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Студент</span>;
    }
  };

  return (
    <header className="bg-[#5c9bc5] text-white p-4 flex items-center justify-between shadow-md mb-6">
      <div className="flex items-center gap-4">
        <button 
            onClick={onToggleSidebar}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors text-white mr-1 active:scale-95"
            title={isSidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}
        >
            {isSidebarCollapsed ? <PanelLeftOpen size={24} /> : <PanelLeftClose size={24} />}
        </button>

        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#5c9bc5]">
          <UserIcon size={24} />
        </div>
        <div className="flex flex-col">
          {getRoleBadge(user.role)}
          <span className="font-mono font-bold text-lg leading-tight mt-0.5">{user.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
         <div className="font-mono text-xl font-bold tracking-widest opacity-90 hidden sm:block">
            {time.toLocaleTimeString('ru-RU')}
         </div>
         
         <div className="flex gap-2">
            <button 
                onClick={onProfileClick}
                className="bg-white text-[#5c9bc5] hover:bg-slate-100 px-4 py-1.5 rounded text-sm font-bold uppercase transition-colors shadow-sm"
            >
                Профиль
            </button>
            <button 
                onClick={onLogout}
                className="bg-[#8ecae6] hover:bg-[#a6dcf5] text-slate-800 px-4 py-1.5 rounded text-sm font-bold uppercase transition-colors shadow-sm flex items-center gap-2"
            >
                <LogOut size={16} />
                <span className="hidden sm:inline">Выйти</span>
            </button>
         </div>
      </div>
    </header>
  );
};