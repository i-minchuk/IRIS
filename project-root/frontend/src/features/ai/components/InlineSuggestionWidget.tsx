import React from 'react';
import { Sparkles, BookOpen, Edit3, Check, X, Loader2 } from 'lucide-react';
import type { InlineSuggestionItem } from '../types';

interface Props {
  suggestions: InlineSuggestionItem[];
  isLoading: boolean;
  onAccept: (suggestion: InlineSuggestionItem) => void;
  onReject: (suggestion: InlineSuggestionItem) => void;
  onDismiss: () => void;
}

const typeConfig = {
  completion: { icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  correction: { icon: Edit3, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  reference: { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
};

export const InlineSuggestionWidget: React.FC<Props> = ({
  suggestions,
  isLoading,
  onAccept,
  onReject,
  onDismiss,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] border border-[#334155] rounded-md shadow-lg">
        <Loader2 size={14} className="animate-spin text-[#94a3b8]" />
        <span className="text-xs text-[#94a3b8]">AI думает...</span>
      </div>
    );
  }

  if (!suggestions.length) return null;

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-xl overflow-hidden min-w-[280px] max-w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#334155]">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-[#8b5cf6]" />
          <span className="text-xs font-semibold text-[#8b5cf6]">AI Assistant</span>
        </div>
        <button
          onClick={onDismiss}
          className="p-0.5 rounded hover:bg-[#334155] text-[#64748b] hover:text-[#e2e8f0] transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      {/* Suggestions */}
      <div className="p-1.5 space-y-1">
        {suggestions.map((suggestion, index) => {
          const config = typeConfig[suggestion.type] || typeConfig.completion;
          const Icon = config.icon;

          return (
            <div
              key={index}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-md border ${config.bg} ${config.border} hover:bg-opacity-20 transition-all cursor-pointer`}
              onClick={() => onAccept(suggestion)}
              title={suggestion.description || suggestion.display}
            >
              <Icon size={14} className={config.color} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${config.color}`}>
                  {suggestion.display}
                </div>
                {suggestion.description && (
                  <div className="text-[10px] text-[#64748b] truncate">
                    {suggestion.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept(suggestion);
                  }}
                  className="p-1 rounded hover:bg-[#22c55e]/20 text-[#22c55e] transition-colors"
                  title="Принять (Tab)"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(suggestion);
                  }}
                  className="p-1 rounded hover:bg-[#ef4444]/20 text-[#ef4444] transition-colors"
                  title="Отклонить (Esc)"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-[#334155] flex justify-between text-[10px] text-[#475569]">
        <span>Tab — принять</span>
        <span>Esc — закрыть</span>
      </div>
    </div>
  );
};
