import { useEffect, useRef, useState, useCallback } from 'react';

const WS_BASE_URL = (() => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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

export type WSStatus = 'connecting' | 'connected' | 'disconnected';

export function useWebSocket(token: string | null) {
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const shouldReconnect = useRef(true);

  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;
    if (!shouldReconnect.current) return;
    if (reconnectAttempts.current >= maxReconnectAttempts) return;

    setStatus('connecting');

    try {
      const url = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSMessage;
          if (data.type !== 'pong' && data.type !== 'error') {
            setLastMessage(data);
          }
        } catch {
          // ignore non-JSON
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        wsRef.current = null;

        if (!shouldReconnect.current) return;

        reconnectAttempts.current += 1;
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 5000);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setStatus('disconnected');
      if (shouldReconnect.current && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 5000);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    }
  }, [token]);

  const disconnect = useCallback(() => {
    shouldReconnect.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const send = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    shouldReconnect.current = true;
    reconnectAttempts.current = 0;
    if (token) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return { status, lastMessage, send };
}
