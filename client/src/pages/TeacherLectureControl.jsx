import React, { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, PlayCircle, Mic, 
  ChevronLeft, ChevronRight, XCircle, BarChart3, X,
  Triangle, Square, Circle, Diamond
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

const TeacherLectureControl = () => {
  const navigate = useNavigate();
  const pinCode = localStorage.getItem('teacherPin') || '481516';

  // --- WEBSOCKETS ---
  const { isConnected, lastMessage, sendMessage } = useWebSocket(pinCode, 'teacher');
  const [participantsCount, setParticipantsCount] = useState(0);

  // Вопросы
  const [questions, setQuestions] = useState([]);

  // Аналитика (график)
  const [analyticsData, setAnalyticsData] = useState(
    Array.from({ length: 6 }).map((_, i) => ({ time: `-${5-i}m`, value: 0 }))
  );

  // --- ЗАХВАТ АУДИО (ASR) ---
  const { isRecording, toggleRecording } = useAudioRecorder((base64Chunk) => {
    // Отправляем аудио чанк на бэкенд
    sendMessage('AUDIO_CHUNK', { chunk: base64Chunk });
  });

  // Обработка входящих WS-сообщений
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'PARTICIPANTS_UPDATE':
        setParticipantsCount(lastMessage.data.count);
        break;
      case 'NEW_QUESTION':
        setQuestions((prev) => [lastMessage.data, ...prev]);
        break;
      case 'LIKE_UPDATE':
        setQuestions((prev) => prev.map(q => 
          q.id === lastMessage.data.question_id 
            ? { ...q, likes_count: lastMessage.data.likes_count } 
            : q
        ).sort((a, b) => b.likes_count - a.likes_count));
        break;
      case 'CONFUSION_UPDATE':
        setAnalyticsData(prev => {
          const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newData = [...prev, { time: now, value: lastMessage.data.total_confusion_count }];
          if (newData.length > 10) newData.shift();
          return newData;
        });
        break;
      default:
        break;
    }
  }, [lastMessage]);

  // --- ЛОГИКА КВИЗА (Заглушка) ---
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizTimer, setQuizTimer] = useState(15);
  const [quizResults, setQuizResults] = useState({ 1: 45, 2: 30, 3: 12, 4: 8 });
  const totalVotes = Object.values(quizResults).reduce((a, b) => a + b, 0);

  useEffect(() => {
    let timer;
    if (isQuizActive && quizTimer > 0) {
      timer = setTimeout(() => setQuizTimer(quizTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isQuizActive, quizTimer]);

  const startQuiz = () => {
    setIsQuizActive(true);
    setQuizTimer(15);
  };

  const finishLecture = () => {
    if (isRecording) toggleRecording(); // Выключаем микрофон при завершении
    navigate('/teacher/analytics');
  };

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden text-left leading-none">
      {/* 1. HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-6 text-left">
          <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-black tracking-tighter leading-none">LiveLec</div>
          <div className="text-left">
             <h1 className="text-lg font-bold text-slate-800 leading-none uppercase tracking-tight">Архитектура БД: ACID</h1>
             <div className="flex items-center gap-2 mt-1 leading-none text-left">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  {isConnected ? 'В эфире' : 'Ожидание подключения'}
                </span>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-8 leading-none">
           <div className="flex items-center gap-2 text-slate-400 font-medium leading-none">
              <Users size={18} />
              <span className="text-sm font-bold tracking-tighter">{participantsCount} студентов</span>
           </div>
           <div className="flex items-center gap-4 leading-none text-left">
              <div className="text-right leading-none mr-2">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Код входа</p>
                 <p className="text-3xl font-mono font-black text-indigo-600 tracking-tighter leading-none">{pinCode}</p>
              </div>
              <button 
                onClick={finishLecture} 
                className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-bold border border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-2 leading-none cursor-pointer"
              >
                 <XCircle size={18} /> Завершить
              </button>
           </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* ЛЕВО: ВОПРОСЫ */}
        <aside className="w-80 md:w-96 flex flex-col gap-4 shrink-0 text-left">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2 px-2 leading-none text-left">
            <MessageSquare size={16} /> Вопросы
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 leading-none text-left">
            {questions.map((q) => (
              <div key={q.id} className="p-5 rounded-[2rem] bg-white border border-slate-200 shadow-sm leading-none text-left transition-all hover:border-indigo-200">
                <div className="flex justify-between items-start mb-2 leading-none">
                   <span className="text-indigo-600 font-black text-sm ml-auto leading-none tracking-tighter italic">↑ {q.likes_count} лайков</span>
                </div>
                <p className="text-sm font-bold text-slate-800 italic leading-snug tracking-tighter">"{q.content}"</p>
              </div>
            ))}
            {questions.length === 0 && (
               <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-widest mt-10">Пока пусто</p>
            )}
          </div>
        </aside>

        {/* ПРАВО: ПУЛЬТ УПРАВЛЕНИЯ */}
        <main className="flex-1 flex flex-col gap-6 overflow-hidden leading-none text-left">
          <div className="flex-1 bg-indigo-900 rounded-[2.5rem] relative overflow-hidden flex flex-col shadow-2xl border-4 border-white leading-none">
            {/* --- ОВЕРЛЕЙ КВИЗА --- */}
            {isQuizActive && (
              <div className="absolute inset-0 z-50 bg-indigo-950 flex flex-col p-8 text-white animate-in fade-in duration-300 text-left">
                {/* Шапка квиза */}
                <div className="flex justify-between items-start mb-6 shrink-0 leading-none">
                  <div className="leading-none text-left">
                    <div className="flex items-center gap-3 mb-2 leading-none">
                       <span className="bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded uppercase animate-pulse leading-none">Live Quiz</span>
                       <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-none">Результаты опроса</h3>
                    </div>
                    <p className="text-indigo-300 font-bold uppercase text-[10px] tracking-widest leading-none">
                       {quizTimer > 0 ? `Осталось: ${quizTimer}с` : 'Опрос окончен'}
                    </p>
                  </div>
                  <button onClick={() => setIsQuizActive(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors leading-none cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
                {/* ТЕКСТ ВОПРОСА */}
                <div className="mb-6 shrink-0 text-left">
                   <h2 className="text-lg md:text-xl font-black leading-tight text-indigo-50 italic opacity-90 tracking-tight leading-none">
                      "Какое свойство ACID отвечает за неделимость транзакции?"
                   </h2>
                </div>
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 text-left pt-2">
                   {[
                     { id: 1, label: 'Atomicity', icon: <Triangle size={14} fill="currentColor" />, color: 'bg-rose-500', text: 'text-rose-500' },
                     { id: 2, label: 'Consistency', icon: <Diamond size={14} fill="currentColor" />, color: 'bg-blue-500', text: 'text-blue-500' },
                     { id: 3, label: 'Isolation', icon: <Circle size={14} fill="currentColor" />, color: 'bg-amber-500', text: 'text-amber-500' },
                     { id: 4, label: 'Durability', icon: <Square size={14} fill="currentColor" />, color: 'bg-emerald-500', text: 'text-emerald-500' }
                   ].map((opt) => (
                     <div key={opt.id} className="space-y-2 leading-none text-left">
                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest leading-none">
                           <div className="flex items-center gap-2 leading-none">
                              <span className={opt.text}>{opt.icon}</span>
                              <span className="opacity-90">{opt.label}</span>
                           </div>
                           <span className="font-bold text-indigo-300 italic">{quizResults[opt.id]} ответов</span>
                        </div>
                        <div className="h-3.5 bg-white/10 rounded-full overflow-hidden border border-white/5 leading-none">
                           <div 
                              className={`h-full ${opt.color} transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(0,0,0,0.2)]`}
                              style={{ width: `${(quizResults[opt.id] / totalVotes) * 100}%` }}
                           />
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}
            {/* КОНТЕНТ СЛАЙДА */}
            <div className="flex-1 flex items-center justify-center p-10 text-center text-white leading-none">
               <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-tight leading-none">
                  Базы Данных: <br/> Архитектура ACID
               </h2>
            </div>
            {/* СЛАЙДЕР КОНТРОЛ */}
            <div className="p-4 bg-black/20 backdrop-blur-sm flex justify-between items-center px-10 text-white shrink-0 leading-none">
               <button 
                  onClick={() => sendMessage('SLIDE_CHANGE', { slide_number: 3 })}
                  className="text-white/60 hover:text-white transition-colors flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest leading-none cursor-pointer"
                >
                  <ChevronLeft size={16}/> Назад
               </button>
               <button 
                  onClick={() => sendMessage('SLIDE_CHANGE', { slide_number: 5 })}
                  className="text-white hover:text-indigo-400 transition-colors flex items-center gap-2 font-black uppercase text-[10px] tracking-widest leading-none cursor-pointer"
                >
                  Вперед <ChevronRight size={16}/>
               </button>
            </div>
          </div>

          {/* ГРАФИК ПОНИМАНИЯ */}
          <div className="h-40 bg-white rounded-[2rem] border border-slate-200 p-5 flex flex-col shadow-sm shrink-0 leading-none text-left">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3 leading-none text-left">
              <BarChart3 size={12} /> Понимание аудитории (Счетчик кликов "Не понимаю")
            </h3>
            <div className="flex-1 w-full leading-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData}>
                  <Area type="step" dataKey="value" stroke="#f43f5e" strokeWidth={3} fill="#f43f5e15" isAnimationActive={true} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* КНОПКИ */}
          <div className="grid grid-cols-2 gap-4 shrink-0 leading-none">
             <button 
               onClick={startQuiz}
               className="bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 leading-none cursor-pointer"
             >
                <PlayCircle size={24} /> Запустить Блиц-Опрос
             </button>
             <button 
                onClick={toggleRecording}
                className={`border-4 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all leading-none cursor-pointer ${
                  isRecording 
                    ? 'bg-rose-50 border-rose-500 text-rose-600 hover:bg-rose-100' 
                    : 'bg-white border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Mic size={24} className={isRecording ? 'animate-pulse' : ''} /> 
                {isRecording ? 'Остановить ASR' : 'Запуск ASR (Живой звук)'}
             </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherLectureControl;