import React from 'react';
import { 
  Download, FileText, MessageSquare, BarChart3, 
  ArrowLeft, Users, Clock, AlertTriangle, FileCode 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const PostLectureAnalytics = () => {
  const navigate = useNavigate();

  // Данные для итогового графика
  const chartData = [
    { time: '00:00', confusion: 5, engagement: 80 },
    { time: '00:15', confusion: 15, engagement: 85 },
    { time: '00:30', confusion: 65, engagement: 70 }, // Пик непонимания
    { time: '00:45', confusion: 20, engagement: 90 },
    { time: '01:00', confusion: 40, engagement: 82 },
    { time: '01:15', confusion: 10, engagement: 95 },
  ];

  const bestQuestions = [
    { id: 1, text: "А будет тест после лекции?", likes: 42 },
    { id: 2, text: "А вы скинете презентацию?", likes: 28 },
    { id: 3, text: "Какой пароль от теста?", likes: 15 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-left leading-none">
      
      {/* ВЕРХНЯЯ ПАНЕЛЬ */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-6 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/teacher')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none italic uppercase leading-none">Итоги лекции: ACID & Транзакции</h1>
              <p className="text-sm text-slate-400 font-medium mt-1 uppercase tracking-widest leading-none">Проведена: 12 октября 2126 • 1ч 32м</p>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button className="flex-1 md:flex-none bg-white border-2 border-slate-200 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 transition-all flex items-center justify-center gap-2 leading-none leading-none">
                <FileCode size={16} /> Markdown
             </button>
             <button className="flex-1 md:flex-none bg-indigo-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 leading-none leading-none">
                <Download size={16} /> Скачать TXT
             </button>
          </div>
        </div>
      </header>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8 overflow-hidden text-left leading-none">
        
        {/* КАРТОЧКИ СТАТИСТИКИ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm leading-none leading-none">
             <div className="flex items-center gap-2 text-slate-400 mb-3">
                <Users size={16} /> <span className="text-[9px] font-black uppercase tracking-widest leading-none">Студентов</span>
             </div>
             <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none leading-none">142</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm leading-none leading-none">
             <div className="flex items-center gap-2 text-rose-500 mb-3">
                <AlertTriangle size={16} /> <span className="text-[9px] font-black uppercase tracking-widest leading-none leading-none">Сложные моменты</span>
             </div>
             <p className="text-3xl font-black text-rose-500 tracking-tighter leading-none leading-none">24 жалобы</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm leading-none leading-none">
             <div className="flex items-center gap-2 text-slate-400 mb-3 leading-none">
                <MessageSquare size={16} /> <span className="text-[9px] font-black uppercase tracking-widest leading-none">Вопросов</span>
             </div>
             <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none leading-none leading-none">18</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm border-l-4 border-l-indigo-600 leading-none">
             <div className="flex items-center gap-2 text-indigo-600 mb-3 leading-none">
                <BarChart3 size={16} /> <span className="text-[9px] font-black uppercase tracking-widest leading-none leading-none">Вовлеченность</span>
             </div>
             <p className="text-3xl font-black text-indigo-600 tracking-tighter leading-none leading-none">88%</p>
          </div>
        </div>

        {/* ИТОГОВЫЙ ГРАФИК (HEATMAP) */}
        <section className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-8 leading-none">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 leading-none">Динамика понимания материала</h3>
              <div className="hidden md:flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none leading-none">
                 <span className="flex items-center gap-1 leading-none"><div className="w-3 h-1.5 bg-rose-500 rounded-full"></div> Уровень непонимания</span>
                 <span className="flex items-center gap-1 leading-none"><div className="w-3 h-1.5 bg-indigo-200 rounded-full"></div> Общая вовлеченность</span>
              </div>
           </div>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="confusion" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorConf)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left leading-none">
          
          {/* ЛУЧШИЕ ВОПРОСЫ */}
          <section className="space-y-6 text-left leading-none">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 leading-none">⭐️ Лучшие вопросы лекции</h3>
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm leading-none">
              {bestQuestions.map((q, idx) => (
                <div key={idx} className={`p-6 flex items-center justify-between transition-colors ${idx !== bestQuestions.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50`}>
                  <p className="text-sm font-bold text-slate-800 leading-snug italic pr-4">"{q.text}"</p>
                  <span className="shrink-0 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter leading-none">↑ {q.likes} лайков</span>
                </div>
              ))}
            </div>
          </section>

          {/* SMART TRANSCRIPT */}
          <section className="space-y-6 text-left leading-none">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 leading-none">✍️ Умная расшифровка (Конспект)</h3>
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm h-[320px] overflow-y-auto relative text-left leading-none">
              <div className="space-y-8 font-mono text-xs leading-relaxed text-slate-600 leading-none">
                 <div>
                    <span className="text-indigo-400 font-bold uppercase tracking-tighter leading-none leading-none">[00:12:04]</span>
                    <p className="mt-2 text-slate-800 font-medium leading-none tracking-tighter leading-none">Переходим к понятию <span className="underline decoration-indigo-300 decoration-2">атомарности</span>. Это гарантирует, что транзакция выполнится целиком или не выполнится вовсе.</p>
                 </div>
                 <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl">
                    <span className="text-rose-500 font-bold uppercase tracking-tighter leading-none leading-none">[00:30:15] — ПИК НЕПОНИМАНИЯ</span>
                    <p className="mt-2 text-slate-700 italic leading-none tracking-tighter leading-none leading-none">"Атомарность часто путают с изоляцией. Давайте разберем пример с банковским переводом... Кто вообще этот код писал???"</p>
                 </div>
                 <div>
                    <span className="text-indigo-400 font-bold uppercase tracking-tighter leading-none leading-none">[00:45:00]</span>
                    <p className="mt-2 text-slate-800 font-medium leading-none tracking-tighter leading-none leading-none">Тут дальше (вроде) идёт расшифровка текста, а это означает, что всё это было бы круто если бы работало реально...</p>
                 </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default PostLectureAnalytics;