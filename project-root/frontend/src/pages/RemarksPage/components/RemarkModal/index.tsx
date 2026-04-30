import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RemarkCreateInput, RemarkPriority, RemarkCategory, RemarkSource, RemarkTag } from '@/types/remarks';

interface RemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RemarkCreateInput) => Promise<void>;
  tags: RemarkTag[];
}

export const RemarkModal: React.FC<RemarkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tags,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RemarkCreateInput>({
    source: 'manual',
    priority: 'medium',
    category: 'other',
    title: '',
    description: '',
    tag_ids: [],
  });

  const priorityOptions: { value: RemarkPriority; label: string }[] = [
    { value: 'critical', label: '🔴 Критический' },
    { value: 'high', label: '🟠 Высокий' },
    { value: 'medium', label: '🟡 Средний' },
    { value: 'low', label: '🟢 Низкий' },
  ];

  const categoryOptions: { value: RemarkCategory; label: string }[] = [
    { value: 'design_error', label: 'Ошибка проектирования' },
    { value: 'discrepancy', label: 'Несоответствие' },
    { value: 'incompleteness', label: 'Неполнота' },
    { value: 'norm_violation', label: 'Нарушение норм' },
    { value: 'customer_request', label: 'Запрос заказчика' },
    { value: 'other', label: 'Другое' },
  ];

  const sourceOptions: { value: RemarkSource; label: string }[] = [
    { value: 'internal', label: 'Внутреннее' },
    { value: 'customer', label: 'От заказчика' },
    { value: 'regulatory', label: 'Регуляторное' },
    { value: 'workflow', label: 'Из согласования' },
    { value: 'audit', label: 'Аудит' },
    { value: 'manual', label: 'Ручной ввод' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        source: 'manual',
        priority: 'medium',
        category: 'other',
        title: '',
        description: '',
        tag_ids: [],
      });
    } catch (error) {
      console.error('Failed to create remark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
          <h2 className="text-lg font-bold text-[#e2e8f0]">Новое замечание</h2>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#e2e8f0]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project */}
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1">
              Проект <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.project_id || ''}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-sm text-[#e2e8f0] focus:border-[#FF4D6D] focus:outline-none"
              required
            >
              <option value="">Выберите проект</option>
              <option value="1">Проект №1</option>
              <option value="2">Проект №2</option>
            </select>
          </div>

          {/* Document (optional) */}
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1">Документ</label>
            <select
              value={formData.document_id || ''}
              onChange={(e) => setFormData({ ...formData, document_id: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-sm text-[#e2e8f0] focus:border-[#FF4D6D] focus:outline-none"
            >
              <option value="">Не выбрано</option>
            </select>
          </div>

          {/* Source, Priority, Category */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">
                Источник <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as RemarkSource })}
                className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-sm text-[#e2e8f0] focus:border-[#FF4D6D] focus:outline-none"
              >
                {sourceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">
                Приоритет <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as RemarkPriority })}
                className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-sm text-[#e2e8f0] focus:border-[#FF4D6D] focus:outline-none"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">
                Категория <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as RemarkCategory })}
                className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-sm text-[#e2e8f0] focus:border-[#FF4D6D] focus:outline-none"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1">
              Название <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Краткое описание замечания"
              className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-sm text-[#e2e8f0] focus:border-[#FF4D6D] focus:outline-none"
              required
              maxLength={255}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1">
              Описание <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Подробное описание проблемы или требования"
              className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-sm text-[#e2e8f0] focus:border-[#FF4D6D] focus:outline-none min-h-[120px] resize-none"
              required
            />
          </div>

          {/* Location reference */}
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1">Местоположение в документе</label>
            <input
              type="text"
              value={formData.location_ref || ''}
              onChange={(e) => setFormData({ ...formData, location_ref: e.target.value })}
              placeholder="Раздел 3.2, лист 12"
              className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-sm text-[#e2e8f0] focus:border-[#FF4D6D] focus:outline-none"
            />
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="block text-xs text-[#94a3b8] mb-2">Теги</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      const current = formData.tag_ids || [];
                      const newTags = current.includes(tag.id)
                        ? current.filter(id => id !== tag.id)
                        : [...current, tag.id];
                      setFormData({ ...formData, tag_ids: newTags });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors`}
                    style={{
                      backgroundColor: formData.tag_ids?.includes(tag.id) ? tag.color : '#334155',
                      color: formData.tag_ids?.includes(tag.id) ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#334155]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#334155] text-[#e2e8f0] rounded text-sm hover:bg-[#475569] transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#FF4D6D] text-white rounded text-sm font-bold hover:bg-[#ff3355] transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Создание...' : 'Создать замечание'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
