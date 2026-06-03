import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, Send, AlertTriangle, Mic, Users, 
  MessageSquare, Triangle, Square, Circle, Diamond 
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNavigate } from 'react-router-dom';
import { getSlideImageUrl } from '../utils/slides';

const StudentLecture = () => {
  const navigate = useNavigate();
  const pinCode = localStorage.getItem('currentPin');
  const initialData = JSON.parse(localStorage.getItem('lectureData') || '{}');

  useEffect(() => {
    if (!pinCode) navigate('/');
  }, [pinCode, navigate]);

  const { isConnected, lastMessage, sendMessage } = useWebSocket(pinCode, 'student');
  const [participantsCount, setParticipantsCount] = useState(0);
  const [questions, setQuestions] = useState(initialData.questions || []);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isCooldown, setIsCooldown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [subtitles, setSubtitles] = useState("Ожидание речи преподавателя...");

  const [showQuiz, setShowQuiz] = useState(false); 
  const [quizData, setQuizData] = useState(null);
  const [quizTimer, setQuizTimer] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [lectureId, setLectureId] = useState(initialData.lecture_id || null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [slideCount, setSlideCount] = useState(0);

  const slideImageUrl = getSlideImageUrl(lectureId, currentSlide, pinCode);

  useEffect(() => {
    if (!lastMessage) return;
    switch (lastMessage.type) {
      case 'CONNECTED':
        if (lastMessage.data.lecture_id) setLectureId(lastMessage.data.lecture_id);
        if (lastMessage.data.slide_count) {
          setSlideCount(lastMessage.data.slide_count);
          setCurrentSlide(lastMessage.data.current_slide || 1);
        }
        break;
      case 'SLIDE_CHANGE':
        setCurrentSlide(lastMessage.data.slide_number);
        if (lastMessage.data.total_slides) setSlideCount(lastMessage.data.total_slides);
        if (lastMessage.data.lecture_id) setLectureId(lastMessage.data.lecture_id);
        break;
      case 'PARTICIPANTS_UPDATE':
        setParticipantsCount(lastMessage.data.count);
        break;
      case 'NEW_QUESTION':
        setQuestions((prev) => [lastMessage.data, ...prev]);
        break;
      case 'LIKE_UPDATE':
        setQuestions((prev) => prev.map(q => 
          q.id === lastMessage.data.question_id ? { ...q, likes_count: lastMessage.data.likes_count } : q
        ).sort((a, b) => b.likes_count - a.likes_count));
        break;
      case 'ASR_TEXT':
        setSubtitles(lastMessage.data.text);
        break;
      case 'QUIZ_START':
        setQuizData(lastMessage.data);
        setQuizTimer(lastMessage.data.duration);
        setShowQuiz(true);
        setSelectedOption(null);
        break;
      default:
        break;
    }
  }, [lastMessage]);

  useEffect(() => {
    let timer;
    if (timeLeft > 0) timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    else setIsCooldown(false);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  useEffect(() => {
    let timer;
    if (showQuiz && quizTimer > 0) {
      timer = setTimeout(() => setQuizTimer(quizTimer - 1), 1000);
    } else if (showQuiz && quizTimer === 0) {
      timer = setTimeout(() => setShowQuiz(false), 3000);
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

  const handleSelectOption = (index) => {
    if (quizTimer > 0 && selectedOption === null) {
      setSelectedOption(index);
      sendMessage('QUIZ_ANSWER', { option_index: index });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden text-left leading-none">
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 overflow-hidden text-left">
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          <div className="bg-slate-900 rounded-3xl p-4 md:p-6 text-white shadow-xl shadow-indigo-900/10 border-l-4 border-rose-500">
            <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold uppercase text-[10px] tracking-widest">
              <Mic size={14} className="animate-pulse" />
              <span>Распознавание речи (Live)</span>
            </div>
            <p className="text-sm md:text-lg italic text-slate-100 font-medium leading-relaxed transition-all">
              "{subtitles}"
            </p>
          </div>
          <div className="flex-1 min-h-[250px] md:min-h-[400px] bg-white rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
            <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
              {slideCount > 0 ? `Слайд ${currentSlide} / ${slideCount}` : 'Ожидание презентации'}
            </div>
            <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
              {slideCount > 0 && slideImageUrl ? (
                <img
                  src={slideImageUrl}
                  alt={`Слайд ${currentSlide}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center text-white px-8">
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic leading-tight opacity-80">
                    {initialData.title || 'Лекция'}
                  </h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4">
                    Преподаватель ещё не загрузил слайды
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

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
                <button onClick={() => handleLikeQuestion(q.id)} className="flex flex-col items-center gap-1 text-indigo-500 p-1 hover:text-indigo-700 transition-colors cursor-pointer">
                  <ThumbsUp size={18} />
                  <span className="text-[10px] font-bold">{q.likes_count}</span>
                </button>
              </div>
            ))}
            {questions.length === 0 && <p className="text-sm text-slate-400 text-center mt-4">Пока нет вопросов. Задайте первый!</p>}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 p-4 md:p-6 shrink-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <button onClick={handleNotUnderstand} disabled={isCooldown || !isConnected} className={`w-full md:min-w-[280px] py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all relative overflow-hidden ${(isCooldown || !isConnected) ? 'bg-slate-300 shadow-none' : 'bg-rose-500 shadow-rose-200 active:scale-95 cursor-pointer'}`}>
            <AlertTriangle size={20} />
            <span className="text-sm md:text-base uppercase tracking-widest font-black leading-none">{isCooldown ? `Ждите ${timeLeft} сек` : 'Я НЕ ПОНИМАЮ'}</span>
          </button>
          <div className="w-full relative">
            <input type="text" value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()} placeholder="Спрашивайте анонимно..." className="w-full bg-slate-100 rounded-2xl px-6 py-5 text-sm md:text-base font-medium outline-none border-2 border-transparent focus:border-indigo-400 focus:bg-white transition-all pr-16" />
            <button onClick={handleSendQuestion} disabled={!newQuestionText.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white p-3 rounded-xl cursor-pointer transition-colors"><Send size={20} /></button>
          </div>
        </div>
      </footer>

      {showQuiz && quizData && (
        <div className="fixed inset-0 z-[100] bg-indigo-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
           <div className="absolute top-10 flex flex-col items-center">
              <div className="relative flex items-center justify-center w-20 h-20">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="226" strokeDashoffset={226 - (226 * quizTimer) / quizData.duration} className="text-white transition-all duration-1000" />
                 </svg>
                 <span className="absolute text-2xl font-black font-mono leading-none">{quizTimer}</span>
              </div>
           </div>

           <div className="max-w-2xl mb-12">
              <h2 className="text-2xl md:text-4xl font-black italic">{quizData.question}</h2>
           </div>

           <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizData.options.map((opt, idx) => {
                 if (!opt) return null;
                 const icons = [<Triangle size={28} fill="currentColor" />, <Diamond size={28} fill="currentColor" />, <Circle size={28} fill="currentColor" />, <Square size={28} fill="currentColor" />];
                 const colors = ['bg-rose-500', 'bg-blue-500', 'bg-amber-400', 'bg-emerald-500'];
                 const activeColors = ['bg-rose-600 ring-8 ring-white', 'bg-blue-600 ring-8 ring-white', 'bg-amber-500 ring-8 ring-white', 'bg-emerald-600 ring-8 ring-white'];
                 
                 return (
                   <button 
                     key={idx}
                     onClick={() => handleSelectOption(idx)}
                     className={`p-6 rounded-[2rem] flex items-center gap-6 transition-all ${selectedOption === idx ? activeColors[idx] : colors[idx]} ${selectedOption !== null && selectedOption !== idx ? 'opacity-50' : ''}`}
                     disabled={selectedOption !== null}
                   >
                      {icons[idx]}
                      <span className="text-xl font-black uppercase tracking-widest">{opt}</span>
                   </button>
                 );
              })}
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentLecture;