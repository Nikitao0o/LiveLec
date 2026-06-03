import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Users, Clock, ArrowRight, X, BookOpen, Tag, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLecture, setNewLecture] = useState({ title: '', subject: '' });
  const [lectures, setLectures] = useState([]);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teacherName, setTeacherName] = useState("преподаватель");

  const DISCIPLINES = [
    { value: 'Базы Данных', label: 'Базы Данных' },
    { value: 'Программная инженерия', label: 'Программная инженерия' },
    { value: 'Сети и телекоммуникации', label: 'Сети и телекоммуникации' },
  ];

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    api.get('/auth/me').then(res => setTeacherName(res.data.name)).catch(() => {});
    
    const fetchLectures = async () => {
      try {
        const response = await api.get('/lectures/');
        setLectures(response.data);
      } catch (err) {
        console.error("Не удалось загрузить список лекций");
      }
    };
    fetchLectures();
  }, []);

  const handleCreateLecture = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!newLecture.title || !newLecture.subject) {
      showToast("Пожалуйста, заполните все поля");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/lectures/', {
        title: newLecture.title,
        discipline: newLecture.subject
      });
      
      const lecture = response.data;
      localStorage.setItem('teacherPin', lecture.pin_code);
      localStorage.setItem('currentLecture', JSON.stringify(lecture));
      
      setIsModalOpen(false);
      navigate('/teacher/control'); 
      
    } catch (error) {
      console.error("Ошибка создания лекции:", error);
      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail)
        ? detail.map((e) => e.msg).join(', ')
        : detail || error.message || "ошибка сервера";
      if (error.response?.status === 401) {
        showToast("Войдите в аккаунт преподавателя, чтобы создать лекцию");
        navigate('/login');
        return;
      }
      showToast("Не удалось создать лекцию: " + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* КРАСИВОЕ УВЕДОМЛЕНИЕ */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-xl shadow-rose-500/20 flex items-center gap-3 z-[200] animate-in slide-in-from-top-4 fade-in duration-300 w-[90%] max-w-sm">
          <AlertCircle size={24} className="shrink-0" />
          <p className="text-sm font-bold flex-1 leading-tight">{toast}</p>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0 cursor-pointer">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-left">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">Личный кабинет</h2>
          <p className="text-slate-400 font-medium mt-1">Добро пожаловать, {teacherName}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95 leading-none cursor-pointer"
        >
          <Plus size={18} strokeWidth={3} />
          <span>Создать лекцию</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 text-left leading-none">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm leading-none">
          <div className="flex items-center gap-3 text-slate-400 mb-2 leading-none">
            <Users size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Всего студентов</span>
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none">0</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm leading-none">
          <div className="flex items-center gap-3 text-slate-400 mb-2 leading-none">
            <Clock size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Лекций проведено</span>
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{lectures.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-600 leading-none">
          <div className="flex items-center gap-3 text-indigo-600 mb-2 leading-none">
            <BarChart3 size={16} /> <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Средний охват</span>
          </div>
          <p className="text-3xl font-black text-indigo-600 tracking-tighter leading-none">--</p>
        </div>
      </div>

      <div className="text-left leading-none">
        <div className="flex items-center justify-between mb-6 px-2 leading-none">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 leading-none">Недавние лекции</h3>
          <button 
            onClick={() => navigate('/teacher/archive')} 
            className="text-xs font-bold text-indigo-600 hover:underline leading-none cursor-pointer"
          >
            Показать все
          </button>
        </div>

        <div className="space-y-4 leading-none">
          {lectures.length === 0 ? (
            <p className="text-sm text-slate-400 p-4 text-center border-2 border-dashed rounded-2xl">
              Вы еще не проводили лекций. Нажмите «Создать лекцию», чтобы начать.
            </p>
          ) : (
            lectures.map((lec) => (
              <div key={lec.id} className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group leading-none">
                <div className="flex items-center gap-5 leading-none">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors leading-none">
                    📚
                  </div>
                  <div className="text-left leading-none">
                    <h4 className="font-bold text-slate-800 leading-tight mb-1 leading-none">{lec.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium leading-none mt-2">
                      <span className="flex items-center gap-1 leading-none">
                        <Clock size={12} /> 
                        {new Date(lec.created_at).toLocaleDateString('ru-RU')}
                      </span>
                      <span className="flex items-center gap-1 leading-none">
                        <Tag size={12} /> {lec.discipline || 'Без предмета'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0 leading-none">
                  <div className="text-left md:text-right leading-none">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Статус</p>
                    <p className={`font-black uppercase text-[10px] tracking-widest leading-none ${lec.status === 'active' ? 'text-green-500' : 'text-slate-700'}`}>
                      {lec.status === 'active' ? 'В эфире' : 'Завершена'}
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate(`/teacher/analytics/${lec.id}`)} 
                    className="bg-slate-900 text-white px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-colors flex items-center gap-2 leading-none cursor-pointer"
                  >
                    Аналитика <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          ></div>

          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
             <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                <div>
                   <h3 className="text-2xl font-black tracking-tight leading-none">Новая лекция</h3>
                   <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-2 leading-none">Заполните данные для начала</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors leading-none cursor-pointer"
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
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm appearance-none leading-none cursor-pointer"
                        onChange={(e) => setNewLecture({...newLecture, subject: e.target.value})}
                        required
                      >
                         <option value="">Выберите предмет</option>
                         {DISCIPLINES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                   </div>
                </div>

                <div className="flex gap-3 pt-4 leading-none">
                   <button 
                     type="button"
                     onClick={() => setIsModalOpen(false)}
                     className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all leading-none cursor-pointer"
                   >
                      Отмена
                   </button>
                   <button 
                     type="submit"
                     disabled={isSubmitting}
                     className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 text-xs uppercase tracking-widest transition-all leading-none cursor-pointer"
                   >
                      {isSubmitting ? 'Создание…' : 'Начать лекцию'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;