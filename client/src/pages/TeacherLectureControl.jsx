import React, { useState } from 'react';
import { 
  Users, MessageSquare, PlayCircle, Mic, 
  ChevronLeft, ChevronRight, XCircle, BarChart3 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TeacherLectureControl = () => {
  // Имитация данных для графика "Не понимаю" (Heatmap)
  const [analyticsData] = useState([
    { time: '10:00', value: 5 },
    { time: '10:05', value: 12 },
    { time: '10:10', value: 45 }, // Пик
    { time: '10:15', value: 10 },
    { time: '10:20', value: 25 },
    { time: '10:25', value: 8 },
  ]);

  const [questions] = useState([
    { id: 1, text: "А будет тест после лекции?", likes: 25, status: 'new' },
    { id: 2, text: "А вы скинете презентацию?", likes: 18, status: 'new' },
    { id: 3, text: "Можно выйти?", likes: 4, status: 'read' },
  ]);

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden text-left leading-none">
      
      {/* 1. ВЕРХНЯЯ ПАНЕЛЬ (Статус лекции) */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-black tracking-tighter">LiveLec</div>
          <div>
             <h1 className="text-lg font-bold text-slate-800 leading-none">Архитектура БД: ACID</h1>
             <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">В эфире: 42:15</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="flex items-center gap-2 text-slate-400 font-medium border-r border-slate-200 pr-8">
              <Users size={18} />
              <span className="text-sm">142 студента онлайн</span>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right leading-none">
                 <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Код входа</p>
                 <p class="text-3xl font-mono font-black text-indigo-600 tracking-tighter leading-none">481 516</p>
              </div>
              <button className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-bold border border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-2 leading-none">
                 <XCircle size={18} /> Завершить
              </button>
           </div>
        </div>
      </header>

      {/* 2. ОСНОВНАЯ РАБОЧАЯ ОБЛАСТЬ */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* ЛЕВАЯ КОЛОНКА: ВОПРОСЫ (30% ширины) */}
        <aside className="w-80 md:w-96 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between px-2">
             <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                <MessageSquare size={16} /> Вопросы студентов
             </h3>
             <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold leading-none tracking-tighter">ТОП СВЕРХУ</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {questions.sort((a,b) => b.likes - a.likes).map((q) => (
              <div key={q.id} className={`p-5 rounded-3xl border transition-all ${q.likes > 20 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex justify-between items-start mb-3">
                   {q.likes > 20 && <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Топ вопрос</span>}
                   <span className="text-indigo-600 font-black text-sm ml-auto">↑ {q.likes}</span>
                </div>
                <p className="text-sm font-bold text-slate-800 leading-snug italic uppercase tracking-tighter">"{q.text}"</p>
                <div className="mt-4 flex gap-2">
                   <button className="flex-1 bg-white border border-slate-200 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all leading-none">Ответить</button>
                   <button className="px-3 border border-slate-100 rounded-xl text-slate-300">×</button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ПРАВАЯ КОЛОНКА: СЛАЙДЫ И ГРАФИК */}
        <main className="flex-1 flex flex-col gap-6 overflow-hidden leading-none">
          
          {/* ОКНО ПРЕЗЕНТАЦИИ */}
          <div className="flex-1 bg-slate-900 rounded-[2.5rem] relative overflow-hidden flex flex-col shadow-2xl border-4 border-white">
            <div className="absolute top-6 left-8 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white">
               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-widest">Трансляция слайда 4 / 12</span>
            </div>

            <div className="flex-1 flex items-center justify-center p-20 text-center">
               <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-tight">
                  Базы Данных: <br/> Архитектура ACID
               </h2>
            </div>

            {/* Контролы слайдов */}
            <div className="p-6 bg-black/20 backdrop-blur-sm flex justify-between items-center px-10">
               <button className="text-white/60 hover:text-white transition-colors flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest leading-none leading-none">
                  <ChevronLeft /> Назад
               </button>
               <div className="flex gap-2">
                  {[1,2,3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i===2 ? 'bg-indigo-500' : 'bg-white/20'}`}></div>)}
               </div>
               <button className="text-white hover:text-indigo-400 transition-colors flex items-center gap-2 font-black uppercase text-[10px] tracking-widest leading-none leading-none">
                  Вперед <ChevronRight />
               </button>
            </div>
          </div>

          {/* ЖИВОЙ ГРАФИК (HEATMAP) */}
          <div className="h-48 bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4 px-2">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <BarChart3 size={14} /> График понимания аудитории (Real-time)
               </h3>
               <span className="text-rose-500 font-black text-[10px] uppercase italic tracking-tighter leading-none leading-none">Пик жалоб зафиксирован</span>
            </div>
            <div className="flex-1 w-full leading-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ПАНЕЛЬ КНОПОК УПРАВЛЕНИЯ */}
          <div className="grid grid-cols-2 gap-4 leading-none">
             <button className="bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all leading-none leading-none">
                <PlayCircle size={28} /> Запустить Блиц-Опрос
             </button>
             <button className="bg-white border-4 border-indigo-600 text-indigo-600 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-indigo-50 transition-all leading-none leading-none">
                <Mic size={28} className="animate-pulse" /> Пауза Субтитров (ASR)
             </button>
          </div>

        </main>
      </div>
    </div>
  );
};

export default TeacherLectureControl;