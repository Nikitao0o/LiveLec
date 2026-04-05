import React, { useState, useEffect } from 'react';
import { ThumbsUp, Send, AlertTriangle, Mic, Users, MessageSquare } from 'lucide-react';

const StudentLecture = () => {
  const [questions, setQuestions] = useState([
    { id: 1, text: "А это на оценку?", likes: 12 },
    { id: 2, text: "Можно еще раз ?", likes: 5 },
    { id: 3, text: "А вы скинете презентацию?", likes: 2 },
  ]);
  const [isCooldown, setIsCooldown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const handleNotUnderstand = () => {
    if (isCooldown) return;
    setIsCooldown(true);
    setTimeLeft(60);
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsCooldown(false);
    }
  }, [timeLeft]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. ГЛОБАЛЬНАЯ ШАПКА (Full Width) */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-indigo-600 text-white p-2 rounded-lg font-black text-xl">LL</div>
            <div>
              <h1 className="text-sm md:text-lg font-bold text-slate-800 leading-none">Тут название лекции</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Прямой эфир</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-slate-400 mr-4">
                <Users size={16} />
                <span className="text-sm font-medium">142 студента</span>
             </div>
             <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-mono font-bold border border-indigo-100">
               PIN: 481 516
             </div>
          </div>
        </div>
      </header>

      {/* 2. ОСНОВНОЙ КОНТЕНТ (Adaptive Grid) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 overflow-hidden text-left leading-none">
        
        {/* ЛЕВАЯ КОЛОНКА: Слайды и Субтитры (8 из 12 колонок на десктопе) */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          
          {/* ASR: Живые субтитры */}
          <div className="bg-slate-900 rounded-3xl p-4 md:p-6 text-white shadow-xl shadow-indigo-900/10 border-l-4 border-rose-500">
            <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold uppercase text-[10px] tracking-widest">
              <Mic size={14} className="animate-pulse" />
              <span>Распознавание речи (Live)</span>
            </div>
            <p className="text-sm md:text-lg italic text-slate-100 font-medium leading-relaxed">
              "блаблабалбалблаблаблаблабалла фыиашрвфивофтвощфтшовт йвышрифршвифшрыви"
            </p>
          </div>

          {/* Презентация */}
          <div className="flex-1 min-h-[250px] md:min-h-[400px] bg-white rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
            <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
              Слайд 4 / 12
            </div>
            <div className="flex-1 bg-slate-950 flex items-center justify-center p-10 text-center">
               <div className="space-y-4">
                  <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter italic leading-tight">
                    Название   <br/> & Описание 
                  </h3>
                  <div className="w-20 h-1.5 bg-indigo-500 mx-auto rounded-full"></div>
               </div>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Вопросы (4 из 12 колонок на десктопе) */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden h-[400px] lg:h-auto">
          <div className="flex items-center justify-between px-2 shrink-0">
             <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                <MessageSquare size={16} /> Вопросы студентов
             </h3>
             <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">НОВЫХ: 3</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {questions.map((q) => (
              <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all flex justify-between items-start">
                <p className="text-sm font-medium text-slate-700 leading-snug pr-4">{q.text}</p>
                <button className="flex flex-col items-center gap-1 text-indigo-500 hover:bg-indigo-50 p-2 rounded-xl transition-colors">
                  <ThumbsUp size={18} />
                  <span className="text-[10px] font-bold">{q.likes}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* 3. ФИКСИРОВАННАЯ ПАНЕЛЬ (Кнопка и Ввод) */}
      <footer className="bg-white border-t border-slate-200 p-4 md:p-6 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          
          {/* Кнопка "Не понимаю" */}
          <div className="w-full md:w-auto">
             <button 
                onClick={handleNotUnderstand}
                disabled={isCooldown}
                className={`w-full md:min-w-[280px] py-4 md:py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all relative overflow-hidden ${
                    isCooldown ? 'bg-slate-300 shadow-none' : 'bg-rose-500 shadow-rose-200 hover:bg-rose-600 active:scale-95'
                }`}
             >
                <AlertTriangle size={20} className={isCooldown ? 'hidden' : 'block'} />
                <span className="text-sm md:text-base uppercase tracking-widest font-black leading-none">
                    {isCooldown ? `Ждите ${timeLeft} сек` : 'Я НЕ ПОНИМАЮ'}
                </span>
                {isCooldown && (
                    <div 
                        className="absolute bottom-0 left-0 h-1 bg-slate-400 transition-all duration-1000 ease-linear"
                        style={{ width: `${(timeLeft / 60) * 100}%` }}
                    />
                )}
             </button>
          </div>

          {/* Ввод вопроса */}
          <div className="w-full relative">
            <input 
              type="text" 
              placeholder="Есть вопрос по текущей теме? Спрашивайте анонимно..." 
              className="w-full bg-slate-100 rounded-2xl px-6 py-4 md:py-5 text-sm md:text-base font-medium outline-none border-2 border-transparent focus:border-indigo-400 focus:bg-white transition-all pr-16"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 md:p-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                <Send size={20} />
            </button>
          </div>
          
        </div>
      </footer>
    </div>
  );
};

export default StudentLecture;