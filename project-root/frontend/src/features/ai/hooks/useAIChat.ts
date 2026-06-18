import { useState, useCallback, useRef } from 'react';
import { chatWithAI, type ChatRequest, type ChatResponse } from '@/features/ai/api/aiApi';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    document_id: string;
    file_name: string;
    section?: string;
    page?: number;
    relevance_score: number;
  }>;
  confidence?: number;
  requiresHumanReview?: boolean;
  timestamp: Date;
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

  const sendMessage = useCallback(async (
    content: string,
    options?: { documentId?: string; projectId?: string }
  ) => {
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const request: ChatRequest = {
        message: content,
        session_id: sessionIdRef.current,
        document_id: options?.documentId,
        project_id: options?.projectId,
        stream: false,
      };
      const response: ChatResponse = await chatWithAI(request);

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        sources: response.sources,
        confidence: response.confidence,
        requiresHumanReview: response.requires_human_review,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка AI-чата');
      const errorMsg: ChatMessage = {
        id: `e_${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Не удалось получить ответ от AI. Попробуйте позже.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  return { messages, loading, sendMessage, clear };
}
