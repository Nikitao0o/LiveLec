import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, FileText } from 'lucide-react';
import api from '../api';

const LectureArchive = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [archives, setArchives] = useState([]);

  useEffect(() => {
    api.get('/lectures/')
       .then(res => setArchives(res.data))
       .catch(err => console.error("Ошибка загрузки архива", err));
  }, []);

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 text-left leading-none">
        {filteredArchives.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-between group text-left">
            <div className="flex items-center gap-6 leading-none">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors text-left leading-none">📁</div>
              <div className="text-left leading-none">
                <h4 className="font-bold text-slate-800 mb-1 leading-none">{item.title}</h4>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none text-left mt-2">
                  <span className="flex items-center gap-1 leading-none">
                    <Calendar size={12} /> {new Date(item.created_at).toLocaleDateString('ru-RU')}
                  </span>
                  <span className="flex items-center gap-1 leading-none">
                    <FileText size={12} /> {item.discipline || 'Без предмета'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/teacher/analytics/${item.id}`)} 
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-colors leading-none cursor-pointer"
            >
              Открыть отчет
            </button>
          </div>
        ))}
        
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