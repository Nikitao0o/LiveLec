import React, { useState } from 'react';
import { Plus, BarChart3, Users, Clock, ArrowRight, X, BookOpen, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Добавлено

const TeacherDashboard = () => {
  const navigate = useNavigate(); // Добавлено
  // Состояние для модального окна
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLecture, setNewLecture] = useState({ title: '', subject: '' });

  const lectures = [
    { id: 1, title: "Лекция 1: название", date: "Вчера, 14:20", students: 142, confusion: 12, status: 'completed' },
    { id: 2, title: "Лекция 2: название", date: "15 окт, 10:00", students: 128, confusion: 3, status: 'completed' },
    { id: 3, title: "Лекция 3: название", date: "12 окт, 12:40", students: 156, confusion: 24, status: 'completed' },
  ];

  const handleCreateLecture = (e) => {
    e.preventDefault();
    console.log("Создание лекции:", newLecture);
    // Тут будет запрос к API: POST /api/lectures/
    setIsModalOpen(false); // Закрываем после "создания"
  };

  return (
    <>
      {/* Заголовок и Кнопка */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-left">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">Личный кабинет</h2>
          <p className="text-slate-400 font-medium mt-1">Добро пожаловать, Марина Мосева</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} // ОТКРЫВАЕМ МОДАЛКУ
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95 leading-none cursor-pointer"
        >
          <Plus size={18} strokeWidth={3} />
          <span>Создать лекцию</span>
        </button>
      </div>

      {/* Сетка статистики */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 text-left leading-none">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm leading-none">
          <div className="flex items-center gap-3 text-slate-400 mb-2 leading-none">
            <Users size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Всего студентов</span>
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none">1,402</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm leading-none">
          <div className="flex items-center gap-3 text-slate-400 mb-2 leading-none">
            <Clock size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Часов лекций</span>
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none">32.5</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-600 leading-none">
          <div className="flex items-center gap-3 text-indigo-600 mb-2 leading-none">
            <BarChart3 size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Средний охват</span>
          </div>
          <p className="text-3xl font-black text-indigo-600 tracking-tighter leading-none">84%</p>
        </div>
      </div>

      {/* Список лекций */}
      <div className="text-left leading-none">
        <div className="flex items-center justify-between mb-6 px-2 leading-none">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 leading-none">Недавние лекции</h3>
          {/* Исправлено: добавлена навигация в архив */}
          <button 
            onClick={() => navigate('/teacher/archive')} 
            className="text-xs font-bold text-indigo-600 hover:underline leading-none cursor-pointer"
          >
            Показать все
          </button>
        </div>

        <div className="space-y-4 leading-none">
          {lectures.map((lec) => (
            <div key={lec.id} className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group leading-none">
              <div className="flex items-center gap-5 leading-none">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors leading-none">
                  📚
                </div>
                <div className="text-left leading-none">
                  <h4 className="font-bold text-slate-800 leading-tight mb-1 leading-none">{lec.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-medium leading-none">
                    <span className="flex items-center gap-1 leading-none"><Clock size={12} /> {lec.date}</span>
                    <span className="flex items-center gap-1 leading-none"><Users size={12} /> {lec.students}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0 leading-none">
                <div className="text-left md:text-right leading-none">
                  <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-1 leading-none">Сложные моменты</p>
                  <p className="font-black text-slate-700 leading-none">{lec.confusion} жалоб</p>
                </div>
                <button 
                  onClick={() => navigate('/teacher/analytics')} 
                  className="bg-slate-900 text-white px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-colors flex items-center gap-2 leading-none cursor-pointer"
                >
                  Аналитика <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- МОДАЛЬНОЕ ОКНО --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop (Затемнение фона) */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Контент модалки */}
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
             <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                <div>
                   <h3 className="text-2xl font-black tracking-tight leading-none">Новая лекция</h3>
                   <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-2 leading-none">Заполните данные для начала</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors leading-none"
                >
                   <X size={24} />
                </button>
             </div>

             <form onSubmit={handleCreateLecture} className="p-8 space-y-6 text-left leading-none">
                <div className="space-y-2 leading-none">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Тема лекции</label>
                   <div className="relative leading-none">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 leading-none" size={18} />
                      <input 
                        type="text" 
                        placeholder="Например: Свойства ACID в БД"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm leading-none"
                        onChange={(e) => setNewLecture({...newLecture, title: e.target.value})}
                        required
                      />
                   </div>
                </div>

                <div className="space-y-2 leading-none">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Учебная дисциплина</label>
                   <div className="relative leading-none">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 leading-none" size={18} />
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm appearance-none leading-none"
                        onChange={(e) => setNewLecture({...newLecture, subject: e.target.value})}
                        required
                      >
                         <option value="">Выберите предмет</option>
                         <option value="db">Базы Данных</option>
                         <option value="se">Программная инженерия</option>
                         <option value="net">Сети и телекоммуникации</option>
                      </select>
                   </div>
                </div>

                <div className="flex gap-3 pt-4 leading-none">
                   <button 
                     type="button"
                     onClick={() => setIsModalOpen(false)}
                     className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all leading-none"
                   >
                      Отмена
                   </button>
                   <button 
                     type="submit"
                     className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 text-xs uppercase tracking-widest transition-all leading-none"
                   >
                      Начать лекцию
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherDashboard;