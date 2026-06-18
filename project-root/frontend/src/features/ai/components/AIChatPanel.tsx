import React, { useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, BookOpen, AlertTriangle, X } from 'lucide-react';
import { useAIChat } from '@/features/ai/hooks/useAIChat';

interface AIChatPanelProps {
  documentId?: string;
  projectId?: string;
  onClose?: () => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ documentId, projectId, onClose }) => {
  const { messages, loading, sendMessage, clear } = useAIChat();
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input, { documentId, projectId });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--accent-ai)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            AI-ассистент
          </span>
          {documentId && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>
              Контекст документа
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clear}
            className="p-1.5 rounded hover:opacity-80 transition-opacity text-xs"
            style={{ color: 'var(--text-muted)' }}
            title="Очистить историю"
          >
            Очистить
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles size={24} className="mx-auto mb-2" style={{ color: 'var(--accent-ai)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Задайте вопрос AI-ассистенту
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {documentId ? 'Ответы будут основаны на содержании документа' : 'Общий вопрос по проекту'}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[85%] rounded-lg px-3 py-2 text-sm"
              style={{
                backgroundColor: msg.role === 'user' ? 'var(--accent-engineering)' : 'var(--bg-surface-2)',
                color: msg.role === 'user' ? 'var(--text-inverse)' : 'var(--text-primary)',
              }}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
                  <div className="flex items-center gap-1 mb-1">
                    <BookOpen size={10} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Источники:</span>
                  </div>
                  {msg.sources.map((src, i) => (
                    <div key={i} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {src.file_name}
                      {src.section && ` → ${src.section}`}
                      {src.page && ` (стр. ${src.page})`}
                    </div>
                  ))}
                </div>
              )}

              {/* Confidence warning */}
              {msg.requiresHumanReview && (
                <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--warning, #f59e0b)' }}>
                  <AlertTriangle size={10} />
                  Низкая уверенность — требуется проверка
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent-ai)' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Введите вопрос..."
            className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-ai)', color: 'var(--text-inverse)' }}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};
