import React from "react";
import { View } from "../types";
import { ChevronLeft, User, Search, MoreHorizontal } from "lucide-react";

interface CourseStudentsProps {
  onBack: () => void;
}

export const CourseStudents: React.FC<CourseStudentsProps> = ({ onBack }) => {
  // Mock Data
  const students = [
    { id: 1, name: "Алексей Иванов", email: "alex@example.com", progress: 85 },
    { id: 2, name: "Мария Петрова", email: "maria@example.com", progress: 92 },
    {
      id: 3,
      name: "Дмитрий Сидоров",
      email: "dmitry@example.com",
      progress: 45,
    },
    { id: 4, name: "Елена Козлова", email: "elena@example.com", progress: 78 },
    {
      id: 5,
      name: "Николай Волков",
      email: "nikolay@example.com",
      progress: 60,
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-4 md:p-8 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-mono font-bold text-slate-800">
            Студенты курса
          </h2>
          <p className="text-sm text-slate-400">Введение в React</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-auto">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Поиск студента..."
            className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider w-full md:w-auto text-right">
          Всего студентов:{" "}
          <span className="text-slate-800">{students.length}</span>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-100 text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200">
                <th className="p-4 pl-6 font-bold">Студент</th>
                <th className="p-4 font-bold">Email</th>
                <th className="p-4 font-bold">Прогресс</th>
                <th className="p-4 font-bold text-right pr-6"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-white transition-colors group"
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-700 text-sm">
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {student.email}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            student.progress > 80
                              ? "bg-green-500"
                              : student.progress > 50
                              ? "bg-blue-500"
                              : "bg-amber-400"
                          }`}
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {student.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button className="text-slate-300 hover:text-slate-600 transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
