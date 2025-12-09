import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Reminder, User, Role } from "../types";
import { API_URL } from "../constants";

interface CalendarProps {
  reminders: Reminder[];
  isLoading: boolean;
  user: User;
  onAddLocalReminder: (reminder: Reminder) => void;
  onDeleteLocalReminder: (id: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  reminders,
  isLoading,
  user,
  onAddLocalReminder,
  onDeleteLocalReminder,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [animClass, setAnimClass] = useState("animate-fadeIn");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventType, setEventType] = useState<"exam" | "attention" | "other">(
    "other"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay(); // 0 is Sunday

  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];

  const changeMonth = (increment: number) => {
    setAnimClass(increment > 0 ? "animate-slide-right" : "animate-slide-left");
    setTimeout(() => {
      setCurrentDate(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + increment,
          1
        )
      );
    }, 0);
  };

  const setToday = () => {
    const now = new Date();
    setAnimClass("animate-fadeIn");
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // On mobile, scroll to events panel if needed (optional UX improvement)
  };

  const getRemindersForDate = (date: Date) => {
    const dateStr = date.toLocaleDateString("en-CA");
    return reminders.filter(
      (r) => r.reminderDate && r.reminderDate.startsWith(dateStr)
    );
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other clicks
    if (!window.confirm("Вы уверены, что хотите удалить это событие?")) return;

    try {
      const response = await fetch(`${API_URL}/api/reminders/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDeleteLocalReminder(id);
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting reminder:", error);
      alert("Не удалось удалить событие. Проверьте соединение.");
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setIsSubmitting(true);

    const newEventData = {
      title: eventTitle,
      description: eventDesc,
      specialization: "НА", // Hardcoded for this demo context
      year: 1, // Hardcoded for this demo context
      teacherName: user.name,
      reminderDate: selectedDate.toLocaleDateString("en-CA"),
      category: eventType,
    };

    try {
      // Attempt to save to DB
      const response = await fetch(`${API_URL}/api/reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEventData),
      });

      if (response.ok) {
        const savedReminder = await response.json();
        onAddLocalReminder(savedReminder);
      } else {
        throw new Error("Failed to save to server");
      }
    } catch (error) {
      console.error("Server error, saving locally for session:", error);
      const localId = Date.now().toString(36);
      const localReminder: Reminder = {
        id: localId,
        ...newEventData,
        createdAt: new Date().toISOString(),
      };
      onAddLocalReminder(localReminder);
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
      setEventTitle("");
      setEventDesc("");
      setEventType("other");
    }
  };

  const renderCalendarDays = () => {
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="min-h-[4rem] md:min-h-[6rem] bg-slate-50/30 rounded-xl border border-transparent"
        ></div>
      );
    }

    const today = new Date();
    const isCurrentMonth =
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const isToday = isCurrentMonth && day === today.getDate();
      const isSelected =
        selectedDate &&
        dateObj.getDate() === selectedDate.getDate() &&
        dateObj.getMonth() === selectedDate.getMonth() &&
        dateObj.getFullYear() === selectedDate.getFullYear();

      const dayReminders = getRemindersForDate(dateObj);
      const hasExam = dayReminders.some((r) => r.category === "exam");
      const hasAttention = dayReminders.some((r) => r.category === "attention");

      let cellClass =
        "min-h-[4rem] md:min-h-[6rem] p-2 md:p-3 rounded-xl flex flex-col justify-between transition-all duration-200 cursor-pointer border relative overflow-hidden group";

      let bgClass = "";
      let textClass = "";
      let borderClass = "";

      if (isSelected) {
        bgClass = "bg-white";
        borderClass = "border-blue-500 shadow-md ring-1 ring-blue-500 z-10";
        textClass = "text-blue-600";
      } else if (isToday) {
        bgClass = "bg-blue-50/60";
        borderClass = "border-blue-300";
        textClass = "text-blue-600";
      } else if (isWeekend) {
        bgClass = "bg-slate-100/60";
        borderClass = "border-slate-100 hover:border-slate-300";
        textClass = "text-slate-400";
      } else {
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
            <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-bl-2xl flex items-center justify-center">
              <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-white rounded-full"></div>
            </div>
          )}

          <div className="flex justify-between items-start">
            <span
              className={`text-xs md:text-sm font-bold font-mono ${textClass} ${
                isSelected ? "scale-110" : ""
              } transition-transform`}
            >
              {day}
            </span>
            <div className="flex gap-1 mt-1">
              {hasExam && (
                <div
                  className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 shadow-sm shadow-red-200"
                  title="Экзамен"
                ></div>
              )}
              {hasAttention && (
                <div
                  className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-200"
                  title="Важно"
                ></div>
              )}
              {!hasExam && !hasAttention && dayReminders.length > 0 && (
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-200"></div>
              )}
            </div>
          </div>

          <div className="mt-auto space-y-1 hidden md:block">
            {dayReminders.slice(0, 2).map((rem, idx) => (
              <div
                key={idx}
                className={`text-[9px] font-bold truncate px-1.5 py-0.5 rounded-md ${
                  rem.category === "exam"
                    ? "bg-red-50 text-red-600"
                    : rem.category === "attention"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {rem.title}
              </div>
            ))}
            {dayReminders.length > 2 && (
              <div className="text-[9px] text-slate-400 pl-1 font-bold">
                + еще {dayReminders.length - 2}
              </div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  const selectedReminders = selectedDate
    ? getRemindersForDate(selectedDate)
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden relative">
      {/* Events Panel - Reordered on mobile to show selected events clearly */}
      <div
        className={`
            lg:w-80 bg-white rounded-3xl p-4 md:p-6 flex flex-col shadow-sm border border-slate-100 shrink-0
            ${
              selectedDate
                ? "order-1 lg:order-none h-[40vh] lg:h-full"
                : "hidden lg:flex lg:h-full"
            }
            overflow-hidden
        `}
      >
        <div className="mb-4 shrink-0 flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold font-mono text-slate-800 mb-1">
              События
            </h2>
            <p className="text-xs text-slate-400">Синхронизировано</p>
          </div>
          {isLoading && (
            <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-2"></div>
          )}
        </div>

        {selectedDate ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 md:p-5 rounded-2xl mb-4 shadow-lg shadow-blue-200 text-white shrink-0">
              <div className="text-[10px] font-bold text-blue-100 uppercase tracking-wider mb-1 opacity-80">
                Выбрана дата
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-black font-mono tracking-tighter">
                  {selectedDate.getDate()}
                </span>
                <span className="text-base md:text-lg font-bold">
                  {monthNames[selectedDate.getMonth()]}
                </span>
              </div>
              <div className="text-xs md:text-sm text-blue-100 mt-1 font-medium opacity-80">
                {selectedDate.toLocaleDateString("ru-RU", { weekday: "long" })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar -mr-1">
              {selectedReminders.length > 0 ? (
                <div className="space-y-3 pb-4">
                  {selectedReminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="bg-white border border-slate-100 p-3 md:p-4 rounded-xl shadow-sm hover:shadow-md transition-all group relative"
                    >
                      <div className="flex justify-between items-start mb-2 pr-6">
                        <span
                          className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                            rem.category === "exam"
                              ? "bg-red-50 text-red-600"
                              : rem.category === "attention"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {rem.category === "exam"
                            ? "Экзамен"
                            : rem.category === "attention"
                            ? "Важно"
                            : "Заметка"}
                        </span>
                      </div>

                      {/* Delete Button - Only for Teachers/Admins */}
                      {(user.role === Role.TEACHER ||
                        user.role === Role.ADMIN) && (
                        <button
                          onClick={(e) => handleDeleteEvent(rem.id, e)}
                          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-100 lg:opacity-0 group-hover:opacity-100"
                          title="Удалить событие"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      <h4 className="font-bold text-slate-800 text-sm mb-1">
                        {rem.title}
                      </h4>
                      {rem.description && (
                        <p className="text-xs text-slate-500 leading-relaxed mb-2">
                          {rem.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {rem.teacherName.charAt(0)}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            {rem.teacherName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-300 font-mono">
                          {rem.specialization}-{rem.year}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center opacity-60 mt-4 md:mt-10">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <Clock size={24} className="text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500 font-bold">
                    Нет событий
                  </p>
                </div>
              )}
            </div>

            {(user.role === Role.TEACHER || user.role === Role.ADMIN) && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 mt-4 shrink-0"
              >
                <Plus size={16} />
                <span className="hidden md:inline">Добавить событие</span>
                <span className="md:hidden">Добавить</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300 animate-pulse">
              <CalendarIcon size={32} />
            </div>
            <p className="text-slate-600 font-bold text-sm">Выберите дату</p>
            <p className="text-xs text-slate-400 mt-2 max-w-[180px] leading-relaxed">
              Нажмите на любой день в календаре.
            </p>
          </div>
        )}
      </div>

      {/* Calendar Grid - Flexible height */}
      <div className="flex-1 bg-white rounded-3xl p-4 md:p-6 shadow-sm overflow-hidden flex flex-col border border-slate-100 order-2 lg:order-none">
        <div className="flex justify-between items-center mb-4 md:mb-6 shrink-0">
          <div className="flex gap-2 md:gap-3 items-center">
            <button
              onClick={() => changeMonth(-1)}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors bg-white border border-slate-200 text-slate-600 shadow-sm active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex flex-col md:flex-row md:items-baseline md:gap-3 justify-center px-2 min-w-[140px] md:min-w-[220px]">
              <h2 className="text-lg md:text-2xl font-black font-mono text-slate-800 tracking-tight leading-none text-center">
                {monthNames[currentDate.getMonth()]}
              </h2>
              <span className="text-xs md:text-xl font-bold text-slate-400 tracking-widest text-center">
                {currentDate.getFullYear()}
              </span>
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors bg-white border border-slate-200 text-slate-600 shadow-sm active:scale-95"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            onClick={setToday}
            className="bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors border border-slate-200 hover:border-blue-200 shadow-sm"
          >
            Сегодня
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 px-1 shrink-0">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d, i) => (
            <div
              key={d}
              className={`text-center text-[10px] font-black uppercase tracking-widest py-2 rounded-lg ${
                i >= 5
                  ? "text-red-300 bg-red-50/50"
                  : "text-slate-400 bg-slate-50"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar overflow-x-hidden">
          <div
            key={currentDate.toISOString()}
            className={`grid grid-cols-7 gap-1 md:gap-2 pb-2 ${animClass}`}
          >
            {renderCalendarDays()}
          </div>
        </div>
      </div>

      {/* Modal For Adding Events (Mobile Friendly) */}
      {isModalOpen && selectedDate && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden animate-slideUp max-h-full overflow-y-auto">
            {/* ... (Modal content same as before) ... */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Новое событие</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            {/* ... form content ... */}
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Тип события
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEventType("exam")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                      eventType === "exam"
                        ? "bg-red-500 text-white shadow-md shadow-red-200"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Экзамен
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventType("attention")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                      eventType === "attention"
                        ? "bg-amber-400 text-white shadow-md shadow-amber-200"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Важно
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventType("other")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                      eventType === "other"
                        ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Заметка
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Заголовок
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Например: Сдача курсовой"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Описание (опционально)
                </label>
                <textarea
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Дополнительная информация..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 h-24 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Сохранить</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
