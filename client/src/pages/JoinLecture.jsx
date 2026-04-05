import React, { useState, useRef } from 'react';
import { ArrowRight, GraduationCap } from 'lucide-react';

const JoinLecture = () => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const handleChange = (value, index) => {
    if (isNaN(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Авто-переход на следующее поле
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Удаление (Backсpace) возвращает на предыдущее поле
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      {/* Контейнер: на мобилке w-full, на десктопе max-w-md (карточка) */}
      <div className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-indigo-100 overflow-hidden border border-slate-100 flex flex-col">
        
        {/* Верхняя часть (Брендинг) */}
        <div className="bg-indigo-600 p-8 md:p-12 text-center text-white relative overflow-hidden">
          {/* Декоративный фон (круги) */}
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

        {/* Форма ввода */}
        <div className="p-8 md:p-10 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Присоединиться</h2>
          <p className="text-sm text-slate-400 mb-8 max-w-[250px]">
            Введите 6-значный код доступа к текущей лекции
          </p>

          {/* PIN-код сегменты */}
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

          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all hover:translate-y-[-2px] active:scale-95 group">
            <span className="text-lg">Войти в лекцию</span>
            <ArrowRight size={22} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Переход для преподавателя */}
          <div className="mt-12 w-full pt-8 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Панель управления</p>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors border-2 border-indigo-50 px-6 py-2 rounded-xl hover:bg-indigo-50">
               Я преподаватель
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinLecture;