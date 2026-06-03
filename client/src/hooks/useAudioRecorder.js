import { useState, useRef, useCallback } from 'react';

const ASR_LOG = '[LiveLec ASR]';
const SEGMENT_MS = 4000;
const MIN_SEGMENT_BYTES = 2000;

function logAsr(step, details = {}) {
  console.info(ASR_LOG, step, { step, ...details });
}

function logAsrError(err, context = '') {
  const name = err?.name || 'UnknownError';
  const message = err?.message || String(err);
  console.error(`${ASR_LOG} ${context} ${name}: ${message}`, err);
  return { name, message };
}

function ensureGetUserMedia() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {};
  }

  if (!navigator.mediaDevices.getUserMedia) {
    const legacy =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;

    if (!legacy) {
      return false;
    }

    navigator.mediaDevices.getUserMedia = (constraints) =>
      new Promise((resolve, reject) => {
        legacy.call(navigator, constraints, resolve, reject);
      });
  }

  return true;
}

async function queryMicrophonePermission() {
  if (!navigator.permissions?.query) {
    return null;
  }
  try {
    const status = await navigator.permissions.query({ name: 'microphone' });
    logAsr('permission_state', { state: status.state });
    return status.state;
  } catch {
    return null;
  }
}

async function listAudioInputs() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((d) => d.kind === 'audioinput');
    logAsr('audio_inputs', { count: audioInputs.length });
    return audioInputs;
  } catch {
    return [];
  }
}

async function requestMicrophoneStream() {
  if (!ensureGetUserMedia()) {
    throw new Error('UNSUPPORTED');
  }

  const permission = await queryMicrophonePermission();
  if (permission === 'denied') {
    const err = new Error('Микрофон заблокирован для этого сайта.');
    err.name = 'NotAllowedError';
    throw err;
  }

  const audioInputs = await listAudioInputs();
  const attempts = [
    { tag: 'default', constraints: { audio: true } },
    ...audioInputs.map((device, index) => ({
      tag: `device_${index}`,
      constraints: {
        audio: { deviceId: device.deviceId ? { ideal: device.deviceId } : undefined },
      },
    })),
  ];

  let lastError = null;
  for (const { tag, constraints } of attempts) {
    try {
      logAsr('getUserMedia_attempt', { tag });
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      logAsrError(err, `getUserMedia(${tag})`);
    }
  }

  if (audioInputs.length === 0) {
    const err = new Error('Нет устройств записи в системе.');
    err.name = 'NotFoundError';
    throw err;
  }

  throw lastError || new Error('MICROPHONE_UNAVAILABLE');
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

function createMediaRecorder(stream, mimeType) {
  if (mimeType) {
    try {
      return new MediaRecorder(stream, { mimeType });
    } catch {
      // fallback
    }
  }
  return new MediaRecorder(stream);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const parts = reader.result.split(',');
      resolve(parts[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function mapMicError(err) {
  if (err?.message === 'UNSUPPORTED') {
    return 'Браузер не поддерживает микрофон. Используйте Chrome или Edge на http://127.0.0.1:3000';
  }

  const name = err?.name || '';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Микрофон запрещён. Разрешите доступ в настройках сайта (замок в адресной строке).';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Микрофон не найден. Подключите гарнитуру и выберите устройство ввода в Windows.';
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return 'Микрофон занят другим приложением.';
  }

  return `Не удалось запустить запись [${name}].`;
}

export const useAudioRecorder = (onAudioChunk, onError) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const stream = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef('');
  const shouldRecordRef = useRef(false);
  const flushTimerRef = useRef(null);
  const onAudioChunkRef = useRef(onAudioChunk);
  const onErrorRef = useRef(onError);

  onAudioChunkRef.current = onAudioChunk;
  onErrorRef.current = onError;

  const flushSegment = useCallback(async () => {
    if (!chunksRef.current.length) return;

    const blob = new Blob(chunksRef.current, {
      type: mimeTypeRef.current || 'audio/webm',
    });
    chunksRef.current = [];

    if (blob.size < MIN_SEGMENT_BYTES) {
      logAsr('segment_skip_too_small', { bytes: blob.size });
      return;
    }

    try {
      const base64 = await blobToBase64(blob);
      logAsr('segment_sent', { bytes: blob.size, base64Length: base64.length });
      onAudioChunkRef.current?.(base64);
    } catch (err) {
      logAsrError(err, 'segment_encode');
    }
  }, []);

  const startRecorderSegment = useCallback(() => {
    if (!stream.current || !shouldRecordRef.current) return;

    const mimeType = pickRecorderMimeType();
    mimeTypeRef.current = mimeType;
    chunksRef.current = [];

    const recorder = createMediaRecorder(stream.current, mimeType);
    mediaRecorder.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      void flushSegment();
      if (shouldRecordRef.current && stream.current) {
        startRecorderSegment();
      }
    };

    recorder.onerror = () => {
      onErrorRef.current?.('Ошибка записи аудио.');
      shouldRecordRef.current = false;
      setIsRecording(false);
    };

    recorder.start();
    logAsr('segment_started', { mimeType: recorder.mimeType || mimeType || 'default' });
  }, [flushSegment]);

  const stopFlushTimer = useCallback(() => {
    if (flushTimerRef.current) {
      window.clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  const startFlushTimer = useCallback(() => {
    stopFlushTimer();
    flushTimerRef.current = window.setInterval(() => {
      if (mediaRecorder.current?.state === 'recording') {
        mediaRecorder.current.stop();
      }
    }, SEGMENT_MS);
  }, [stopFlushTimer]);

  const stopRecording = useCallback(() => {
    shouldRecordRef.current = false;
    stopFlushTimer();

    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    } else {
      void flushSegment();
    }

    if (stream.current) {
      stream.current.getTracks().forEach((track) => track.stop());
      stream.current = null;
    }

    mediaRecorder.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    logAsr('recording_stopped');
  }, [flushSegment, stopFlushTimer]);

  const startRecordingFromGesture = useCallback(() => {
    logAsr('click_start');

    if (typeof MediaRecorder === 'undefined') {
      onErrorRef.current?.('MediaRecorder не поддерживается в этом браузере.');
      return;
    }

    requestMicrophoneStream()
      .then((mediaStream) => {
        logAsr('microphone_granted');
        stream.current = mediaStream;
        shouldRecordRef.current = true;
        setIsRecording(true);
        startRecorderSegment();
        startFlushTimer();
        logAsr('recording_started', { segmentMs: SEGMENT_MS });
      })
      .catch((err) => {
        logAsrError(err, 'microphone_error');
        onErrorRef.current?.(`${mapMicError(err)} (${err?.name || 'Error'})`);
        stopRecording();
      });
  }, [startRecorderSegment, startFlushTimer, stopRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecordingFromGesture();
    }
  }, [isRecording, startRecordingFromGesture, stopRecording]);

  return { isRecording, toggleRecording, stopRecording };
};
