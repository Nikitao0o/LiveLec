import { useState, useRef, useCallback } from 'react';

function isMicrophoneContextAvailable() {
  if (window.isSecureContext) return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

async function requestMicrophoneStream() {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  }

  const legacyGetUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

  if (!legacyGetUserMedia) {
    throw new Error('UNSUPPORTED');
  }

  return new Promise((resolve, reject) => {
    legacyGetUserMedia.call(navigator, { audio: true }, resolve, reject);
  });
}

function pickRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function mapMicError(err) {
  if (err?.message === 'UNSUPPORTED') {
    return 'Браузер не поддерживает запись с микрофона. Откройте сайт через http://127.0.0.1:3000 (не по IP-адресу сети).';
  }
  if (!isMicrophoneContextAvailable()) {
    return 'Микрофон доступен только по HTTPS или на localhost / 127.0.0.1. Используйте http://127.0.0.1:3000';
  }
  const name = err?.name || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Доступ к микрофону запрещён. Разрешите микрофон в настройках браузера и обновите страницу.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Микрофон не найден. Подключите устройство и попробуйте снова.';
  }
  if (name === 'NotReadableError') {
    return 'Микрофон занят другим приложением. Закройте его и попробуйте снова.';
  }
  return 'Не удалось запустить запись. Проверьте микрофон и разрешения браузера.';
}

export const useAudioRecorder = (onAudioChunk, onError) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const stream = useRef(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    if (stream.current) {
      stream.current.getTracks().forEach((track) => track.stop());
      stream.current = null;
    }
    mediaRecorder.current = null;
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (typeof MediaRecorder === 'undefined') {
      if (onError) onError('MediaRecorder не поддерживается в этом браузере.');
      return;
    }

    try {
      stream.current = await requestMicrophoneStream();
      const mimeType = pickRecorderMimeType();
      const options = mimeType ? { mimeType } : undefined;
      mediaRecorder.current = new MediaRecorder(stream.current, options);

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

      mediaRecorder.current.onerror = () => {
        if (onError) onError('Ошибка записи аудио.');
        stopRecording();
      };

      mediaRecorder.current.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error('Ошибка доступа к микрофону:', err);
      if (onError) onError(mapMicError(err));
      stopRecording();
    }
  }, [onAudioChunk, onError, stopRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return { isRecording, toggleRecording, stopRecording };
};
