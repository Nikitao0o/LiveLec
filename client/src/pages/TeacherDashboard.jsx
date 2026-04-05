import React from 'react';
import { Plus, BarChart3, Users, Clock, ArrowRight, LayoutDashboard, Settings, LogOut } from 'lucide-react';

const TeacherDashboard = () => {
  const lectures = [
    { id: 1, title: "Лекция 1: название", date: "Вчера, 14:20", students: 142, confusion: 12, status: 'completed' },
    { id: 2, title: "Лекция 2: название", date: "15 окт, 10:00", students: 128, confusion: 3, status: 'completed' },
    { id: 3, title: "Лекция 3: название", date: "12 окт, 12:40", students: 156, confusion: 24, status: 'completed' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-left">
      
      {/* 1. БОКОВАЯ ПАНЕЛЬ (На десктопе - сбоку, на мобилке - сверху) */}
      <aside className="w-full md:w-64 bg-white border-b md:border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 md:p-8 flex items-center justify-between md:block">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl font-black text-xl">LL</div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">LiveLec</h1>
          </div>
          <button className="md:hidden p-2 text-slate-400">
             {/* Тут могла быть иконка меню */}
          </button>
        </div>

        <nav className="hidden md:flex flex-col gap-2 px-4 flex-1">
          <button className="flex items-center gap-3 bg-indigo-50 text-indigo-600 px-4 py-3 rounded-2xl font-bold transition-all">
            <LayoutDashboard size={20} /> <span>Дашборд</span>
          </button>
          <button className="flex items-center gap-3 text-slate-400 hover:bg-slate-50 px-4 py-3 rounded-2xl font-bold transition-all">
            <BarChart3 size={20} /> <span>Аналитика</span>
          </button>
          <button className="flex items-center gap-3 text-slate-400 hover:bg-slate-50 px-4 py-3 rounded-2xl font-bold transition-all mt-auto mb-4">
            <Settings size={20} /> <span>Настройки</span>
          </button>
          <button className="flex items-center gap-3 text-rose-400 hover:bg-rose-50 px-4 py-3 rounded-2xl font-bold transition-all mb-8 leading-none">
            <LogOut size={20} /> <span>Выйти</span>
          </button>
        </nav>
      </aside>

      {/* 2. ОСНОВНОЙ КОНТЕНТ */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl">
        
        {/* Заголовок и Кнопка */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">Личный кабинет</h2>
            <p className="text-slate-400 font-medium mt-1">Добро пожаловать, Марина Мосева</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95 leading-none">
            <Plus size={18} strokeWidth={3} />
            <span>Создать лекцию</span>
          </button>
        </div>

        {/* Сетка статистики */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <Users size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Всего студентов</span>
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none leading-none">1,402</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <Clock size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Часов лекций</span>
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none leading-none leading-none">32.5</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-600">
            <div className="flex items-center gap-3 text-indigo-600 mb-2">
              <BarChart3 size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Средний охват</span>
            </div>
            <p className="text-3xl font-black text-indigo-600 tracking-tighter leading-none leading-none">84%</p>
          </div>
        </div>

        {/* Список лекций */}
        <div>
          <div className="flex items-center justify-between mb-6 px-2 leading-none">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 leading-none">Недавние лекции</h3>
            <button className="text-xs font-bold text-indigo-600 hover:underline leading-none">Показать все</button>
          </div>

          <div className="space-y-4">
            {lectures.map((lec) => (
              <div key={lec.id} className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 leading-tight mb-1">{lec.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium leading-none">
                      <span className="flex items-center gap-1 leading-none"><Clock size={12} /> {lec.date}</span>
                      <span className="flex items-center gap-1 leading-none"><Users size={12} /> {lec.students}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-1 leading-none">Сложные моменты</p>
                    <p className="font-black text-slate-700 leading-none">{lec.confusion} жалоб</p>
                  </div>
                  <button className="bg-slate-900 text-white px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-colors flex items-center gap-2">
                    Аналитика <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};

export default TeacherDashboard;