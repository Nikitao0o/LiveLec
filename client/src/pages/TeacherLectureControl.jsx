import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, MessageSquare, PlayCircle, Mic, 
  ChevronLeft, ChevronRight, XCircle, BarChart3, X,
  Triangle, Square, Circle, Diamond, AlertCircle, Upload, FileText, ZoomIn
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import api from '../api';
import { getSlideImageUrl } from '../utils/slides';

const TeacherLectureControl = () => {
  const navigate = useNavigate();
  const lecture = JSON.parse(localStorage.getItem('currentLecture') || '{}');
  const pinCode = lecture.pin_code || '---';
  const lectureId = lecture.id;
  const fileInputRef = useRef(null);

  const { isConnected, sendMessage, subscribe } = useWebSocket(pinCode, 'teacher');
  const isConnectedRef = useRef(isConnected);
  isConnectedRef.current = isConnected;
  const [participantsCount, setParticipantsCount] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(
    Array.from({ length: 6 }).map((_, i) => ({ time: `-${5-i}m`, value: 0 }))
  );
  const [toast, setToast] = useState(null);

  const [slideCount, setSlideCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [asrStatus, setAsrStatus] = useState('');
  const [slideZoomOpen, setSlideZoomOpen] = useState(false);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 5000);
  };

  const { isRecording, toggleRecording } = useAudioRecorder(
    (base64Chunk) => {
      if (!isConnectedRef.current) {
        showToast('Нет связи с сервером — субтитры студентам не отправляются.');
        return;
      }
      sendMessage('AUDIO_CHUNK', { chunk: base64Chunk });
    },
    (errorMsg) => showToast(errorMsg)
  );

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizTimer, setQuizTimer] = useState(0);
  const [quizResults, setQuizResults] = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [quizForm, setQuizForm] = useState({
    question: '',
    options: ['', '', '', ''],
    duration: 30
  });

  const totalVotes = Object.values(quizResults).reduce((a, b) => a + b, 0);
  const slideImageUrl = getSlideImageUrl(lectureId, currentSlide, pinCode);

  useEffect(() => {
    if (!lectureId) return;
    api.get(`/lectures/${lectureId}/presentation`)
      .then((res) => {
        setSlideCount(res.data.slide_count || 0);
        setCurrentSlide(res.data.current_slide || 1);
      })
      .catch(() => {});
  }, [lectureId]);

  useEffect(() => {
    if (!lectureId) return;
    api
      .get(`/questions/lecture/${lectureId}`)
      .then((res) => setQuestions(res.data || []))
      .catch(() => {});
  }, [lectureId]);

  useEffect(() => {
    if (!lectureId) return;
    api
      .get(`/lectures/${lectureId}/analytics`)
      .then((res) => {
        const raw = res.data?.chart_data || [];
        if (!raw.length) return;
        let total = 0;
        const points = raw.map((item) => {
          total += item.confusion || 0;
          return { time: item.time, value: total };
        });
        setAnalyticsData(points);
      })
      .catch(() => {});
  }, [lectureId]);

  useEffect(() => {
    const handleMessage = (message) => {
      switch (message.type) {
        case 'PARTICIPANTS_UPDATE':
          setParticipantsCount(message.data.count);
          break;
        case 'NEW_QUESTION':
          setQuestions((prev) => {
            if (prev.some((q) => q.id === message.data.id)) return prev;
            return [message.data, ...prev];
          });
          break;
        case 'LIKE_UPDATE':
          setQuestions((prev) =>
            prev
              .map((q) =>
                q.id === message.data.question_id
                  ? { ...q, likes_count: message.data.likes_count }
                  : q
              )
              .sort((a, b) => b.likes_count - a.likes_count)
          );
          break;
        case 'CONFUSION_UPDATE': {
          const now = new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          setAnalyticsData((prev) => {
            const lastValue = prev.length ? prev[prev.length - 1].value : 0;
            const total =
              message.data.total_confusion_count ??
              lastValue + (message.data.confusion_count || 1);
            const newData = [...prev, { time: now, value: total }];
            if (newData.length > 10) newData.shift();
            return newData;
          });
          break;
        }
        case 'QUIZ_ANSWER':
          setQuizResults((prev) => ({
            ...prev,
            [message.data.option_index]: prev[message.data.option_index] + 1,
          }));
          break;
        case 'ASR_TEXT': {
          const phrase = (message.data?.text || '').trim();
          if (!phrase) break;
          setTranscript((prev) => {
            const base = prev || '';
            return `${base} ${phrase}`.trim().slice(-1200);
          });
          setAsrStatus('');
          break;
        }
        case 'ASR_STATUS': {
          const { status, message: statusMessage } = message.data || {};
          if (status === 'ok') {
            setAsrStatus('');
          } else if (status === 'processing') {
            setAsrStatus(statusMessage || 'Распознавание…');
          } else if (status === 'error') {
            setAsrStatus(`Ошибка: ${statusMessage || 'неизвестно'}`);
            showToast(statusMessage || 'Ошибка распознавания речи');
          } else if (status === 'empty') {
            setAsrStatus('Речь не распознана — говорите громче');
          }
          break;
        }
        default:
          break;
      }
    };

    return subscribe(handleMessage);
  }, [subscribe]);

  useEffect(() => {
    if (!slideZoomOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setSlideZoomOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slideZoomOpen]);

  useEffect(() => {
    let timer;
    if (isQuizActive && quizTimer > 0) {
      timer = setTimeout(() => setQuizTimer(quizTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isQuizActive, quizTimer]);

  const broadcastSlide = (slideNumber) => {
    if (!slideCount) return;
    const next = Math.max(1, Math.min(slideNumber, slideCount));
    setCurrentSlide(next);
    sendMessage('SLIDE_CHANGE', { slide_number: next });
  };

  const handlePresentationUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !lectureId) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'pptx'].includes(ext)) {
      showToast('Поддерживаются только PDF и PPTX');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      const res = await api.post(`/lectures/${lectureId}/presentation`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setSlideCount(res.data.slide_count);
      setCurrentSlide(res.data.current_slide || 1);
      if (res.data.slide_count > 0) {
        sendMessage('SLIDE_CHANGE', { slide_number: res.data.current_slide || 1 });
      }
      showToast(`Презентация загружена: ${res.data.slide_count} слайдов`);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Не удалось загрузить презентацию';
      showToast(typeof detail === 'string' ? detail : 'Ошибка загрузки');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartQuiz = (e) => {
    e.preventDefault();
    sendMessage('QUIZ_START', quizForm);
    setIsQuizActive(true);
    setQuizTimer(quizForm.duration);
    setQuizResults({ 0: 0, 1: 0, 2: 0, 3: 0 });
    setIsQuizModalOpen(false);
  };

  const finishLecture = async () => {
    if (isRecording) toggleRecording();
    try {
      await api.post(`/lectures/${lecture.id}/finish`);
    } catch (err) {
      console.error("Ошибка завершения", err);
    }
    navigate(`/teacher/analytics/${lecture.id}`);
  };

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden text-left leading-none relative">
      
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-xl shadow-rose-500/20 flex items-center gap-3 z-[200] animate-in slide-in-from-top-4 fade-in duration-300 w-[90%] max-w-md">
          <AlertCircle size={24} className="shrink-0" />
          <p className="text-sm font-bold flex-1 leading-tight">{toast}</p>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0 cursor-pointer"><X size={18} /></button>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-6 text-left">
          <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-black tracking-tighter leading-none">LiveLec</div>
          <div className="text-left">
             <h1 className="text-lg font-bold text-slate-800 leading-none uppercase tracking-tight">{lecture.title || "Лекция"}</h1>
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
              <button onClick={finishLecture} className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-bold border border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-2 leading-none cursor-pointer">
                 <XCircle size={18} /> Завершить
              </button>
           </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
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

        <main className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden leading-none text-left">
          <div className="flex-1 min-h-0 bg-indigo-900 rounded-[2.5rem] relative overflow-hidden flex flex-col shadow-2xl border-4 border-white leading-none">
            
            {isQuizActive && (
              <div className="absolute inset-0 z-50 bg-indigo-950 flex flex-col p-8 text-white animate-in fade-in duration-300 text-left">
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
                  <button onClick={() => setIsQuizActive(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors leading-none cursor-pointer"><X size={20} /></button>
                </div>
                
                <div className="mb-6 shrink-0 text-left">
                   <h2 className="text-lg md:text-xl font-black leading-tight text-indigo-50 italic opacity-90 tracking-tight leading-none">
                      "{quizForm.question}"
                   </h2>
                </div>

                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 text-left pt-2">
                   {quizForm.options.map((opt, idx) => {
                     if (!opt) return null;
                     const icons = [<Triangle size={14} fill="currentColor" />, <Diamond size={14} fill="currentColor" />, <Circle size={14} fill="currentColor" />, <Square size={14} fill="currentColor" />];
                     const colors = ['bg-rose-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500'];
                     const textColors = ['text-rose-500', 'text-blue-500', 'text-amber-500', 'text-emerald-500'];
                     return (
                       <div key={idx} className="space-y-2 leading-none text-left">
                          <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest leading-none">
                             <div className="flex items-center gap-2 leading-none">
                                <span className={textColors[idx]}>{icons[idx]}</span>
                                <span className="opacity-90">{opt}</span>
                             </div>
                             <span className="font-bold text-indigo-300 italic">{quizResults[idx]} ответов</span>
                          </div>
                          <div className="h-3.5 bg-white/10 rounded-full overflow-hidden border border-white/5 leading-none">
                             <div 
                                className={`h-full ${colors[idx]} transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(0,0,0,0.2)]`}
                                style={{ width: `${totalVotes > 0 ? (quizResults[idx] / totalVotes) * 100 : 0}%` }}
                             />
                          </div>
                       </div>
                     );
                   })}
                </div>
              </div>
            )}

            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3">
              <div className="bg-black/50 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {slideCount > 0 ? `Слайд ${currentSlide} / ${slideCount}` : 'Презентация не загружена'}
              </div>
              <label className={`bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-colors ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                <Upload size={14} />
                {isUploading ? 'Загрузка…' : 'Загрузить PDF/PPTX'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  className="hidden"
                  onChange={handlePresentationUpload}
                />
              </label>
            </div>

            <div className="flex-1 flex items-stretch justify-center p-2 pt-14 pb-2 min-h-0 w-full overflow-hidden">
              {slideCount > 0 && slideImageUrl ? (
                <button
                  type="button"
                  onClick={() => setSlideZoomOpen(true)}
                  className="group relative flex-1 w-full h-full min-h-0 flex items-center justify-center rounded-xl cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  title="Нажмите, чтобы увеличить слайд"
                >
                  <img
                    key={slideImageUrl}
                    src={slideImageUrl}
                    alt={`Слайд ${currentSlide}`}
                    className="w-full h-full object-contain rounded-xl shadow-2xl bg-white"
                  />
                  <span className="absolute bottom-20 right-6 flex items-center gap-1.5 bg-black/50 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <ZoomIn size={12} /> Увеличить
                  </span>
                </button>
              ) : (
                <div className="text-center text-white px-8">
                  <FileText size={48} className="mx-auto mb-4 opacity-40" />
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-tight">
                    {lecture.title || 'Лекция'}
                  </h2>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-4">
                    Загрузите PDF или PPTX для показа слайдов студентам
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-black/20 backdrop-blur-sm flex justify-between items-center px-10 text-white shrink-0 leading-none">
               <button
                 type="button"
                 disabled={!slideCount || currentSlide <= 1}
                 onClick={() => broadcastSlide(currentSlide - 1)}
                 className="text-white/60 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest leading-none cursor-pointer"
               >
                 <ChevronLeft size={16}/> Назад
               </button>
               <button
                 type="button"
                 disabled={!slideCount || currentSlide >= slideCount}
                 onClick={() => broadcastSlide(currentSlide + 1)}
                 className="text-white hover:text-indigo-400 disabled:opacity-30 transition-colors flex items-center gap-2 font-black uppercase text-[10px] tracking-widest leading-none cursor-pointer"
               >
                 Вперед <ChevronRight size={16}/>
               </button>
            </div>
          </div>

          <div className="h-40 bg-white rounded-[2rem] border border-slate-200 p-5 flex flex-col shadow-sm shrink-0 leading-none text-left">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3 leading-none text-left">
              <BarChart3 size={12} /> Понимание аудитории (Счетчик кликов &quot;Не понимаю&quot;)
            </h3>
            <div className="flex-1 w-full leading-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData}>
                  <Area type="step" dataKey="value" stroke="#f43f5e" strokeWidth={3} fill="#f43f5e15" isAnimationActive={true} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0 leading-none">
             <button 
               onClick={() => setIsQuizModalOpen(true)}
               className="bg-indigo-600 text-white py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 leading-none cursor-pointer"
             >
                <PlayCircle size={24} /> Запустить Блиц-Опрос
             </button>
             <button
                type="button"
                onClick={toggleRecording}
                className={`border-4 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all leading-none cursor-pointer ${
                  isRecording ? 'bg-rose-50 border-rose-500 text-rose-600 hover:bg-rose-100' : 'bg-white border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Mic size={24} className={isRecording ? 'animate-pulse' : ''} /> 
                {isRecording ? 'Остановить ASR' : 'Запуск ASR (Живой звук)'}
             </button>
          </div>

          <div className="shrink-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col max-h-28 overflow-hidden leading-normal">
            <div className="px-5 py-2 border-b border-slate-100 flex items-center justify-between gap-2">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Mic size={12} /> Расшифровка лекции
              </h3>
              {isRecording && (
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest animate-pulse">
                  ASR в эфире
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 text-sm font-medium text-slate-700 leading-snug">
              {transcript ? (
                <p>{transcript}</p>
              ) : (
                <p className="text-slate-400 italic text-xs">
                  {isRecording
                    ? 'Слушаю микрофон… текст появится через несколько секунд.'
                    : 'Запустите ASR, чтобы видеть живую расшифровку (её же получают студенты).'}
                </p>
              )}
            </div>
            {asrStatus && (
              <p className="px-5 pb-2 text-[10px] font-bold text-indigo-500 uppercase tracking-wide">
                {asrStatus}
              </p>
            )}
          </div>
        </main>
      </div>

      {slideZoomOpen && slideImageUrl && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/95 p-4 md:p-8"
          onClick={() => setSlideZoomOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Слайд ${currentSlide}`}
        >
          <button
            type="button"
            onClick={() => setSlideZoomOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X size={28} />
          </button>
          <p className="absolute top-6 left-6 text-white/70 text-xs font-bold uppercase tracking-widest">
            Слайд {currentSlide} / {slideCount} · Esc или клик вне слайда — закрыть
          </p>
          <img
            src={slideImageUrl}
            alt={`Слайд ${currentSlide}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {isQuizModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsQuizModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
             <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                <div>
                   <h3 className="text-2xl font-black tracking-tight leading-none">Новый опрос</h3>
                </div>
                <button onClick={() => setIsQuizModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors leading-none cursor-pointer"><X size={24} /></button>
             </div>
             <form onSubmit={handleStartQuiz} className="p-8 space-y-4 text-left leading-none">
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Вопрос</label>
                   <input type="text" placeholder="Введите вопрос..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500 mt-1 font-bold text-sm" onChange={(e) => setQuizForm({...quizForm, question: e.target.value})} required />
                </div>
                {quizForm.options.map((opt, idx) => (
                  <div key={idx}>
                     <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Вариант {idx + 1}</label>
                     <input type="text" placeholder={`Текст варианта ${idx + 1}`} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2 px-4 outline-none focus:border-indigo-500 mt-1 text-sm font-medium" value={opt} onChange={(e) => {
                        const newOptions = [...quizForm.options];
                        newOptions[idx] = e.target.value;
                        setQuizForm({...quizForm, options: newOptions});
                     }} required={idx < 2} />
                  </div>
                ))}
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest leading-none">Время (сек)</label>
                   <input type="number" min="5" max="120" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-2 px-4 outline-none focus:border-indigo-500 mt-1 text-sm font-bold" value={quizForm.duration} onChange={(e) => setQuizForm({...quizForm, duration: parseInt(e.target.value)})} required />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg mt-4 text-xs uppercase tracking-widest cursor-pointer">Начать трансляцию опроса</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLectureControl;
