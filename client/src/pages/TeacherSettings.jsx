import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

const TeacherSettings = () => {
  return (
    <>
      <h2 className="text-3xl font-black text-slate-800 mb-10 tracking-tight leading-none text-left">Настройки профиля</h2>
      
      <div className="space-y-8 leading-none text-left max-w-2xl">
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

         <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm leading-none text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 leading-none text-left">
               <Lock size={16} /> Безопасность
            </h3>
            <button className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:text-indigo-800 leading-none">Сбросить пароль</button>
         </section>
      </div>
    </>
  );
};

export default TeacherSettings;