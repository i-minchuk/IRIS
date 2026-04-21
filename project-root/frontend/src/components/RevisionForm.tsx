import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button, Input, Modal, Select } from './ui';

interface RevisionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RevisionFormData) => Promise<void>;
  documentId: number;
  nextRevisionIndex: string;
}

interface RevisionFormData {
  revision_index: string;
  revision_letter: string;
  revision_number: number;
  version_number: number;
  change_log: string;
  file?: File;
}

const REVISION_LETTERS = [
  { value: 'A', label: 'A - Первая' },
  { value: 'B', label: 'B - Вторая' },
  { value: 'C', label: 'C - Третья' },
  { value: 'D', label: 'D - Четвертая' },
  { value: 'E', label: 'E - Пятая' },
];

export default function RevisionForm({
  isOpen,
  onClose,
  onSubmit,
  //documentId,
  nextRevisionIndex,
}: RevisionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RevisionFormData>({
    revision_index: nextRevisionIndex,
    revision_letter: 'A',
    revision_number: 1,
    version_number: 1,
    change_log: '',
    file: undefined,
  });
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания ревизии');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      revision_index: nextRevisionIndex,
      revision_letter: 'A',
      revision_number: 1,
      version_number: 1,
      change_log: '',
      file: undefined,
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData({ ...formData, file: e.dataTransfer.files[0] });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Создать ревизию"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            Создать ревизию
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Индекс ревизии"
            placeholder="Например: A.1"
            value={formData.revision_index}
            onChange={(e) => setFormData({ ...formData, revision_index: e.target.value })}
            required
          />

          <Select
            label="Буква ревизии"
            options={REVISION_LETTERS}
            value={formData.revision_letter}
            onChange={(e) => setFormData({ ...formData, revision_letter: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Номер ревизии"
            value={formData.revision_number}
            onChange={(e) => setFormData({ ...formData, revision_number: Number(e.target.value) })}
            min={1}
            required
          />

          <Input
            type="number"
            label="Номер версии"
            value={formData.version_number}
            onChange={(e) => setFormData({ ...formData, version_number: Number(e.target.value) })}
            min={1}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание изменений
          </label>
          <textarea
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 min-h-[100px]"
            placeholder="Опишите изменения в этой ревизии..."
            value={formData.change_log}
            onChange={(e) => setFormData({ ...formData, change_log: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Файл ревизии (опционально)
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : formData.file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {formData.file ? (
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Upload size={20} />
                <span className="font-medium">{formData.file.name}</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, file: undefined })}
                  className="ml-2 p-1 hover:bg-green-100 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Перетащите файл сюда или нажмите для выбора
                </p>
                <p className="text-xs text-gray-400">
                  Поддерживаются: PDF, DWG, DOCX (до 50MB)
                </p>
                <input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.dwg,.docx,.xlsx"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer text-sm"
                >
                  Выбрать файл
                </label>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
          <p className="font-medium mb-1">Примечание:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ревизия будет создана в статусе "Черновик"</li>
            <li>После создания можно загрузить файлы</li>
            <li>Для утверждения потребуется проверка</li>
          </ul>
        </div>
      </form>
    </Modal>
  );
}
