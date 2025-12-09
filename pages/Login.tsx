

import React, { useState } from 'react';
import { User } from '../types';
import { API_URL } from '../constants';
import { GraduationCap, ArrowRight, User as UserIcon, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginProps {
    onLogin: (u: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const user = await response.json();
            onLogin(user);
        } else {
            setError('Неверный логин или пароль');
        }
    } catch (err) {
        console.error(err);
        setError('Ошибка подключения к серверу');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-200 p-4 font-sans">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
        
        <div className="text-center mb-10">
            <div className="bg-blue-600 w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-blue-200 shadow-xl transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <GraduationCap size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight font-mono mb-2">GPT-COURSES</h1>
            <p className="text-slate-500 font-medium">Добро пожаловать</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">Логин</label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <UserIcon size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-base"
                  placeholder="Имя пользователя"
                />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">Пароль</label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <KeyRound size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-12 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-base"
                  placeholder="Введите пароль"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 animate-pulse">
                <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98] flex items-center justify-center gap-2 text-base mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <Loader2 className="animate-spin" />
            ) : (
                <>
                    <span>Войти в систему</span>
                    <ArrowRight size={20} />
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};