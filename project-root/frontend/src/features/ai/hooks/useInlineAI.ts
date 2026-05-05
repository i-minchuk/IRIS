import { useEffect, useRef, useState, useCallback } from 'react';
import type { InlineSuggestionItem, InlineSuggestionsMessage } from '../types';

const WS_BASE_URL = (() => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
  return baseUrl.replace(/^http/, 'ws');
})();

interface UseInlineAIOptions {
  enabled?: boolean;
  documentId?: string;
  documentType?: string;
  debounceMs?: number;
}

export function useInlineAI(options: UseInlineAIOptions = {}) {
  const { enabled = true, documentId, documentType, debounceMs = 400 } = options;
  const [suggestions, setSuggestions] = useState<InlineSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientIdRef = useRef(`client_${Math.random().toString(36).slice(2, 11)}`);

  const connect = useCallback(() => {
    if (!enabled) return;
    const token = localStorage.getItem('access_token');
    if (!token || token.startsWith('mock_')) return;

    const url = `${WS_BASE_URL}/ws/ai/inline/${clientIdRef.current}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as InlineSuggestionsMessage;
        if (data.type === 'suggestions' && Array.isArray(data.items)) {
          setSuggestions(data.items);
          setIsLoading(false);
        }
      } catch {
        // ignore non-JSON
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [enabled]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setSuggestions([]);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }
    return () => disconnect();
  }, [enabled, connect, disconnect]);

  const sendTextChange = useCallback(
    (context: {
      preceding_text: string;
      current_line: string;
      cursor_position: number;
      current_section?: string;
    }) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setIsLoading(false);
        return;
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      setIsLoading(true);
      debounceRef.current = setTimeout(() => {
        wsRef.current?.send(
          JSON.stringify({
            type: 'text_change',
            context: {
              ...context,
              document_id: documentId,
              document_type: documentType,
            },
          })
        );
      }, debounceMs);
    },
    [documentId, documentType, debounceMs]
  );

  const acceptSuggestion = useCallback(
    (suggestion: InlineSuggestionItem, requestId?: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(
        JSON.stringify({
          type: 'accept_suggestion',
          suggestion_id: suggestion.text,
          request_id: requestId || '',
        })
      );
      setSuggestions([]);
    },
    []
  );

  const rejectSuggestion = useCallback(
    (suggestion: InlineSuggestionItem, requestId?: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(
        JSON.stringify({
          type: 'reject_suggestion',
          suggestion_id: suggestion.text,
          request_id: requestId || '',
        })
      );
      setSuggestions((prev) => prev.filter((s) => s.text !== suggestion.text));
    },
    []
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setIsLoading(false);
  }, []);

  return {
    suggestions,
    isLoading,
    isConnected,
    sendTextChange,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestions,
  };
}
