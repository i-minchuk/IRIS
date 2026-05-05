import React, { useRef, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useInlineAI, InlineSuggestionWidget, AIGhostText } from '@/features/ai';

interface Props {
  content?: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
  documentId?: string;
  documentType?: string;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}> = ({ onClick, active, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
      active ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
    }`}
  >
    {children}
  </button>
);

export const DocumentEditor: React.FC<Props> = ({
  content = '',
  onChange,
  readOnly = false,
  documentId,
  documentType,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    suggestions,
    isLoading,
    sendTextChange,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestions,
  } = useInlineAI({
    enabled: !readOnly,
    documentId,
    documentType,
    debounceMs: 500,
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Начните вводить текст документа...' }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Extract context from editor and send to AI
  const handleTextChange = useCallback(() => {
    if (!editor || readOnly) return;

    const text = editor.getText();
    const selection = editor.state.selection;
    const cursorPos = selection.from;

    // Get current line (paragraph)
    const doc = editor.state.doc;
    let currentLine = '';
    let precedingText = '';

    doc.nodesBetween(0, cursorPos, (node, pos) => {
      if (node.isText) {
        const textContent = node.text || '';
        const endPos = Math.min(cursorPos - pos, textContent.length);
        if (pos + endPos <= cursorPos) {
          precedingText += textContent.slice(0, endPos);
        }
      }
    });

    // Get current line text
    const lines = text.slice(0, cursorPos - 1).split('\n');
    currentLine = lines[lines.length - 1] || '';

    // Only send if there's meaningful text
    if (currentLine.trim().length >= 2) {
      sendTextChange({
        preceding_text: precedingText.slice(-500),
        current_line: currentLine,
        cursor_position: cursorPos,
      });
    } else {
      clearSuggestions();
    }
  }, [editor, readOnly, sendTextChange, clearSuggestions]);

  // Debounced text change handler
  useEffect(() => {
    if (!editor || readOnly) return;

    const handler = () => {
      // Small delay to let cursor settle
      setTimeout(handleTextChange, 50);
    };

    editor.on('update', handler);
    editor.on('selectionUpdate', handler);

    return () => {
      editor.off('update', handler);
      editor.off('selectionUpdate', handler);
    };
  }, [editor, readOnly, handleTextChange]);

  // Dismiss suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        clearSuggestions();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearSuggestions]);

  const handleAccept = useCallback(
    (suggestion: import('@/features/ai').InlineSuggestionItem) => {
      if (!editor) return;
      editor.chain().focus().insertContent(suggestion.text).run();
      acceptSuggestion(suggestion);
    },
    [editor, acceptSuggestion]
  );

  const handleReject = useCallback(
    (suggestion: import('@/features/ai').InlineSuggestionItem) => {
      rejectSuggestion(suggestion);
    },
    [rejectSuggestion]
  );

  const insertVariable = () => {
    const key = prompt('Введите имя переменной (например, material):');
    if (key) {
      editor?.chain().focus().insertContent(`<span class="variable-token" style="color:#2563eb;background:#dbeafe;padding:0 4px;border-radius:3px;font-family:monospace;font-size:0.9em;">{{${key}}}</span>`).run();
    }
  };

  if (!editor) return null;

  return (
    <div ref={editorRef} className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 flex flex-col h-full">
      {!readOnly && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-2 py-1.5 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-900 shrink-0">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Жирный">
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Курсив">
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Подчёркнутый">
            <u>U</u>
          </ToolbarButton>
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Заголовок 1">
            H1
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Заголовок 2">
            H2
          </ToolbarButton>
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Маркированный список">
            • Список
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Нумерованный список">
            1. Список
          </ToolbarButton>
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <ToolbarButton onClick={insertVariable} title="Вставить переменную">
            {'{{}}'} Переменная
          </ToolbarButton>
        </div>
      )}
      <div ref={contentRef} className="relative flex-1 overflow-auto p-4">
        <EditorContent editor={editor} className="prose prose-sm max-w-none focus:outline-none" />

        {/* Ghost text overlay */}
        <AIGhostText
          editorElement={contentRef.current}
          suggestions={suggestions}
          isLoading={isLoading}
          onAccept={handleAccept}
          onReject={handleReject}
          onDismiss={clearSuggestions}
        />
      </div>

      {/* Floating suggestion widget */}
      {(suggestions.length > 0 || isLoading) && (
        <div className="absolute bottom-4 right-4 z-50">
          <InlineSuggestionWidget
            suggestions={suggestions}
            isLoading={isLoading}
            onAccept={handleAccept}
            onReject={handleReject}
            onDismiss={clearSuggestions}
          />
        </div>
      )}
    </div>
  );
};
