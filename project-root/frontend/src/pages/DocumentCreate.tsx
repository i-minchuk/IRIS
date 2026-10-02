import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Check, Users, ChevronDown, FileCheck } from 'lucide-react';
import { createDocument, uploadDocumentFile } from '../features/documents/api/documents';
import { workflowApi } from '../features/workflow/api/workflowApi';
import { getProjects, type Project } from '../features/projects/api/projects';
import { getUsers } from '../features/users/api/users';
import { fetchStandards, type Standard } from './ReferencePage/standardsApi';
import { getProductionNodes } from './ProductionControl/api/strategyApi';
import type { BpmnNode } from './ProductionControl/components/ProductionStrategy/types';
import type { User } from '../types';
import { Button, Input, Select, Card } from '../components/ui';
import { toast } from 'sonner';

/** Соответствие категории и типа документа (тип выбирается на шаге «Категория») */
const CATEGORY_DOC_TYPE: Record<string, string> = {
  drawings: 'Чертеж',
  schemes: 'Схема',
  specs: 'Спецификация',
  tests: 'Протокол',
  certs: 'Сертификат',
  manuals: 'Руководство',
  registries: 'Реестр',
};

/** Категории документов на основе «Главного реестра документации Поставщика» (Excel) */
interface DocCategory {
  id: string;
  label: string;
  description: string;
  titles: string[];
}

const DOC_CATEGORIES: DocCategory[] = [
  {
    id: 'drawings',
    label: 'Чертежи',
    description: 'Компоновочные чертежи и паспортные таблички',
    titles: [
      'Общие компоновочные чертежи',
      'Чертежи паспортных табличек',
    ],
  },
  {
    id: 'schemes',
    label: 'Электрические схемы',
    description: 'Однолинейные и принципиальные схемы',
    titles: [
      'Однолинейные электрические схемы',
      'Принципиальные электрические схемы',
    ],
  },
  {
    id: 'specs',
    label: 'Спецификации',
    description: 'Материалы и оборудование',
    titles: [
      'Спецификация материалов и оборудования',
    ],
  },
  {
    id: 'tests',
    label: 'Испытания и протоколы',
    description: 'FAT, планы и процедуры проверок',
    titles: [
      'Протоколы заводских приемочных испытаний (FAT)',
      'Процедура заводских приемочных испытаний (FAT)',
      'План проверок и испытаний',
    ],
  },
  {
    id: 'certs',
    label: 'Паспорта и сертификаты',
    description: 'Технические паспорта, сертификаты ТР ТС',
    titles: [
      'Технический паспорт',
      'Сертификат ТР ТС или Декларация о соответствии',
      'Сертификат об утверждении типа средств измерений',
      'Сертификат/паспорт качества',
    ],
  },
  {
    id: 'manuals',
    label: 'Руководства и инструкции',
    description: 'Монтаж, пусконаладка, эксплуатация',
    titles: [
      'Инструкция по транспортировке и хранению',
      'Процедуры подготовки к пусконаладке / пусконаладочных работ',
      'Руководства по монтажу, пусконаладке, эксплуатации и техническому обслуживанию',
    ],
  },
  {
    id: 'registries',
    label: 'Реестры и перечни',
    description: 'Реестры оборудования, запчасти (SPIR)',
    titles: [
      'Перечни рекомендуемых запчастей для монтажных / пусконаладочных работ и ввода в эксплуатацию',
      'Реестры оборудования',
      'Реестры характеристик оборудования',
      'Ведомость запчастей и таблица взаимозаменяемости (SPIR)',
    ],
  },
];

export default function DocumentCreate() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [step, setStep] = useState<'category' | 'template' | 'details'>('category');
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(
    projectId ? Number(projectId) : 0
  );
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    discipline: '',
  });
  const [file, setFile] = useState<File | null>(null);

  // ── Задача производственного процесса ──
  const [productionNodes, setProductionNodes] = useState<BpmnNode[]>([]);
  const [selectedProcessTaskId, setSelectedProcessTaskId] = useState<string>('');

  // ── Исполнители (один ответственный или совместное редактирование) ──
  const [users, setUsers] = useState<User[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  // Нормативы
  const [standards, setStandards] = useState<Standard[]>([]);
  const [selectedStandardIds, setSelectedStandardIds] = useState<number[]>([]);
  const [standardsOpen, setStandardsOpen] = useState(false);
  const standardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProjects()
      .then((list: Project[]) => {
        setProjects(list);
        setSelectedProjectId((prev) =>
          prev > 0 ? prev : list.length > 0 ? list[0].id : 0
        );
      })
      .catch(() => {});
    getUsers()
      .then((list) => setUsers(list.filter((u) => u.is_active)))
      .catch(() => setUsers([]));
    fetchStandards()
      .then((list) => setStandards(list))
      .catch(() => setStandards([]));
    getProductionNodes()
      .then((list) => setProductionNodes(list.filter((n) => n.type === 'task')))
      .catch(() => setProductionNodes([]));
  }, []);

  // Закрытие списка исполнителей по клику вне
  useEffect(() => {
    if (!assigneeOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setAssigneeOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [assigneeOpen]);

  // Закрытие списка нормативов по клику вне
  useEffect(() => {
    if (!standardsOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (standardsRef.current && !standardsRef.current.contains(e.target as Node)) {
        setStandardsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [standardsOpen]);

  const toggleAssignee = (id: number) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleStandard = (id: number) => {
    setSelectedStandardIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleTemplateSelect = (title: string) => {
    setSelectedTitle(title);
    setFormData((prev) => ({
      ...prev,
      title,
    }));
    setErrors({});
    setStep('details');
  };

  /** Сброс ошибки поля при его изменении */
  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};

    if (!formData.code.trim()) {
      errs.code = 'Код обязателен';
    } else if (!/^[А-ЯA-Z0-9.\-]+$/.test(formData.code)) {
      errs.code = 'Только заглавные буквы, цифры, дефис и точка';
    }

    if (!formData.title.trim()) {
      errs.title = 'Название обязательно';
    } else if (formData.title.length > 100) {
      errs.title = 'Максимум 100 символов';
    }

    if (!formData.discipline) {
      errs.discipline = 'Дисциплина обязательна';
    }

    const pid = selectedProjectId;
    if (!pid || pid <= 0) {
      errs.project_id = 'Проект не выбран';
    }

    return errs;
  };

  const handleCreate = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const pid = selectedProjectId;
      const docType = selectedCategory
        ? CATEGORY_DOC_TYPE[selectedCategory.id] ?? selectedCategory.label
        : 'Документ';
      const doc = await createDocument({
        project_id: pid,
        number: formData.code,
        name: formData.title,
        doc_type: docType,
        assignee_ids: assigneeIds,
        standard_ids: selectedStandardIds,
        process_task_id: selectedProcessTaskId || undefined,
        discipline: formData.discipline || undefined,
      });
      if (file) {
        try {
          await uploadDocumentFile(doc.id, file);
        } catch (uploadErr) {
          console.error('Ошибка загрузки файла:', uploadErr);
          toast.warning('Документ создан, но файл не загрузился — прикрепите его на странице документа');
        }
      }
      // Автозапуск согласования по сценарию маршрутизации
      try {
        const match = await workflowApi.matchRoutingRule({
          project_id: pid,
          doc_type: docType,
          discipline: formData.discipline || undefined,
        });
        if (match.matched && match.template_id) {
          await workflowApi.startWorkflow({
            template_id: match.template_id,
            document_id: doc.id,
            document_name: formData.title,
            project_id: pid,
          });
          toast.success(`Маршрут «${match.template_name}» запущен автоматически по сценарию «${match.rule?.name}»`);
        }
      } catch (matchErr) {
        console.error('Автозапуск маршрута не удался:', matchErr);
      }
      toast.success('Документ успешно создан');
      navigate(doc.id ? `/documents/${doc.id}` : '/documents');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка при создании документа');
      console.error('Ошибка создания:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="w-full pt-2 pb-6 px-4">
      <form data-hotkey-submit="true" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => navigate(projectId ? `/projects/${projectId}` : '/documents')}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>
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
            {DOC_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat);
                  setStep('template');
                }}
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
                      {cat.description} · {cat.titles.length} {cat.titles.length === 1 ? 'позиция' : cat.titles.length < 5 ? 'позиции' : 'позиций'}
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
              {selectedCategory ? `${selectedCategory.label}: выберите вид документа` : 'Выберите вид документа'}
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
            {(selectedCategory?.titles ?? []).map((title) => (
              <button
                key={title}
                onClick={() => handleTemplateSelect(title)}
                className="w-full text-left p-4 rounded-lg border transition-all hover:border-blue-400 hover:bg-blue-50"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                      {title}
                    </div>
                    {selectedCategory && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800" style={{ color: 'var(--text-tertiary)' }}>
                        {selectedCategory.label}
                      </span>
                    )}
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

          {selectedTitle && (
            <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-1">Вид документа из реестра:</div>
              <div className="text-sm text-blue-800">{selectedTitle}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Input
                label="Код документа"
                placeholder="Например: НПЗ-КМ-001"
                value={formData.code}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value });
                  clearError('code');
                }}
                helpText="Уникальный идентификатор"
              />
              {errors.code && <span className="text-red-500 text-sm">{errors.code}</span>}
            </div>

            <div>
              <Input
                label="Название"
                placeholder="Краткое описание содержимого"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  clearError('title');
                }}
              />
              {errors.title && <span className="text-red-500 text-sm">{errors.title}</span>}
            </div>

            <div>
              <Select
                label="Проект"
                placeholder="— выберите проект —"
                options={projects.map((p) => ({ value: String(p.id), label: p.name }))}
                value={selectedProjectId ? String(selectedProjectId) : ''}
                onChange={(e) => {
                  setSelectedProjectId(Number(e.target.value));
                  clearError('project_id');
                }}
              />
              {errors.project_id && <span className="text-red-500 text-sm">{errors.project_id}</span>}
            </div>

            <div>
              <Select
                label="Задача процесса"
                placeholder="— выберите задачу производства —"
                options={productionNodes.map((n) => ({ value: n.id, label: n.label }))}
                value={selectedProcessTaskId}
                onChange={(e) => setSelectedProcessTaskId(e.target.value)}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Привязка документа к конкретной задаче производственного процесса
              </p>
            </div>

            <div>
              <Select
                label="Дисциплина"
                placeholder="— выберите —"
                options={[
                  { value: '08', label: '08' },
                  { value: '11', label: '11' },
                  { value: '37', label: '37' },
                  { value: '65', label: '65' },
                  { value: '70', label: '70' },
                  { value: '94', label: '94' },
                  { value: '96', label: '96' },
                ]}
                value={formData.discipline}
                onChange={(e) => {
                  setFormData({ ...formData, discipline: e.target.value });
                  clearError('discipline');
                }}
              />
              {errors.discipline && <span className="text-red-500 text-sm">{errors.discipline}</span>}
            </div>

            {/* Исполнители: поручение одному или совместное редактирование */}
            <div ref={assigneeRef}>
              <label className="mb-1 block text-sm font-medium" style={{ color: 'inherit' }}>
                Исполнитель(и) <span style={{ color: 'var(--text-tertiary)' }}>(необязательно)</span>
              </label>
              <button
                type="button"
                onClick={() => setAssigneeOpen((v) => !v)}
                className="flex items-center gap-2 w-full rounded-md border px-3 py-2 text-sm text-left transition-colors"
                style={{
                  borderColor: 'var(--border-default, #e2e8f0)',
                  backgroundColor: 'var(--bg-surface-2, #f8fafc)',
                  color: assigneeIds.length > 0 ? 'var(--text-primary)' : 'var(--text-tertiary, #94a3b8)',
                }}
              >
                <Users size={14} style={{ color: 'var(--accent-engineering)' }} />
                <span className="flex-1 truncate">
                  {assigneeIds.length === 0
                    ? '— выберите сотрудников —'
                    : assigneeIds
                        .map((id) => users.find((u) => u.id === id)?.full_name || `#${id}`)
                        .join(', ')}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
              </button>
              {assigneeOpen && (
                <div
                  className="mt-1 rounded-md border max-h-52 overflow-y-auto"
                  style={{
                    borderColor: 'var(--border-default, #e2e8f0)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    boxShadow: 'var(--shadow-lg, 0 4px 16px rgba(0,0,0,0.12))',
                  }}
                >
                  {users.length === 0 && (
                    <div className="px-3 py-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Нет доступных сотрудников
                    </div>
                  )}
                  {users.map((u) => {
                    const checked = assigneeIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleAssignee(u.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                        style={{
                          background: checked ? 'var(--bg-surface-2)' : 'transparent',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span
                          className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                          style={{
                            borderColor: checked ? 'var(--accent-engineering)' : 'var(--border-default)',
                            background: checked ? 'var(--accent-engineering)' : 'transparent',
                          }}
                        >
                          {checked && <Check size={10} style={{ color: '#fff' }} />}
                        </span>
                        <span className="flex-1 truncate">{u.full_name || u.username}</span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                          {u.role === 'admin' ? 'Администратор' : u.role === 'manager' ? 'Менеджер' : u.role === 'norm_controller' ? 'Нормоконтролер' : 'Инженер'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Можно выбрать одного ответственного или нескольких для совместного редактирования
              </p>
            </div>

            {/* Нормативы */}
            <div ref={standardsRef}>
              <label className="mb-1 block text-sm font-medium" style={{ color: 'inherit' }}>
                Применяемые нормативы <span style={{ color: 'var(--text-tertiary)' }}>(необязательно)</span>
              </label>
              <button
                type="button"
                onClick={() => setStandardsOpen((v) => !v)}
                className="flex items-center gap-2 w-full rounded-md border px-3 py-2 text-sm text-left transition-colors"
                style={{
                  borderColor: 'var(--border-default, #e2e8f0)',
                  backgroundColor: 'var(--bg-surface-2, #f8fafc)',
                  color: selectedStandardIds.length > 0 ? 'var(--text-primary)' : 'var(--text-tertiary, #94a3b8)',
                }}
              >
                <FileCheck size={14} style={{ color: 'var(--accent-engineering)' }} />
                <span className="flex-1 truncate">
                  {selectedStandardIds.length === 0
                    ? '— выберите нормативы —'
                    : selectedStandardIds
                        .map((id) => standards.find((s) => s.id === id)?.name || `#${id}`)
                        .join(', ')}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
              </button>
              {standardsOpen && (
                <div
                  className="mt-1 rounded-md border max-h-52 overflow-y-auto"
                  style={{
                    borderColor: 'var(--border-default, #e2e8f0)',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    boxShadow: 'var(--shadow-lg, 0 4px 16px rgba(0,0,0,0.12))',
                  }}
                >
                  {standards.length === 0 && (
                    <div className="px-3 py-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Нет загруженных нормативов. Добавьте их в разделе «Справочники → Нормативы».
                    </div>
                  )}
                  {standards.map((s) => {
                    const checked = selectedStandardIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStandard(s.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                        style={{
                          background: checked ? 'var(--bg-surface-2)' : 'transparent',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span
                          className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                          style={{
                            borderColor: checked ? 'var(--accent-engineering)' : 'var(--border-default)',
                            background: checked ? 'var(--accent-engineering)' : 'transparent',
                          }}
                        >
                          {checked && <Check size={10} style={{ color: '#fff' }} />}
                        </span>
                        <span className="flex-1 truncate">{s.name}</span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                          {s.code || `${s.requirements.length} треб.`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Требования выбранных нормативов отобразятся во вкладке «Требования» карточки документа
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: 'inherit' }}>
                Файл документа <span style={{ color: 'var(--text-tertiary)' }}>(необязательно)</span>
              </label>
              <input
                id="doc-file"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.png,.jpg,.jpeg,.zip"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor="doc-file"
                className="flex items-center gap-3 w-full rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--border-default, #e2e8f0)',
                  backgroundColor: 'var(--bg-surface-2, #f8fafc)',
                }}
              >
                <FileText size={16} style={{ color: 'var(--accent-engineering)' }} />
                <span
                  className="truncate"
                  style={{ color: file ? 'var(--text-primary)' : 'var(--text-tertiary, #94a3b8)' }}
                >
                  {file ? file.name : 'Выберите файл или шаблон…'}
                </span>
                {file && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="ml-auto text-xs hover:underline shrink-0"
                    style={{ color: 'var(--error, #dc2626)' }}
                  >
                    Убрать
                  </button>
                )}
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={() => setStep('template')}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={loading}
              disabled={hasErrors}
            >
              Создать документ
            </Button>
          </div>
        </Card>
      )}
      </form>
    </div>
  );
}
