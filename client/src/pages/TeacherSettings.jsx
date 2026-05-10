import React, { useState } from 'react';
import { Lock, ShieldCheck, X, KeyRound, CheckCircle2 } from 'lucide-react';

const TeacherSettings = () => {
  // Состояние для модалки смены пароля
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwords, setPasswords] = useState({
    old: '',
    new: '',
    confirm: ''
  });

  const handlePasswordReset = (e) => {
    e.preventDefault();
    console.log("Смена пароля:", passwords);
    // Тут будет запрос к API: PATCH /api/auth/password
    setIsModalOpen(false);
  };

  return (
    <>
      <h2 className="text-3xl font-black text-slate-800 mb-10 tracking-tight leading-none text-left">Настройки профиля</h2>
      
      <div className="space-y-8 leading-none text-left max-w-2xl">
         {/* Секция личных данных */}
         <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 leading-none text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2 leading-none text-left">
               <ShieldCheck size={16} /> Личные данные
            </h3>
            <div className="space-y-4 leading-none text-left">
              <div className="text-left leading-none">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">ФИО</label>
                <input type="text" defaultValue="Марина Мосева" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 mt-1 outline-none focus:border-indigo-500 transition-all font-bold leading-none" />
              </div>
              <div className="text-left leading-none leading-none">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Email</label>
                <input type="email" defaultValue="moseva@university.ru" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 mt-1 outline-none focus:border-indigo-500 transition-all font-bold leading-none leading-none" />
              </div>
            </div>
            <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all leading-none leading-none">Сохранить изменения</button>
         </section>

         {/* Секция безопасности */}
         <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm leading-none text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 leading-none text-left">
               <Lock size={16} /> Безопасность
            </h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:text-indigo-800 leading-none cursor-pointer"
            >
              Сбросить пароль
            </button>
         </section>
      </div>

      {/* --- МОДАЛЬНОЕ ОКНО СБРОСА ПАРОЛЯ --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          ></div>

          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
             <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                <div>
                   <h3 className="text-2xl font-black tracking-tight leading-none uppercase">Безопасность</h3>
                   <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-2 leading-none">Смена пароля аккаунта</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                   <X size={24} />
                </button>
             </div>

             <form onSubmit={handlePasswordReset} className="p-8 space-y-5 text-left leading-none">
                {/* Текущий пароль */}
                <div className="space-y-2 leading-none">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Текущий пароль</label>
                   <div className="relative leading-none">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-rose-500 focus:bg-white transition-all font-bold text-sm leading-none"
                        onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                        required
                      />
                   </div>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                {/* Новый пароль */}
                <div className="space-y-2 leading-none">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Новый пароль</label>
                   <div className="relative leading-none">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="password" 
                        placeholder="Минимум 8 символов"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm leading-none"
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                        required
                      />
                   </div>
                </div>

                {/* Подтверждение */}
                <div className="space-y-2 leading-none">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Подтверждение</label>
                   <div className="relative leading-none">
                      <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="password" 
                        placeholder="Повторите новый пароль"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm leading-none"
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        required
                      />
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
                     className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 text-[10px] uppercase tracking-[0.2em] transition-all leading-none"
                   >
                      Обновить пароль
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherSettings;