import React from 'react';
import { Info, CheckCircle2, Server, ShieldCheck } from 'lucide-react';

export const About: React.FC = () => {
    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto text-center py-8">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl mx-auto flex items-center justify-center text-blue-600 mb-6 transform rotate-3">
                    <Info size={40} />
                </div>
                <h2 className="text-3xl font-black font-mono text-slate-800 mb-4 tracking-tight">О платформе GPT-Courses</h2>
                <p className="text-slate-500 leading-relaxed mb-10 text-lg">
                    Современная образовательная система, объединяющая студентов, преподавателей и методистов в едином цифровом пространстве.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">Удобство</h3>
                        <p className="text-xs text-slate-500">Интуитивный интерфейс для управления учебным процессом без лишних кликов.</p>
                    </div>
                    <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                            <Server size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">Надежность</h3>
                        <p className="text-xs text-slate-500">Стабильная работа 24/7 с регулярными резервными копиями данных.</p>
                    </div>
                    <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                            <ShieldCheck size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">Безопасность</h3>
                        <p className="text-xs text-slate-500">Защита персональных данных студентов и преподавателей.</p>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100">
                    <p className="text-xs font-mono text-slate-400">Версия 1.0.0 (Beta)</p>
                    <p className="text-xs text-slate-300 mt-1">© 2025 GPT-Courses Inc. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};