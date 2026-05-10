import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, Send, AlertTriangle, Mic, Users, 
  MessageSquare, Triangle, Square, Circle, Diamond 
} from 'lucide-react';

const StudentLecture = () => {
  // Состояния для вопросов
  const [questions, setQuestions] = useState([
    { id: 1, text: "А это на оценку?", likes: 12 },
    { id: 2, text: "Можно еще раз ?", likes: 5 },
    { id: 3, text: "А вы скинете презентацию?", likes: 2 },
  ]);

  // Состояния для кнопки "Не понимаю"
  const [isCooldown, setIsCooldown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // --- СОСТОЯНИЯ КВИЗА ---
  const [showQuiz, setShowQuiz] = useState(false); 
  const [quizTimer, setQuizTimer] = useState(15);
  const [selectedOption, setSelectedOption] = useState(null);

  // Таймер для кнопки "Не понимаю"
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsCooldown(false);
    }
  }, [timeLeft]);

  // Таймер для Квиза
  useEffect(() => {
    let timer;
    if (showQuiz && quizTimer > 0) {
      timer = setTimeout(() => setQuizTimer(quizTimer - 1), 1000);
    } else if (showQuiz && quizTimer === 0) {
      timer = setTimeout(() => setShowQuiz(false), 2000);
    }
    return () => clearTimeout(timer);
  }, [showQuiz, quizTimer]);

  const handleNotUnderstand = () => {
    if (isCooldown) return;
    setIsCooldown(true);
    setTimeLeft(60);
  };

  const handleSelectOption = (id) => {
    if (quizTimer > 0) {
      setSelectedOption(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden text-left leading-none">
      
      {/* 1. ГЛОБАЛЬНАЯ ШАПКА */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 shrink-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-indigo-600 text-white p-2 rounded-lg font-black text-xl leading-none">LL</div>
            <div>
              <h1 className="text-sm md:text-lg font-bold text-slate-800 leading-none uppercase tracking-tight">Архитектура БД: ACID</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none">Прямой эфир</span>
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

      {/* 2. ОСНОВНОЙ КОНТЕНТ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 overflow-hidden text-left">
        
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          {/* ASR: Живые субтитры */}
          <div className="bg-slate-900 rounded-3xl p-4 md:p-6 text-white shadow-xl shadow-indigo-900/10 border-l-4 border-rose-500">
            <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold uppercase text-[10px] tracking-widest">
              <Mic size={14} className="animate-pulse" />
              <span>Распознавание речи (Live)</span>
            </div>
            <p className="text-sm md:text-lg italic text-slate-100 font-medium leading-relaxed">
              "...и таким образом, реляционные базы данных позволяют нам гарантировать целостность данных через механизмы ACID..."
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
                    Транзакции <br/> & ACID
                  </h3>
                  <div className="w-20 h-1.5 bg-indigo-500 mx-auto rounded-full"></div>
               </div>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Вопросы */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden h-[400px] lg:h-auto">
          <div className="flex items-center justify-between px-2 shrink-0">
             <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                <MessageSquare size={16} /> Вопросы студентов
             </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
                <p className="text-sm font-medium text-slate-700 leading-snug pr-4">{q.text}</p>
                <button className="flex flex-col items-center gap-1 text-indigo-500 p-1">
                  <ThumbsUp size={18} />
                  <span className="text-[10px] font-bold">{q.likes}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 3. НИЖНЯЯ ПАНЕЛЬ */}
      <footer className="bg-white border-t border-slate-200 p-4 md:p-6 shrink-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          
          <button 
            onClick={handleNotUnderstand}
            disabled={isCooldown}
            className={`w-full md:min-w-[280px] py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all relative overflow-hidden ${
                isCooldown ? 'bg-slate-300 shadow-none' : 'bg-rose-500 shadow-rose-200 active:scale-95'
            }`}
          >
            <AlertTriangle size={20} />
            <span className="text-sm md:text-base uppercase tracking-widest font-black leading-none">
                {isCooldown ? `Ждите ${timeLeft} сек` : 'Я НЕ ПОНИМАЮ'}
            </span>
          </button>

          <div className="w-full relative">
            <input 
              type="text" 
              placeholder="Спрашивайте анонимно..." 
              className="w-full bg-slate-100 rounded-2xl px-6 py-5 text-sm md:text-base font-medium outline-none border-2 border-transparent focus:border-indigo-400 focus:bg-white transition-all pr-16"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-xl">
                <Send size={20} />
            </button>
          </div>
        </div>
      </footer>

      {/* --- МОДАЛЬНОЕ ОКНО КВИЗА --- */}
      {showQuiz && (
        <div className="fixed inset-0 z-[100] bg-indigo-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
           
           {/* Таймер */}
           <div className="absolute top-10 flex flex-col items-center">
              <div className="relative flex items-center justify-center w-20 h-20">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
                    <circle 
                        cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" 
                        strokeDasharray="226" 
                        strokeDashoffset={226 - (226 * quizTimer) / 15}
                        className="text-white transition-all duration-1000" 
                    />
                 </svg>
                 <span className="absolute text-2xl font-black font-mono leading-none">{quizTimer}</span>
              </div>
           </div>

           <div className="max-w-2xl mb-12">
              <h2 className="text-2xl md:text-4xl font-black italic">
                 Какое свойство ACID отвечает за неделимость транзакции?
              </h2>
           </div>

           <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => handleSelectOption(1)}
                className={`p-6 rounded-[2rem] flex items-center gap-6 transition-all ${selectedOption === 1 ? 'ring-8 ring-white bg-rose-600' : 'bg-rose-500'}`}
              >
                 <Triangle size={28} fill="currentColor" />
                 <span className="text-xl font-black uppercase tracking-widest">Atomicity</span>
              </button>

              <button 
                onClick={() => handleSelectOption(2)}
                className={`p-6 rounded-[2rem] flex items-center gap-6 transition-all ${selectedOption === 2 ? 'ring-8 ring-white bg-blue-600' : 'bg-blue-500'}`}
              >
                 <Diamond size={28} fill="currentColor" />
                 <span className="text-xl font-black uppercase tracking-widest">Consistency</span>
              </button>

              <button 
                onClick={() => handleSelectOption(3)}
                className={`p-6 rounded-[2rem] flex items-center gap-6 transition-all ${selectedOption === 3 ? 'ring-8 ring-white bg-amber-500' : 'bg-amber-400'}`}
              >
                 <Circle size={28} fill="currentColor" />
                 <span className="text-xl font-black uppercase tracking-widest">Isolation</span>
              </button>

              <button 
                onClick={() => handleSelectOption(4)}
                className={`p-6 rounded-[2rem] flex items-center gap-6 transition-all ${selectedOption === 4 ? 'ring-8 ring-white bg-emerald-600' : 'bg-emerald-500'}`}
              >
                 <Square size={28} fill="currentColor" />
                 <span className="text-xl font-black uppercase tracking-widest">Durability</span>
              </button>
           </div>
        </div>
      )}

      {/* Кнопка теста */}
      <button 
        onClick={() => {setShowQuiz(true); setQuizTimer(15); setSelectedOption(null);}}
        className="fixed top-24 right-4 bg-white/10 p-2 rounded-full text-[8px] text-slate-400 z-50 uppercase font-bold"
      >
        Test Quiz
      </button>

    </div>
  );
};

export default StudentLecture;