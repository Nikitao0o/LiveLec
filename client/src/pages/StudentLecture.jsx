import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, Send, AlertTriangle, Mic, Users, 
  MessageSquare, Triangle, Square, Circle, Diamond 
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNavigate } from 'react-router-dom';

const StudentLecture = () => {
  const navigate = useNavigate();
  const pinCode = localStorage.getItem('currentPin');
  const initialData = JSON.parse(localStorage.getItem('lectureData') || '{}');

  useEffect(() => {
    if (!pinCode) navigate('/');
  }, [pinCode, navigate]);

  // --- WEBSOCKETS ---
  const { isConnected, lastMessage, sendMessage } = useWebSocket(pinCode, 'student');
  const [participantsCount, setParticipantsCount] = useState(0);

  // Вопросы
  const [questions, setQuestions] = useState(initialData.questions || []);
  const [newQuestionText, setNewQuestionText] = useState('');

  // Кулдаун
  const [isCooldown, setIsCooldown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Квиз
  const [showQuiz, setShowQuiz] = useState(false); 
  const [quizTimer, setQuizTimer] = useState(15);
  const [selectedOption, setSelectedOption] = useState(null);

  // ASR (Субтитры)
  const [subtitles, setSubtitles] = useState("Ожидание речи преподавателя...");

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
      case 'ASR_TEXT':
        // Добавляем новый текст субтитров
        setSubtitles(lastMessage.data.text);
        break;
      default:
        break;
    }
  }, [lastMessage]);

  // Таймер кулдауна
  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else {
      setIsCooldown(false);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Таймер Квиза
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
    sendMessage('CONFUSION_CLICK');
    setIsCooldown(true);
    setTimeLeft(60);
  };

  const handleSendQuestion = () => {
    if (!newQuestionText.trim()) return;
    sendMessage('NEW_QUESTION', { content: newQuestionText });
    setNewQuestionText('');
  };

  const handleLikeQuestion = (id) => {
    sendMessage('LIKE_QUESTION', { question_id: id });
  };

  const handleSelectOption = (id) => {
    if (quizTimer > 0) setSelectedOption(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden text-left leading-none">
      {/* 1. ГЛОБАЛЬНАЯ ШАПКА */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 shrink-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-indigo-600 text-white p-2 rounded-lg font-black text-xl leading-none">LL</div>
            <div>
              <h1 className="text-sm md:text-lg font-bold text-slate-800 leading-none uppercase tracking-tight">
                {initialData.title || 'Лекция'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`flex h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none">
                  {isConnected ? 'Прямой эфир' : 'Отключено'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-slate-400 mr-4">
                <Users size={16} />
                <span className="text-sm font-medium">{participantsCount} в сети</span>
             </div>
             <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-mono font-bold border border-indigo-100">
               PIN: {pinCode}
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
            <p className="text-sm md:text-lg italic text-slate-100 font-medium leading-relaxed transition-all">
              "{subtitles}"
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
                <p className="text-sm font-medium text-slate-700 leading-snug pr-4">{q.content}</p>
                <button 
                  onClick={() => handleLikeQuestion(q.id)}
                  className="flex flex-col items-center gap-1 text-indigo-500 p-1 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  <ThumbsUp size={18} />
                  <span className="text-[10px] font-bold">{q.likes_count}</span>
                </button>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-sm text-slate-400 text-center mt-4">Пока нет вопросов. Задайте первый!</p>
            )}
          </div>
        </div>
      </main>

      {/* 3. НИЖНЯЯ ПАНЕЛЬ */}
      <footer className="bg-white border-t border-slate-200 p-4 md:p-6 shrink-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <button 
            onClick={handleNotUnderstand}
            disabled={isCooldown || !isConnected}
            className={`w-full md:min-w-[280px] py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all relative overflow-hidden ${
                (isCooldown || !isConnected) ? 'bg-slate-300 shadow-none' : 'bg-rose-500 shadow-rose-200 active:scale-95 cursor-pointer'
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
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
              placeholder="Спрашивайте анонимно..." 
              className="w-full bg-slate-100 rounded-2xl px-6 py-5 text-sm md:text-base font-medium outline-none border-2 border-transparent focus:border-indigo-400 focus:bg-white transition-all pr-16"
            />
            <button 
              onClick={handleSendQuestion}
              disabled={!newQuestionText.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white p-3 rounded-xl cursor-pointer transition-colors"
            >
                <Send size={20} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentLecture;