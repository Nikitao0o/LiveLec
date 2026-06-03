import React, { useState, useRef } from 'react';
import { ArrowRight, GraduationCap, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
import api from '../api';
import { getStudentSessionId } from '../utils/studentSession';

const JoinLecture = () => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [toast, setToast] = useState(null); 
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (value, index) => {
    if (isNaN(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleJoin = async () => {
    const currentPin = pin.join('');
    setToast(null);

    if (currentPin.length !== 6) {
      showToast('Пожалуйста, введите 6-значный PIN-код лекции');
      return;
    }

    try {
      const response = await api.post('/lectures/join', {
        pin_code: currentPin
      });
      
      getStudentSessionId();
      const lectureData = response.data;
      localStorage.setItem('currentPin', lectureData.pin_code || currentPin);
      localStorage.setItem('lectureData', JSON.stringify(lectureData));
      
      navigate('/lecture');
      
    } catch (error) {
      console.error('Ошибка входа:', error.response?.data);
      showToast('Лекция не найдена или PIN-код неверен');
    }
  };

  const handleTeacherClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 relative">
      
      {toast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-xl shadow-rose-500/20 flex items-center gap-3 z-50 animate-in slide-in-from-top-4 fade-in duration-300 w-[90%] max-w-sm">
          <AlertCircle size={24} className="shrink-0" />
          <p className="text-sm font-bold flex-1 leading-tight">{toast}</p>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0 cursor-pointer">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-indigo-100 overflow-hidden border border-slate-100 flex flex-col">
        
        <div className="bg-indigo-600 p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                <GraduationCap size={40} strokeWidth={2} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-1 leading-none">LiveLec</h1>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-[0.2em] opacity-80">Интерактивные лекции</p>
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Присоединиться</h2>
          <p className="text-sm text-slate-400 mb-8 max-w-[250px]">
            Введите 6-значный код доступа к текущей лекции
          </p>

          <div className="flex gap-2 mb-10">
            {pin.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                ref={el => inputRefs.current[index] = el}
                className="w-10 h-14 md:w-12 md:h-16 border-2 border-slate-200 rounded-xl text-center font-mono text-2xl font-bold text-indigo-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                value={data}
                onChange={e => handleChange(e.target.value, index)}
                onKeyDown={e => handleKeyDown(e, index)}
              />
            ))}
          </div>

          <button 
            onClick={handleJoin} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all hover:translate-y-[-2px] active:scale-95 group cursor-pointer"
          >
            <span className="text-lg">Войти в лекцию</span>
            <ArrowRight size={22} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="mt-12 w-full pt-8 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Панель управления</p>
            <button 
              onClick={handleTeacherClick}  
              className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors border-2 border-indigo-50 px-6 py-2 rounded-xl hover:bg-indigo-50 cursor-pointer"
            >
               Я преподаватель
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinLecture;