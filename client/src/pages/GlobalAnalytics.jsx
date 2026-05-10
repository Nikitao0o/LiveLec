import React from 'react';
import { TrendingUp, Users, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GlobalAnalytics = () => {
  const data = [
    { name: 'Сент', engagement: 65, lectures: 4 },
    { name: 'Окт', engagement: 78, lectures: 8 },
    { name: 'Ноя', engagement: 82, lectures: 6 },
    { name: 'Дек', engagement: 88, lectures: 10 },
  ];

  return (
    <>
      <h2 className="text-3xl font-black text-slate-800 mb-8 tracking-tight text-left">Общая аналитика</h2>

      {/* Сетка статистики */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <TrendingUp className="text-indigo-600 mb-3" size={24} />
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Рост вовлеченности</p>
          <p className="text-3xl font-black text-slate-800">+12% <span className="text-sm text-green-500 font-bold tracking-tighter">в этом месяце</span></p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <Users className="text-indigo-600 mb-3" size={24} />
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Активных студентов</p>
          <p className="text-3xl font-black text-slate-800">842</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <BookOpen className="text-indigo-600 mb-3" size={24} />
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Всего дисциплин</p>
          <p className="text-3xl font-black text-slate-800">4</p>
        </div>
      </div>

      {/* График тренда */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm mb-10 leading-none text-left">
         <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">Тренд понимания материала</h3>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fontWeight: 'bold', fill: '#94a3b8'}} 
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                />
                <Line 
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  dot={{r: 6, fill: '#4f46e5', strokeWidth: 0}} 
                  activeDot={{r: 8}} 
                />
              </LineChart>
            </ResponsiveContainer>
         </div>
      </div>
    </>
  );
};

export default GlobalAnalytics;