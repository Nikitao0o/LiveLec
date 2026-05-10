import React, { useState } from 'react'; // Добавлено useState
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, FileText } from 'lucide-react';

const LectureArchive = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(''); // Добавлено состояние

  const archives = [
    { id: 1, title: "Название 1", date: "12.09.2026", subject: "Базы Данных", duration: "1ч 20м" },
    { id: 2, title: "Название 2", date: "19.09.2026", subject: "Базы Данных", duration: "1ч 45м" },
    { id: 3, title: "Название 3", date: "26.09.2026", subject: "Базы Данных", duration: "1ч 30м" },
  ];

  // Логика поиска
  const filteredArchives = archives.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-left">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Архив лекций</h2>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Поиск по названию..." 
            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500 transition-all font-medium text-sm leading-none" 
            value={searchQuery} // Добавлено
            onChange={(e) => setSearchQuery(e.target.value)} // Добавлено
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 text-left leading-none">
        {/* Заменено archives на filteredArchives */}
        {filteredArchives.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-between group text-left">
            <div className="flex items-center gap-6 leading-none">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors text-left leading-none">📁</div>
              <div className="text-left leading-none text-left leading-none">
                <h4 className="font-bold text-slate-800 mb-1 leading-none">{item.title}</h4>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none text-left">
                  <span className="flex items-center gap-1 leading-none"><Calendar size={12} /> {item.date}</span>
                  <span className="flex items-center gap-1 leading-none"><FileText size={12} /> {item.subject}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/teacher/analytics')} 
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-colors leading-none cursor-pointer"
            >
              Открыть отчет
            </button>
          </div>
        ))}
        
        {/* Сообщение, если ничего не найдено */}
        {filteredArchives.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Ничего не найдено</p>
          </div>
        )}
      </div>
    </>
  );
};

export default LectureArchive;