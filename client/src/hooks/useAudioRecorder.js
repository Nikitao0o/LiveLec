import { useState, useRef, useCallback } from 'react';

export const useAudioRecorder = (onAudioChunk, onError) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const stream = useRef(null);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (onError) onError("Браузер заблокировал доступ к микрофону. Используйте localhost или HTTPS соединение.");
      return;
    }

    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream.current, { mimeType: 'audio/webm' });

      mediaRecorder.current.ondataavailable = async (e) => {
        if (e.data.size > 0 && onAudioChunk) {
          const reader = new FileReader();
          reader.readAsDataURL(e.data);
          reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
            onAudioChunk(base64data);
          };
        }
      };

      mediaRecorder.current.start(1000);
      setIsRecording(true);
      
    } catch (err) {
      console.error("Ошибка доступа к микрофону:", err);
      if (onError) onError("Не удалось получить доступ к микрофону. Проверьте разрешения в браузере.");
    }
  }, [onAudioChunk, onError]);

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