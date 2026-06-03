import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, X, KeyRound, CheckCircle2, AlertCircle, BookOpen, Plus, Trash2 } from 'lucide-react';
import api from '../api';

const TeacherSettings = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [toast, setToast] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [disciplines, setDisciplines] = useState([]);
  const [newDiscipline, setNewDiscipline] = useState('');

  const showToast = (message, isError = true) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDisciplines = () => {
    api.get('/disciplines/')
      .then((res) => setDisciplines(res.data))
      .catch(() => showToast('Не удалось загрузить дисциплины'));
  };

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setProfile({ name: res.data.name, email: res.data.email }))
      .catch(() => showToast('Не удалось загрузить профиль'));
    loadDisciplines();
  }, []);

  const handleAddDiscipline = async (e) => {
    e.preventDefault();
    const name = newDiscipline.trim();
    if (!name) return;
    try {
      await api.post('/disciplines/', { name });
      setNewDiscipline('');
      loadDisciplines();
      showToast('Дисциплина добавлена', false);
    } catch (error) {
      const detail = error.response?.data?.detail;
      showToast(detail === 'Discipline already exists' ? 'Такая дисциплина уже есть' : detail || 'Не удалось добавить');
    }
  };

  const handleDeleteDiscipline = async (id) => {
    try {
      await api.delete(`/disciplines/${id}`);
      loadDisciplines();
      showToast('Дисциплина удалена', false);
    } catch {
      showToast('Не удалось удалить дисциплину');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await api.patch('/auth/me', {
        name: profile.name.trim(),
        email: profile.email.trim(),
      });
      setProfile({ name: res.data.name, email: res.data.email });
      showToast('Профиль сохранён', false);
    } catch (error) {
      const detail = error.response?.data?.detail;
      showToast(
        detail === 'Email already registered'
          ? 'Этот email уже занят'
          : detail || 'Не удалось сохранить профиль'
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showToast('Новый пароль и подтверждение не совпадают');
      return;
    }

    setIsSavingPassword(true);
    try {
      await api.post('/auth/password', {
        current_password: passwords.old,
        new_password: passwords.new,
      });
      setPasswords({ old: '', new: '', confirm: '' });
      setIsModalOpen(false);
      showToast('Пароль успешно обновлён', false);
    } catch (error) {
      const detail = error.response?.data?.detail;
      showToast(
        detail === 'Invalid current password'
          ? 'Неверный текущий пароль'
          : Array.isArray(detail)
            ? detail.map((d) => d.msg).join(', ')
            : detail || 'Не удалось сменить пароль'
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 z-[200] w-[90%] max-w-sm text-white ${toast.isError ? 'bg-rose-500' : 'bg-emerald-500'}`}>
          {toast.isError ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
          <p className="text-sm font-bold flex-1 leading-tight">{toast.message}</p>
          <button type="button" onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded-lg">
            <X size={18} />
          </button>
        </div>
      )}

      <h2 className="text-3xl font-black text-slate-800 mb-10 tracking-tight leading-none text-left">Настройки профиля</h2>

      <div className="space-y-8 leading-none text-left max-w-2xl">
        <form onSubmit={handleProfileSave} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 leading-none text-left">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2 leading-none text-left">
            <ShieldCheck size={16} /> Личные данные
          </h3>
          <div className="space-y-4 leading-none text-left">
            <div className="text-left leading-none">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">ФИО</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 mt-1 outline-none focus:border-indigo-500 transition-all font-bold leading-none"
                required
              />
            </div>
            <div className="text-left leading-none">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 mt-1 outline-none focus:border-indigo-500 transition-all font-bold leading-none"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSavingProfile}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all leading-none disabled:opacity-60"
          >
            {isSavingProfile ? 'Сохранение…' : 'Сохранить изменения'}
          </button>
        </form>

        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 leading-none text-left">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
            <BookOpen size={16} /> Учебные дисциплины
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Эти предметы будут доступны при создании новой лекции.
          </p>
          <form onSubmit={handleAddDiscipline} className="flex gap-3">
            <input
              type="text"
              value={newDiscipline}
              onChange={(e) => setNewDiscipline(e.target.value)}
              placeholder="Например: Машинное обучение"
              className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 outline-none focus:border-indigo-500 font-bold text-sm"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus size={16} /> Добавить
            </button>
          </form>
          <div className="space-y-2">
            {disciplines.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3">
                <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteDiscipline(item.id)}
                  className="text-rose-500 hover:text-rose-700 p-2"
                  aria-label="Удалить"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {disciplines.length === 0 && (
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-4">
                Список пуст — добавьте первую дисциплину
              </p>
            )}
          </div>
        </section>

        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm leading-none text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 leading-none text-left">
               <Lock size={16} /> Безопасность
            </h3>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:text-indigo-800 leading-none cursor-pointer"
          >
            Сбросить пароль
          </button>
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight leading-none uppercase">Безопасность</h3>
                <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-2 leading-none">Смена пароля аккаунта</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handlePasswordReset} className="p-8 space-y-5 text-left leading-none">
              <div className="space-y-2 leading-none">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Текущий пароль</label>
                <div className="relative leading-none">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-rose-500 focus:bg-white transition-all font-bold text-sm leading-none"
                    value={passwords.old}
                    onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2" />

              <div className="space-y-2 leading-none">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Новый пароль</label>
                <div className="relative leading-none">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="password"
                    placeholder="Минимум 8 символов"
                    minLength={8}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm leading-none"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 leading-none">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Подтверждение</label>
                <div className="relative leading-none">
                  <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="password"
                    placeholder="Повторите новый пароль"
                    minLength={8}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm leading-none"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
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
                  disabled={isSavingPassword}
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 text-[10px] uppercase tracking-[0.2em] transition-all leading-none"
                >
                  {isSavingPassword ? 'Сохранение…' : 'Обновить пароль'}
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
