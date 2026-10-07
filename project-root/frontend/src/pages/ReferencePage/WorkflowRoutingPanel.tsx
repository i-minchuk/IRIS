import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  GitBranch, Plus, Trash2, Loader2, AlertTriangle, ChevronDown, ChevronUp, Pencil, X,
} from 'lucide-react';
import {
  workflowApi,
  type RoutingRule,
  type WorkflowTemplate,
  type WorkflowStepSchema,
} from '@/features/workflow/api/workflowApi';
import { getProjects } from '@/features/projects/api/projects';
import type { Project } from '@/features/projects/api/projects';
import { useCan } from '@/shared/hooks/useCan';

const DISCIPLINES = ['08', '11', '37', '65', '70', '94', '96'];

const APPROVAL_TYPES: { value: string; label: string }[] = [
  { value: 'approve', label: 'Утверждение' },
  { value: 'approve_with_comments', label: 'Согласование с замечаниями' },
  { value: 'view_only', label: 'Просмотр' },
];

const ASSIGNMENT_TYPES: { value: string; label: string }[] = [
  { value: 'sequential', label: 'Последовательно' },
  { value: 'parallel', label: 'Параллельно (все)' },
  { value: 'any_of', label: 'Любой из группы' },
];

const inputStyle = {
  borderColor: 'var(--border-default)',
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
} as const;

// ==================== Сценарии маршрутизации ====================

function RoutingRulesSection() {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [docType, setDocType] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [templateId, setTemplateId] = useState<number | ''>('');
  const [priority, setPriority] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const canWrite = useCan('references.write');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t, p] = await Promise.all([
        workflowApi.getRoutingRules(),
        workflowApi.getTemplates(),
        getProjects(),
      ]);
      setRules(r);
      setTemplates(t);
      setProjects(p);
    } catch {
      toast.error('Не удалось загрузить сценарии маршрутизации');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setProjectId('');
    setDocType('');
    setDiscipline('');
    setTemplateId('');
    setPriority(0);
  };

  const addRule = async () => {
    if (!name.trim() || !templateId) {
      toast.error('Укажите название сценария и маршрут');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        project_id: projectId === '' ? null : Number(projectId),
        doc_type: docType.trim() || null,
        discipline: discipline || null,
        template_id: Number(templateId),
        priority,
      };
      if (editingId !== null) {
        await workflowApi.updateRoutingRule(editingId, payload);
        toast.success('Сценарий обновлён');
      } else {
        await workflowApi.createRoutingRule({ ...payload, is_active: true });
        toast.success('Сценарий добавлен');
      }
      resetForm();
      await load();
    } catch {
      /* toast об ошибке показал интерцептор */
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (rule: RoutingRule) => {
    setEditingId(rule.id);
    setName(rule.name);
    setProjectId(rule.project_id ?? '');
    setDocType(rule.doc_type ?? '');
    setDiscipline(rule.discipline ?? '');
    setTemplateId(rule.template_id);
    setPriority(rule.priority);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleActive = async (rule: RoutingRule) => {
    try {
      await workflowApi.updateRoutingRule(rule.id, { is_active: !rule.is_active });
      await load();
    } catch {
      /* toast об ошибке показал интерцептор */
    }
  };

  const removeRule = async (id: number) => {
    try {
      await workflowApi.deleteRoutingRule(id);
      toast.success('Сценарий удалён');
      await load();
    } catch {
      /* toast об ошибке показал интерцептор */
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm py-6" style={{ color: 'var(--text-tertiary)' }}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--brand-iris)' }} />
        Загрузка сценариев…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Сценарий автоматически подбирает маршрут согласования по параметрам документа
        (проект, тип, дисциплина). Из подходящих сценариев выбирается самый специфичный,
        при равенстве — с большим приоритетом.
      </p>

      {/* Форма добавления */}
      {canWrite && (
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Название сценария *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border text-sm"
              style={inputStyle}
              placeholder="Например: Чертежи 65 — стандартный"
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Маршрут согласования *
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 rounded-md border text-sm"
              style={inputStyle}
            >
              <option value="">— выберите маршрут —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              Проект (необязательно)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 rounded-md border text-sm"
              style={inputStyle}
            >
              <option value="">— любой проект —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                Тип документа
              </label>
              <input
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 rounded-md border text-sm"
                style={inputStyle}
                placeholder="Любой"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                Дисциплина
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full px-3 py-2 rounded-md border text-sm"
                style={inputStyle}
              >
                <option value="">Любая</option>
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                Приоритет
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-md border text-sm"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border cursor-pointer"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}
            >
              <X size={12} />
              Отмена
            </button>
          )}
          <button
            type="button"
            onClick={addRule}
            disabled={busy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md cursor-pointer disabled:opacity-50"
            style={{ color: '#fff', background: 'var(--brand-iris)', border: '1px solid var(--brand-iris)' }}
          >
            <Plus size={12} />
            {editingId !== null ? 'Сохранить изменения' : 'Добавить сценарий'}
          </button>
        </div>
      </div>
      )}

      {/* Таблица сценариев */}
      {rules.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
          Сценариев пока нет — добавьте первый выше.
        </p>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                <th className="text-left px-3 py-2 text-xs font-medium">Сценарий</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Условия</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Маршрут</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Приоритет</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Активен</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border-default)' }}>
                  <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {r.name}
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {[r.project_name && `проект: ${r.project_name}`, r.doc_type && `тип: ${r.doc_type}`, r.discipline && `дисциплина: ${r.discipline}`]
                      .filter(Boolean)
                      .join(' · ') || 'дефолтный (все документы)'}
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {r.template_name ?? `#${r.template_id}`}
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {r.priority}
                  </td>
                  <td className="px-3 py-2">
                    {canWrite ? (
                      <input
                        type="checkbox"
                        checked={r.is_active}
                        onChange={() => toggleActive(r)}
                        className="cursor-pointer"
                      />
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {r.is_active ? 'да' : 'нет'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {canWrite && (
                      <>
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="p-1 rounded cursor-pointer mr-1"
                      style={{ color: 'var(--text-muted)' }}
                      title="Редактировать сценарий"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRule(r.id)}
                      className="p-1 rounded cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                      title="Удалить сценарий"
                    >
                      <Trash2 size={14} />
                    </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==================== Конструктор маршрутов ====================

interface DraftStep {
  name: string;
  role: string;
  assignment_type: string;
  approval_type: string;
  deadline_hours: string;
}

const emptyStep = (): DraftStep => ({
  name: '',
  role: '',
  assignment_type: 'sequential',
  approval_type: 'approve',
  deadline_hours: '',
});

function TemplatesSection() {
  const canWrite = useCan('references.write');
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [steps, setSteps] = useState<DraftStep[]>([emptyStep()]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await workflowApi.getTemplates());
    } catch {
      toast.error('Не удалось загрузить маршруты');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStep = (idx: number, patch: Partial<DraftStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const createRoute = async () => {
    if (!tplName.trim()) {
      toast.error('Укажите название маршрута');
      return;
    }
    const valid = steps.filter((s) => s.name.trim());
    if (valid.length === 0) {
      toast.error('Добавьте хотя бы один шаг с названием');
      return;
    }
    const stepsSchema: WorkflowStepSchema[] = valid.map((s, i) => ({
      id: `step_${i + 1}`,
      name: s.name.trim(),
      role: s.role.trim() || null,
      user_ids: null,
      assignment_type: s.assignment_type,
      approval_type: s.approval_type,
      deadline_hours: s.deadline_hours ? Number(s.deadline_hours) : null,
      auto_transition: {
        on_approve: i === valid.length - 1 ? 'complete' : 'next',
        on_reject: 'author',
      },
    }));
    setBusy(true);
    try {
      // code — латиница с подчёркиваниями без цифр (требование API), уникальный
      const base = tplName.trim().toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_+|_+$/g, '') || 'route';
      const suffix = Date.now().toString(36).replace(/[0-9]/g, (d) => 'abcdefghij'[Number(d)]);
      await workflowApi.createTemplate({
        name: tplName.trim(),
        code: `${base}_${suffix}`,
        description: tplDesc.trim() || undefined,
        steps_schema: stepsSchema,
      });
      toast.success('Маршрут создан');
      setTplName('');
      setTplDesc('');
      setSteps([emptyStep()]);
      setBuilderOpen(false);
      await load();
    } catch {
      /* toast об ошибке показал интерцептор */
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm py-6" style={{ color: 'var(--text-tertiary)' }}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--brand-iris)' }} />
        Загрузка маршрутов…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canWrite && (
        <button
          type="button"
          onClick={() => setBuilderOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border cursor-pointer"
          style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}
        >
          <Plus size={12} />
          {builderOpen ? 'Скрыть конструктор' : 'Создать свой маршрут'}
        </button>
        )}
      </div>

      {builderOpen && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                Название маршрута *
              </label>
              <input
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border text-sm"
                style={inputStyle}
                placeholder="Например: Короткий маршрут РП"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                Описание
              </label>
              <input
                value={tplDesc}
                onChange={(e) => setTplDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-md border text-sm"
                style={inputStyle}
                placeholder="Необязательно"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Этапы согласования (в порядке прохождения)
              </span>
              <button
                type="button"
                onClick={() => setSteps((prev) => [...prev, emptyStep()])}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border cursor-pointer"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}
              >
                <Plus size={11} /> Шаг
              </button>
            </div>
            {steps.map((s, i) => (
              <div
                key={i}
                className="rounded-lg p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-end"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}
              >
                <div className="md:col-span-4">
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Этап *</label>
                  <input
                    value={s.name}
                    onChange={(e) => setStep(i, { name: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border text-xs"
                    style={inputStyle}
                    placeholder="Например: ГИП"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Роль</label>
                  <input
                    value={s.role}
                    onChange={(e) => setStep(i, { role: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border text-xs"
                    style={inputStyle}
                    placeholder="gip"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Назначение</label>
                  <select
                    value={s.assignment_type}
                    onChange={(e) => setStep(i, { assignment_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border text-xs"
                    style={inputStyle}
                  >
                    {ASSIGNMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Тип</label>
                  <select
                    value={s.approval_type}
                    onChange={(e) => setStep(i, { approval_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border text-xs"
                    style={inputStyle}
                  >
                    {APPROVAL_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Лимит, ч</label>
                  <input
                    type="number"
                    value={s.deadline_hours}
                    onChange={(e) => setStep(i, { deadline_hours: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-md border text-xs"
                    style={inputStyle}
                    placeholder="—"
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))}
                    disabled={steps.length <= 1}
                    className="p-1.5 rounded cursor-pointer disabled:opacity-30"
                    style={{ color: 'var(--text-muted)' }}
                    title="Удалить шаг"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
              <AlertTriangle size={11} />
              После согласования шага маршрут автоматически перейдёт к следующему,
              после последнего — документ будет утверждён. Отклонение вернёт документ автору.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={createRoute}
              disabled={busy}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md cursor-pointer disabled:opacity-50"
              style={{ color: '#fff', background: 'var(--brand-iris)', border: '1px solid var(--brand-iris)' }}
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <GitBranch size={12} />}
              Создать маршрут
            </button>
          </div>
        </div>
      )}

      {/* Список маршрутов */}
      {templates.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
          Маршрутов пока нет.
        </p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => {
            const isOpen = expanded === t.id;
            return (
              <div
                key={t.id}
                className="rounded-xl p-4 transition-all"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                  className="w-full flex items-center justify-between gap-3 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch size={14} style={{ color: 'var(--brand-iris)' }} className="shrink-0" />
                    <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {t.name}
                    </span>
                    {t.is_default && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{ background: 'rgba(20,184,166,0.12)', color: '#14B8A6' }}
                      >
                        Предустановлен
                      </span>
                    )}
                  </div>
                  {isOpen ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                </button>
                {t.description && !isOpen && (
                  <p className="text-xs mt-1 ml-6" style={{ color: 'var(--text-tertiary)' }}>
                    {t.description}
                  </p>
                )}
                {isOpen && (
                  <div className="mt-3 ml-6 space-y-1.5">
                    {t.description && (
                      <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>{t.description}</p>
                    )}
                    {t.steps_schema.map((s, i) => (
                      <div key={s.id ?? i} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0"
                          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}
                        >
                          {i + 1}
                        </span>
                        <span style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>
                          · {APPROVAL_TYPES.find((a) => a.value === s.approval_type)?.label ?? s.approval_type}
                          {s.deadline_hours ? ` · до ${s.deadline_hours} ч` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== Корневая панель ====================

export default function WorkflowRoutingPanel() {
  const [section, setSection] = useState<'rules' | 'routes'>('rules');
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {(
          [
            { key: 'rules', label: 'Сценарии маршрутизации' },
            { key: 'routes', label: 'Маршруты согласования' },
          ] as const
        ).map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className="text-xs px-3 py-1.5 rounded-md cursor-pointer"
            style={
              section === s.key
                ? { color: '#fff', background: 'var(--brand-iris)', border: '1px solid var(--brand-iris)' }
                : { color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }
            }
          >
            {s.label}
          </button>
        ))}
      </div>
      {section === 'rules' ? <RoutingRulesSection /> : <TemplatesSection />}
    </div>
  );
}
