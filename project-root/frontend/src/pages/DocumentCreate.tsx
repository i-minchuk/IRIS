import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Check } from 'lucide-react';
import { createDocument } from '../api/documents';
import { Button, Input, Select, Card } from '../components/ui';

interface Template {
  id: string;
  name: string;
  description: string;
  docType: string;
  discipline: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'tmpl-km1',
    name: 'КМ1 — Общий вид конструкций',
    description: 'Базовый шаблон для металлических конструкций',
    docType: 'Чертеж',
    discipline: 'КМ',
  },
  {
    id: 'tmpl-km2',
    name: 'КМ2 — Узлы сопряжения',
    description: 'Шаблон для детальных узлов',
    docType: 'Чертеж',
    discipline: 'КМ',
  },
  {
    id: 'tmpl-es',
    name: 'ЭС — Схема электроснабжения',
    description: 'Шаблон электрических схем',
    docType: 'Схема',
    discipline: 'ЭС',
  },
  {
    id: 'tmpl-tx',
    name: 'ТХ — Технологические решения',
    description: 'Шаблон для технологической документации',
    docType: 'Пояснительная записка',
    discipline: 'ТХ',
  },
];

export default function DocumentCreate() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [step, setStep] = useState<'category' | 'template' | 'details'>('category');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    doc_type: '',
    discipline: '',
  });

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      doc_type: template.docType,
      discipline: template.discipline,
    }));
    setStep('details');
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.title || !formData.doc_type || !formData.discipline) {
      return;
    }

    setLoading(true);
    try {
      const doc = await createDocument({
        project_id: projectId ? Number(projectId) : 1, // TODO: get from context
        ...formData,
      });
      // Переход на DocumentWorkspace вместо старого DocumentDetail
      navigate(`/documents/workspace/${doc.project_id || 1}`);
    } catch (err) {
      console.error('Ошибка создания:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => navigate(projectId ? `/projects/${projectId}` : '/documents')}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Создать документ
        </h1>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['Категория', 'Шаблон', 'Детали'].map((label, idx) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                idx <= (step === 'category' ? 0 : step === 'template' ? 1 : 2)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {idx <= (step === 'category' ? 0 : step === 'template' ? 1 : 2) ? (
                idx + 1
              ) : (
                <span className="text-xs">·</span>
              )}
            </div>
            <span
              className="text-sm"
              style={{ color: idx <= (step === 'category' ? 0 : step === 'template' ? 1 : 2) ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
            >
              {label}
            </span>
            {idx < 2 && (
              <div className="w-8 h-px bg-gray-300" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Category */}
      {step === 'category' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Выберите категорию документа
          </h2>
          <div className="space-y-2">
            {[
              { id: 'drawing', label: 'Чертеж', description: 'Технический чертеж или схема' },
              { id: 'spec', label: 'Спецификация', description: 'Список оборудования и материалов' },
              { id: 'calc', label: 'Расчет', description: 'Инженерный расчет' },
              { id: 'note', label: 'Пояснительная записка', description: 'Текстовый документ' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setStep('template')}
                className="w-full text-left p-4 rounded-lg border transition-all hover:border-blue-400 hover:bg-blue-50"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} style={{ color: 'var(--accent-engineering)' }} />
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {cat.label}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {cat.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Step 2: Template Selection */}
      {step === 'template' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Выберите шаблон
            </h2>
            <button
              onClick={() => setStep('category')}
              className="text-sm text-blue-600 hover:underline"
            >
              Назад
            </button>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Шаблон определяет базовую структуру и метаданные документа
          </p>
          <div className="space-y-2">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleTemplateSelect(tmpl)}
                className="w-full text-left p-4 rounded-lg border transition-all hover:border-blue-400 hover:bg-blue-50"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                      {tmpl.name}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {tmpl.description}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800" style={{ color: 'var(--text-tertiary)' }}>
                        {tmpl.docType}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800" style={{ color: 'var(--text-tertiary)' }}>
                        {tmpl.discipline}
                      </span>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--border-default)' }}>
                    <Check size={12} style={{ color: 'var(--accent-engineering)', opacity: 0 }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep('details')}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Пропустить выбор шаблона
          </button>
        </Card>
      )}

      {/* Step 3: Details */}
      {step === 'details' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Детали документа
            </h2>
            <button
              onClick={() => setStep('template')}
              className="text-sm text-blue-600 hover:underline"
            >
              Назад
            </button>
          </div>

          {selectedTemplate && (
            <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-1">Используется шаблон:</div>
              <div className="text-sm text-blue-800">{selectedTemplate.name}</div>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Код документа"
              placeholder="Например: НПЗ-КМ-001"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              helpText="Уникальный идентификатор"
            />

            <Input
              label="Название"
              placeholder="Краткое описание содержимого"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Дисциплина"
                options={[
                  { value: 'КМ', label: 'Конструкции металлические' },
                  { value: 'КЖ', label: 'Конструкции железобетонные' },
                  { value: 'ЭС', label: 'Электроснабжение' },
                  { value: 'ТМ', label: 'Тепломеханика' },
                  { value: 'АР', label: 'Архитектурные решения' },
                  { value: 'ТХ', label: 'Технологические решения' },
                ]}
                value={formData.discipline}
                onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
              />

              <Select
                label="Тип документа"
                options={[
                  { value: 'Чертеж', label: 'Чертеж' },
                  { value: 'Схема', label: 'Схема' },
                  { value: 'Спецификация', label: 'Спецификация' },
                  { value: 'Расчет', label: 'Расчет' },
                  { value: 'Пояснительная записка', label: 'Пояснительная записка' },
                ]}
                value={formData.doc_type}
                onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={() => setStep('template')}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleCreate} isLoading={loading}>
              Создать документ
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
