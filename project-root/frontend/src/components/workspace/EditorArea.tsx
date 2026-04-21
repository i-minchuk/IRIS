import { useWorkspaceStore } from './store/workspaceStore';
import { FileText, Upload, X, Plus } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import DocumentViewerHost from '../viewers/DocumentViewerHost';

export default function EditorArea() {
  const { openTabs, activeTabId, addTab } = useWorkspaceStore();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTab = openTabs.find((tab) => tab.id === activeTabId);

  // Обработчик drag-and-drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Обработчик drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
    }
  }, []);

  // Обработчик выбора файла через input
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
    }
  }, []);

  // Клик по кнопке открывает file picker
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Удаление файла
  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Создание документа из загруженного файла
  const handleCreateDocument = () => {
    if (uploadedFile) {
      addTab({
        id: `doc-${Date.now()}`,
        type: 'document',
        title: uploadedFile.name.replace(/\.[^/.]+$/, ''),
        subtitle: uploadedFile.name,
        icon: <FileText size={14} />,
        isDirty: true,
        file: uploadedFile, // Сохраняем файл в tab
      });
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!activeTab) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-app)' }}
      >
        <div className="text-center max-w-md px-6">
          <div
            className="mx-auto w-14 h-14 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--bg-surface-2)' }}
          >
            <FileText size={28} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3
            className="text-base font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Выберите документ из Explorer
          </h3>
          <p
            className="text-sm mb-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            Или создайте новый документ, загрузив файл в зону ниже
          </p>

          {/* Зона загрузки файла - по центру */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              dragActive ? 'border-[var(--primary)] bg-[var(--bg-hover)]' : 'border-[var(--border-default)]'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              backgroundColor: uploadedFile ? 'var(--bg-surface-2)' : 'transparent',
            }}
          >
            {uploadedFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--accent-engineering)' }}
                    >
                      <Upload size={20} style={{ color: 'var(--text-inverse)' }} />
                    </div>
                    <div className="text-left">
                      <div
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {uploadedFile.name}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    title="Удалить файл"
                  >
                    <X size={16} />
                  </button>
                </div>
                <button
                  onClick={handleCreateDocument}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--accent-engineering)',
                    color: 'var(--text-inverse)',
                  }}
                >
                  <Plus size={16} />
                  Создать документ
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload
                  size={32}
                  className="mx-auto"
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Перетащите файл сюда
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    или нажмите кнопку ниже
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={handleButtonClick}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--accent-engineering)',
                    color: 'var(--text-inverse)',
                  }}
                >
                  <Upload size={16} />
                  Выбрать файл
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      {/* Document Viewer Host - рендерит соответствующий viewer */}
      <DocumentViewerHost />
    </div>
  );
}
