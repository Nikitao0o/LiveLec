import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, MessageSquare, BarChart3, Users, AlertTriangle, FileCode } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

const PostLectureAnalytics = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/lectures/${id}/analytics`)
       .then(res => setData(res.data))
       .catch(err => console.error("Ошибка загрузки отчета", err));
  }, [id]);

  const handleDownload = async (format) => {
    try {
      const res = await api.get(`/lectures/${id}/export?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lecture_${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Ошибка при скачивании:', err);
      alert('Не удалось скачать файл. Убедитесь, что ASR был включен.');
    }
  };

  if (!data) {
    return <div className="p-10 text-slate-400 font-bold uppercase tracking-widest text-center mt-20">Загрузка аналитики...</div>;
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 text-left leading-none">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase leading-none">Итоги: {data.title}</h1>
          <p className="text-sm text-slate-400 font-medium mt-2 uppercase tracking-widest leading-none">
            {new Date(data.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => handleDownload('md')}
             className="bg-white border-2 border-slate-200 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 transition-all flex items-center gap-2 cursor-pointer"
           >
              <FileCode size={16} /> Markdown
           </button>
           <button 
             onClick={() => handleDownload('txt')}
             className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer"
           >
              <Download size={16} /> Скачать TXT
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 text-left">
        <div className="bg-white py-6 pl-4 pr-6 rounded-[2rem] border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 text-slate-400 mb-3"><Users size={16} /> <span className="text-[9px] font-black uppercase tracking-widest leading-none">Студентов</span></div>
           <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{data.students_count}</p>
        </div>
        <div className="bg-white py-6 pl-4 pr-6 rounded-[2rem] border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 text-rose-500 mb-3"><AlertTriangle size={16} /> <span className="text-[9px] font-black uppercase tracking-widest leading-none">Жалобы</span></div>
           <p className="text-3xl font-black text-rose-500 tracking-tighter leading-none">{data.confusion_sum}</p>
        </div>
        <div className="bg-white py-6 pl-4 pr-6 rounded-[2rem] border border-slate-200 shadow-sm leading-none">
           <div className="flex items-center gap-2 text-slate-400 mb-3 leading-none"><MessageSquare size={16} /> <span className="text-[9px] font-black uppercase tracking-widest leading-none">Вопросы</span></div>
           <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{data.questions_count}</p>
        </div>
        <div className="bg-white py-6 pl-4 pr-6 rounded-[2rem] border border-slate-200 shadow-sm border-l-4 border-l-indigo-600 leading-none">
           <div className="flex items-center gap-2 text-indigo-600 mb-3 leading-none"><BarChart3 size={16} /> <span className="text-[9px] font-black uppercase tracking-widest leading-none">Вовлеченность</span></div>
           <p className="text-3xl font-black text-indigo-600 tracking-tighter leading-none">{data.engagement}%</p>
        </div>
      </div>

      <section className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm mb-8 text-left">
         <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-8 leading-none">График понимания (Heatmap)</h3>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chart_data}>
                <defs>
                  <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="confusion" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorConf)" />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </section>
    </>
  );
};

export default PostLectureAnalytics;