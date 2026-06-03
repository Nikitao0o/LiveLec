import { useState, useEffect, useCallback, useRef } from 'react';

export const useWebSocket = (pinCode, userType) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    if (!pinCode) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/${pinCode}?user_type=${userType}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => setIsConnected(true);
    
    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WS соединение закрыто');
    };
    
    ws.current.onerror = (error) => console.error("WS Ошибка:", error);

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (e) {
        console.error("Неверный формат сообщения WS");
      }
    };

    // Очистка при размонтировании компонента
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [pinCode, userType]);

  // Функция для отправки сообщений на сервер
  const sendMessage = useCallback((type, data = {}) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
};