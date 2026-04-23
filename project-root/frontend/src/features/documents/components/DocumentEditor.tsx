import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';

interface Props {
  content?: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
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
      active ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
    }`}
  >
    {children}
  </button>
);

export const DocumentEditor: React.FC<Props> = ({ content = '', onChange, readOnly = false }) => {
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

  if (!editor) return null;

  const insertVariable = () => {
    const key = prompt('Введите имя переменной (например, material):');
    if (key) {
      editor.chain().focus().insertContent(`<span class="variable-token" style="color:#2563eb;background:#dbeafe;padding:0 4px;border-radius:3px;font-family:monospace;font-size:0.9em;">{{${key}}}</span>`).run();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col h-full">
      {!readOnly && (
        <div className="border-b border-gray-200 px-2 py-1.5 flex flex-wrap gap-1 bg-gray-50 shrink-0">
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
      <div className="flex-1 overflow-auto p-4">
        <EditorContent editor={editor} className="prose prose-sm max-w-none focus:outline-none" />
      </div>
    </div>
  );
};
