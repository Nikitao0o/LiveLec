import { useState, useRef, useCallback } from 'react';

export const useAudioRecorder = (onAudioChunk) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const stream = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      // Запрашиваем доступ к микрофону
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Создаем рекордер (предпочтительно webm, так как он хорошо работает в браузере)
      mediaRecorder.current = new MediaRecorder(stream.current, { mimeType: 'audio/webm' });

      // Когда готов новый чанк данных (каждую секунду)
      mediaRecorder.current.ondataavailable = async (e) => {
        if (e.data.size > 0 && onAudioChunk) {
          // Конвертируем Blob в Base64 для передачи через JSON WebSocket
          const reader = new FileReader();
          reader.readAsDataURL(e.data);
          reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
            onAudioChunk(base64data);
          };
        }
      };

      // Запускаем сбор чанков каждую 1000 мс (1 секунда)
      mediaRecorder.current.start(1000);
      setIsRecording(true);
      
    } catch (err) {
      console.error("Ошибка доступа к микрофону:", err);
      alert("Не удалось получить доступ к микрофону. Проверьте разрешения браузера.");
    }
  }, [onAudioChunk]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    if (stream.current) {
      stream.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return { isRecording, toggleRecording };
};