import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, GraduationCap, ChevronRight } from 'lucide-react';
import api from '../api';

const AuthTeacher = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        // Логин
        const response = await api.post('/auth/token', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('token', response.data.access_token);
      } else {
        // Регистрация
        await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        
        // Сразу после регистрации авторизуемся
        const response = await api.post('/auth/token', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('token', response.data.access_token);
      }
      
      // Перенаправляем в дашборд
      navigate('/teacher');
      
    } catch (error) {
      console.error('Ошибка авторизации:', error.response?.data || error.message);
      alert(error.response?.data?.detail || 'Произошла ошибка при авторизации');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      
      {/* Кнопка "Назад" */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors text-[10px] uppercase tracking-[0.2em]"
      >
        <ArrowLeft size={16} strokeWidth={3} /> На главную
      </button>

      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-indigo-100 overflow-hidden border border-slate-100 flex flex-col">
        
        <div className="bg-indigo-600 p-10 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                <GraduationCap size={32} strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Панель лектора</h1>
            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 opacity-80">
              {isLogin ? 'Авторизация в системе' : 'Создание нового аккаунта'}
            </p>
          </div>
        </div>

        {/* Форма */}
        <div className="p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Ваше имя</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="Иван Петров"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-sm leading-none"
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 leading-none">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Email адрес</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="email" 
                  placeholder="teacher@university.ru"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-sm leading-none"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 leading-none">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-sm leading-none"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-95 uppercase text-xs tracking-widest mt-6 leading-none">
              <span>{isLogin ? 'Войти в кабинет' : 'Зарегистрироваться'}</span>
              <ChevronRight size={20} strokeWidth={3} />
            </button>
          </form>

          {/* Переключатель Вход/Регистрация */}
          <div className="mt-10 text-center border-t border-slate-100 pt-8 leading-none">
            <p className="text-xs text-slate-400 mb-3 leading-none">
              {isLogin ? 'Впервые в LiveLec?' : 'Уже есть аккаунт?'}
            </p>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest"
            >
              {isLogin ? 'Создать аккаунт лектора' : 'Вернуться к входу'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTeacher;