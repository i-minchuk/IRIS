import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = (() => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  // Use base URL without /api/v1 suffix for WebSocket
  const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
  return baseUrl.replace(/^http/, 'ws') + '/ws';
})();

export interface WSMessage {
  type: 
    | 'presence_join'
    | 'presence_leave'
    | 'presence_update'
    | 'subscribe_document'
    | 'unsubscribe_document'
    | 'document_locked'
    | 'document_unlocked'
    | 'document_subscribers'
    | 'ping'
    | 'pong'
    | 'dashboard_update'
    | 'error';
  payload?: Record<string, unknown>;
}

export function useWebSocket(_token: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectDelay = 5000;
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const token = _token ?? localStorage.getItem('access_token');
  const isMock = token?.startsWith('mock_');

  const connect = useCallback(() => {
    if (!token || isMock) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        // Start heartbeat
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSMessage;
          // Игнорируем pong и error сообщения (они обрабатываются отдельно)
          if (data.type !== 'pong' && data.type !== 'error') {
            setLastMessage(data);
          }
        } catch {
          // ignore non-JSON
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        // Логируем важные коды закрытия
        if (event.code === 1008) {
          console.warn('WebSocket closed: Policy violation (invalid token)');
          // Очищаем токены при policy violation
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return;
        }
        // Exponential backoff reconnect
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, maxReconnectDelay);
        reconnectAttempts.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // fallback reconnect
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, maxReconnectDelay);
      reconnectAttempts.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    }
  }, [token]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const send = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return { isConnected, lastMessage, send };
}
