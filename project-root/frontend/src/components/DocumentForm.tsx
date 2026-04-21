import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Select } from './ui';
import { getProjects } from '../api/projects';
import type { Project } from '../types';

interface DocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DocumentFormData) => Promise<void>;
  projectId?: number;
}

interface DocumentFormData {
  project_id: number;
  code: string;
  title: string;
  doc_type: string;
  discipline: string;
}

const DISCIPLINE_OPTIONS = [
  { value: '', label: 'Выберите дисциплину' },
  { value: 'КМ', label: 'Конструкции металлические' },
  { value: 'КЖ', label: 'Конструкции железобетонные' },
  { value: 'ЭС', label: 'Электроснабжение' },
  { value: 'ТМ', label: 'Тепломеханика' },
  { value: 'АР', label: 'Архитектурные решения' },
  { value: 'ПС', label: 'Проект силовых сетей' },
  { value: 'ОВ', label: 'Отопление и вентиляция' },
  { value: 'ТХ', label: 'Технологические решения' },
  { value: 'ВК', label: 'Водоснабжение и канализация' },
  { value: 'Н', label: 'Нормативная документация' },
];

const DOC_TYPE_OPTIONS = [
  { value: '', label: 'Выберите тип документа' },
  { value: 'Чертеж', label: 'Чертеж' },
  { value: 'Схема', label: 'Схема' },
  { value: 'Спецификация', label: 'Спецификация' },
  { value: 'Ведомость', label: 'Ведомость' },
  { value: 'Расчет', label: 'Расчет' },
  { value: 'Пояснительная записка', label: 'Пояснительная записка' },
];

export default function DocumentForm({
  isOpen,
  onClose,
  onSubmit,
  projectId,
}: DocumentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState<DocumentFormData>({
    project_id: projectId || 0,
    code: '',
    title: '',
    doc_type: '',
    discipline: '',
  });

  useEffect(() => {
    if (isOpen && !projectId) {
      getProjects()
        .then(setProjects)
        .catch(() => {
          setError('Не удалось загрузить список проектов');
        });
    }
  }, [isOpen, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания документа');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: projectId || 0,
      code: '',
      title: '',
      doc_type: '',
      discipline: '',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Создать документ"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
            Создать документ
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

        {!projectId && (
          <Select
            label="Проект"
            options={[
              { value: '', label: 'Выберите проект' },
              ...projects.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })),
            ]}
            value={String(formData.project_id)}
            onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) })}
            required
          />
        )}

        <Input
          label="Код документа"
          placeholder="Например: НПЗ-КМ-001"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
          helpText="Уникальный идентификатор документа в системе"
        />

        <Input
          label="Название документа"
          placeholder="Краткое описание содержимого"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Дисциплина"
            options={DISCIPLINE_OPTIONS}
            value={formData.discipline}
            onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
            required
          />

          <Select
            label="Тип документа"
            options={DOC_TYPE_OPTIONS}
            value={formData.doc_type}
            onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
            required
          />
        </div>

        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
          <p className="font-medium mb-1">Примечание:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Код документа должен быть уникальным</li>
            <li>После создания можно добавить ревизии</li>
            <li>Статус документа: Черновик</li>
          </ul>
        </div>
      </form>
    </Modal>
  );
}
