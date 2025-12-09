import React from "react";
import { View, Role } from "../types";
import { Calendar, BookOpen, FileText, Settings, Info } from "lucide-react";

interface SidebarProps {
  currentView: View;
  role: Role;
  onChangeView: (view: View) => void;
  isCollapsed: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  role,
  onChangeView,
  isCollapsed,
  onCloseMobile,
}) => {
  const NavItem = ({
    view,
    label,
    icon: Icon,
  }: {
    view: View;
    label: string;
    icon: any;
  }) => {
    // Check if parent view is active
    const isActive =
      currentView === view ||
      (view === View.COURSES && currentView === View.COURSE_STUDENTS);

    return (
      <button
        onClick={() => {
          onChangeView(view);
          // Only close sidebar on mobile (width < 768px)
          if (window.innerWidth < 768 && onCloseMobile) {
            onCloseMobile();
          }
        }}
        className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 mb-2 font-medium relative overflow-hidden group ${
          isActive
            ? "bg-slate-800 text-white shadow-lg shadow-slate-200"
            : "text-slate-600 hover:bg-white hover:shadow-md hover:text-blue-600"
        } ${
          isCollapsed
            ? "justify-start md:justify-center gap-3 md:gap-0"
            : "gap-3"
        }`}
        title={isCollapsed ? label : ""}
      >
        <Icon
          size={22}
          className={`shrink-0 transition-colors ${
            isActive
              ? "text-blue-400"
              : "text-slate-400 group-hover:text-blue-500"
          }`}
        />

        {/* On mobile, we always show text even if "collapsed" logic is passed, because mobile uses drawer state */}
        <div
          className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed
              ? "md:w-0 md:opacity-0 w-auto opacity-100"
              : "w-auto opacity-100"
          }`}
        >
          <span className="ml-1">{label}</span>
        </div>
      </button>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isCollapsed
          ? "md:max-h-0 md:opacity-0 mb-2 md:mb-0"
          : "max-h-10 opacity-100 mb-2"
      }`}
    >
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-3 flex items-center gap-2">
        {title}
        <span className="h-[1px] bg-slate-200 flex-1"></span>
      </h3>
    </div>
  );

  return (
    <>
      {/* Sidebar Container */}
      <div
        className={`
                fixed inset-y-0 left-0 z-50 h-full bg-slate-50/90 backdrop-blur-md border-r border-white/50 p-4 shadow-xl transition-all duration-300 transform
                md:relative md:translate-x-0 md:shadow-sm md:rounded-3xl md:border md:bg-slate-50/80
                ${
                  isCollapsed
                    ? "md:w-20 -translate-x-full"
                    : "w-72 translate-x-0"
                }
            `}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Title (Only visible on mobile sidebar) */}
          <div className="md:hidden mb-6 px-2 pt-2">
            <h2 className="font-black font-mono text-xl text-slate-800">
              Меню
            </h2>
          </div>

          <div className="flex-1 py-2 overflow-y-auto custom-scrollbar">
            <SectionHeader title="Основное" />
            <NavItem view={View.CALENDAR} label="Календарь" icon={Calendar} />
            <NavItem view={View.COURSES} label="Мои курсы" icon={BookOpen} />

            <div
              className={`my-4 border-t border-slate-200/50 ${
                isCollapsed ? "mx-2" : "mx-0"
              }`}
            ></div>

            <SectionHeader title="Дополнительно" />
            <NavItem view={View.MATERIALS} label="Методички" icon={FileText} />
            {role === Role.ADMIN && (
              <NavItem view={View.ADMIN} label="Админка" icon={Settings} />
            )}
            <NavItem view={View.ABOUT} label="О платформе" icon={Info} />
          </div>
        </div>
      </div>
    </>
  );
};
