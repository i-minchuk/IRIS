import React, { useEffect, useRef, useState } from 'react';
import type { InlineSuggestionItem } from '../types';

interface Props {
  editorElement: HTMLElement | null;
  suggestions: InlineSuggestionItem[];
  isLoading: boolean;
  onAccept: (suggestion: InlineSuggestionItem) => void;
  onReject: (suggestion: InlineSuggestionItem) => void;
  onDismiss: () => void;
}

/**
 * Компонент "ghost text" — отображает AI-подсказку прямо в тексте
 * как полупрозрачный текст после курсора (как в VS Code Copilot)
 */
export const AIGhostText: React.FC<Props> = ({
  editorElement,
  suggestions,
  isLoading,
  onAccept,
  onDismiss,
}) => {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const activeSuggestion = suggestions[0];

  useEffect(() => {
    if (!editorElement || !activeSuggestion) {
      setPosition(null);
      return;
    }

    // Находим позицию курсора в редакторе
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setPosition(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();

    setPosition({
      left: rect.left - editorRect.left + editorElement.scrollLeft,
      top: rect.top - editorRect.top + editorElement.scrollTop,
    });
  }, [editorElement, activeSuggestion, isLoading]);

  // Keyboard handlers
  useEffect(() => {
    if (!activeSuggestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        onAccept(activeSuggestion);
      } else if (e.key === 'Escape') {
        onDismiss();
      }
    };

    editorElement?.addEventListener('keydown', handleKeyDown, true);
    return () => editorElement?.removeEventListener('keydown', handleKeyDown, true);
  }, [activeSuggestion, editorElement, onAccept, onDismiss]);

  if (!position || !activeSuggestion || isLoading) return null;

  return (
    <div
      ref={ghostRef}
      className="pointer-events-none absolute z-10 whitespace-pre"
      style={{
        left: position.left,
        top: position.top,
        color: 'rgba(139, 92, 246, 0.5)', // iris-500 at 50% opacity
        fontFamily: 'inherit',
        fontSize: 'inherit',
        lineHeight: 'inherit',
      }}
    >
      {activeSuggestion.text}
    </div>
  );
};
