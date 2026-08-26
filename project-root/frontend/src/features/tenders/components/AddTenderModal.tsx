import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { Calculator, Users, AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown, FileText, Copy, Check, Plus, X, Paperclip, Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { resourcesApi } from '@/features/resources/api/resources';
import type { WorkloadData } from '@/features/resources/api/resources';
import { createTender, updateTender, uploadStandardAttachment, getNextKpNumber } from '@/features/tenders/api/tenders';
import { renderProposalTemplate } from '@/features/tenders/utils/proposalTemplate';
import type { Tender, TenderStandardFile } from '@/features/tenders/types/tender';

interface AddTenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  /** Тендер для редактирования; если задан — форма работает в режиме редактирования */
  editTender?: Tender | null;
}

interface FormData {
  name: string;
  customer_name: string;
  project_type: string;
  scope_items: string[];
  complexity: string;
  standards: string[];
  standard_files: TenderStandardFile[];
  deadline: string;
  nmc: string;
  our_price: string;
  margin_pct: string;
  probability: string;
  platform: string;
  region: string;
}

interface CalculationResult {
  totalHours: number;
  durationMonths: number;
  teamSize: number;
  cost: number;
  hourlyRate: number;
  overloadRisk: boolean;
  recommendations: string[];
}

const PROJECT_TYPES = [
  { value: 'ЖК', label: 'Жилой комплекс (ЖК)' },
  { value: 'ТЭЦ', label: 'Теплоэлектроцентраль (ТЭЦ)' },
  { value: 'Офис', label: 'Офисное здание' },
  { value: 'Склад', label: 'Склад/логистика' },
  { value: 'ТЦ', label: 'Торговый центр' },
  { value: 'Промышленный', label: 'Промышленный объект' },
];

const COMPLEXITY_OPTIONS = [
  { value: 'low', label: 'Низкая' },
  { value: 'medium', label: 'Средняя' },
  { value: 'high', label: 'Высокая' },
];

const STANDARDS_LIST = ['СП 70', 'ГОСТ 27751', 'СНиП 2.01', 'СП 16', 'СП 22', 'СП 43', 'СП 52', 'ГОСТ 19804'];

/** Состав работ: мы проектировщики, а не строители. */
const SCOPE_OPTIONS = [
  'Поставка шкафов НКУ',
  'Поставка оборудования',
  'Проектная документация (ПД)',
  'Рабочая документация (РД)',
  'Электроснабжение и электроосвещение (ЭОМ)',
  'Автоматизация и КИПиА',
  'Авторский надзор',
];

const BASE_HOURS: Record<string, Record<string, number>> = {
  ЖК: { low: 35, medium: 70, high: 120 },
  ТЭЦ: { low: 45, medium: 90, high: 150 },
  Офис: { low: 30, medium: 55, high: 95 },
  Склад: { low: 25, medium: 45, high: 80 },
  ТЦ: { low: 32, medium: 60, high: 100 },
  Промышленный: { low: 40, medium: 80, high: 140 },
};

const HOURLY_RATE = 5000;

function getDefaultForm(): FormData {
  return {
    name: '',
    customer_name: '',
    project_type: '',
    scope_items: [],
    complexity: 'medium',
    standards: [],
    standard_files: [],
    deadline: '',
    nmc: '',
    our_price: '',
    margin_pct: '20',
    probability: '50',
    platform: '',
    region: '',
  };
}

/** Форма, предзаполненная данными существующего тендера (режим редактирования). */
function formFromTender(t: Tender): FormData {
  return {
    name: t.name || '',
    customer_name: t.customer_name || '',
    project_type: t.project_type || '',
    scope_items: t.scope_items ?? [],
    complexity: t.complexity || 'medium',
    standards: t.standards ?? [],
    standard_files: t.standard_files ?? [],
    deadline: t.deadline ? t.deadline.slice(0, 10) : '',
    nmc: t.nmc != null ? String(t.nmc) : '',
    our_price: t.our_price != null ? String(t.our_price) : '',
    margin_pct: t.margin_pct != null ? String(t.margin_pct) : '20',
    probability: t.probability != null ? String(t.probability) : '50',
    platform: t.platform || '',
    region: t.region || '',
  };
}

/** Автогенерация наименования из заполненных полей (можно править вручную). */
function generateTenderName(customer: string, projectType: string): string {
  const typeLabel = PROJECT_TYPES.find((t) => t.value === projectType)?.label || projectType;
  const parts = ['Проектирование'];
  if (typeLabel) parts.push(typeLabel);
  if (customer.trim()) parts.push(customer.trim());
  return parts.length > 1 ? parts.join(' — ') : '';
}

export default function AddTenderModal({ isOpen, onClose, onCreated, editTender }: AddTenderModalProps) {
  const [form, setForm] = useState<FormData>(getDefaultForm);
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [workload, setWorkload] = useState<WorkloadData | null>(null);
  const [loadingWorkload, setLoadingWorkload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [proposalCopied, setProposalCopied] = useState(false);
  // Наименование: автогенерация, пока пользователь не ввёл своё
  const nameEditedRef = useRef(false);
  // Состав работ: добавление пункта (из списка или свой вариант)
  const [scopeSelect, setScopeSelect] = useState('');
  const [scopeCustom, setScopeCustom] = useState('');
  // Стандарты: ручной ввод + необязательный файл вложения
  const [customStandard, setCustomStandard] = useState('');
  const [standardFile, setStandardFile] = useState<File | null>(null);
  const [uploadingStandard, setUploadingStandard] = useState(false);
  const standardFileInputRef = useRef<HTMLInputElement>(null);
  // Номер КП, который будет присвоен тендеру (превью в тексте предложения)
  const [kpNumber, setKpNumber] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editTender) {
        setForm(formFromTender(editTender));
        nameEditedRef.current = true;
        setKpNumber(editTender.kp_number ?? null);
      } else {
        setForm(getDefaultForm());
        nameEditedRef.current = false;
        getNextKpNumber()
          .then(setKpNumber)
          .catch(() => setKpNumber(null));
      }
      setCalculation(null);
      setShowCalc(false);
      setScopeSelect('');
      setScopeCustom('');
      setCustomStandard('');
      setStandardFile(null);
      setLoadingWorkload(true);
      resourcesApi
        .getWorkload()
        .then((res) => setWorkload(res.data))
        .catch(() => setWorkload(null))
        .finally(() => setLoadingWorkload(false));
    }
  }, [isOpen, editTender]);

  const handleChange = useCallback(
    (field: keyof FormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleNameChange = useCallback((value: string) => {
    nameEditedRef.current = true;
    setForm((prev) => ({ ...prev, name: value }));
  }, []);

  /** Генерация наименования из типа объекта и заказчика — только по кнопке. */
  const regenerateName = useCallback(() => {
    nameEditedRef.current = true;
    setForm((prev) => ({
      ...prev,
      name: generateTenderName(prev.customer_name, prev.project_type),
    }));
  }, []);

  const addScopeItem = useCallback(() => {
    const item = (scopeSelect === '__custom__' ? scopeCustom : scopeSelect).trim();
    if (!item) return;
    setForm((prev) => {
      if (prev.scope_items.includes(item)) return prev;
      const items = [...prev.scope_items, item];
      // Наименование автоподставляется из состава работ, пока не правили вручную
      return nameEditedRef.current
        ? { ...prev, scope_items: items }
        : { ...prev, scope_items: items, name: items.join(', ') };
    });
    setScopeSelect('');
    setScopeCustom('');
  }, [scopeSelect, scopeCustom]);

  /** Выбор пункта в выпадающем списке сразу подставляет наименование (если не правили вручную). */
  const handleScopeSelectChange = useCallback((value: string) => {
    setScopeSelect(value);
    if (!value || value === '__custom__' || nameEditedRef.current) return;
    setForm((prev) => {
      const items = prev.scope_items.includes(value)
        ? prev.scope_items
        : [...prev.scope_items, value];
      return { ...prev, name: items.join(', ') };
    });
  }, []);

  const removeScopeItem = useCallback((item: string) => {
    setForm((prev) => {
      const items = prev.scope_items.filter((s) => s !== item);
      return nameEditedRef.current
        ? { ...prev, scope_items: items }
        : { ...prev, scope_items: items, name: items.join(', ') };
    });
  }, []);

  const toggleStandard = useCallback((std: string) => {
    setForm((prev) => ({
      ...prev,
      standards: prev.standards.includes(std)
        ? prev.standards.filter((s) => s !== std)
        : [...prev.standards, std],
      // при снятии стандарта убираем и его вложение
      standard_files: prev.standards.includes(std)
        ? prev.standard_files.filter((f) => f.standard !== std)
        : prev.standard_files,
    }));
  }, []);

  /** Ручной стандарт + необязательный файл (загружается сразу). */
  const addCustomStandard = useCallback(async () => {
    const std = customStandard.trim();
    if (!std || uploadingStandard) return;
    let attachment: TenderStandardFile | null = null;
    if (standardFile) {
      setUploadingStandard(true);
      try {
        const uploaded = await uploadStandardAttachment(standardFile);
        attachment = {
          standard: std,
          file_name: uploaded.file_name,
          stored_name: uploaded.stored_name,
        };
      } catch (err: any) {
        const detail = err?.response?.data?.detail;
        toast.error(detail || 'Не удалось загрузить файл стандарта');
        setUploadingStandard(false);
        return;
      }
      setUploadingStandard(false);
    }
    setForm((prev) => ({
      ...prev,
      standards: prev.standards.includes(std) ? prev.standards : [...prev.standards, std],
      standard_files: attachment ? [...prev.standard_files, attachment] : prev.standard_files,
    }));
    setCustomStandard('');
    setStandardFile(null);
    if (standardFileInputRef.current) standardFileInputRef.current.value = '';
  }, [customStandard, standardFile, uploadingStandard]);

  const calculate = useCallback(() => {
    // Проектирование: трудоёмкость от числа пунктов состава работ
    const scopeCount = Math.max(form.scope_items.length, 1);
    const type = form.project_type || 'ЖК';
    const complexity = form.complexity || 'medium';
    const base = BASE_HOURS[type]?.[complexity] ?? BASE_HOURS['ЖК'][complexity];
    const standardsMult = 1 + form.standards.length * 0.03;
    const totalHours = Math.round(scopeCount * base * standardsMult);

    let teamSize = complexity === 'low' ? 2 : complexity === 'medium' ? 4 : 6;
    if (form.deadline) {
      const months = Math.max(1, Math.ceil(totalHours / (teamSize * 160)));
      teamSize = Math.max(2, Math.ceil(totalHours / (months * 160)));
    }
    const durationMonths = Math.max(0.5, totalHours / (teamSize * 160));

    const cost = totalHours * HOURLY_RATE;
    const margin = Number(form.margin_pct) || 20;
    const ourPrice = cost / (1 - margin / 100);

    setForm((prev) => ({ ...prev, our_price: String(Math.round(ourPrice)) }));

    const recommendations: string[] = [];
    let overloadRisk = false;

    if (workload && workload.team.length > 0) {
      const avgUtilization =
        workload.team.reduce((sum, m) => sum + (m.month_active_hours / 160), 0) / workload.team.length;
      if (avgUtilization > 0.85) {
        overloadRisk = true;
        recommendations.push('Команда загружена более чем на 85%. Участие в тендере рискованно по срокам.');
        recommendations.push('Рекомендуется согласовать с руководителем привлечение сотрудников из других отделов.');
      }
      if (avgUtilization > 1.1) {
        recommendations.push('Команда перегружена (>100%). Рассмотрите найм новых сотрудников или перенос дедлайна.');
      }
      if (durationMonths > 3 && complexity === 'high') {
        recommendations.push('Высокая сложность + длительный срок. Рекомендуется разбить проект на этапы.');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Загрузка команды в норме. Тендер можно взять в работу.');
    }

    setCalculation({
      totalHours,
      durationMonths: Math.round(durationMonths * 10) / 10,
      teamSize,
      cost,
      hourlyRate: HOURLY_RATE,
      overloadRisk,
      recommendations,
    });
    setShowCalc(true);
    setProposalCopied(false);
  }, [form.scope_items, form.project_type, form.complexity, form.standards, form.deadline, form.margin_pct, workload]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        customer_name: form.customer_name,
        project_type: form.project_type,
        scope_items: form.scope_items,
        complexity: form.complexity,
        standards: form.standards,
        standard_files: form.standard_files,
        deadline: form.deadline || undefined,
        nmc: Number(form.nmc) || undefined,
        our_price: Number(form.our_price) || undefined,
        margin_pct: Number(form.margin_pct) || undefined,
        probability: Number(form.probability) || undefined,
        platform: form.platform,
        region: form.region,
        team_composition: {},
      };
      if (editTender) {
        await updateTender(editTender.id, payload);
      } else {
        await createTender({ ...payload, status: 'preparation', stage: 'new' });
      }
      onCreated?.();
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      let message = editTender ? 'Не удалось сохранить тендер' : 'Не удалось создать тендер';
      if (status === 400) message = 'Ошибка в данных';
      else if (status === 403) message = 'Доступ запрещён';
      else if (status === 404) message = 'Не найдено';
      else if (status === 422) message = 'Ошибка валидации';
      else if (status >= 500) message = 'Ошибка сервера';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [form, editTender, onClose, onCreated]);

  const isValid = useMemo(
    () => form.name.trim() && form.customer_name.trim() && form.project_type,
    [form]
  );

  const avgUtilization = useMemo(() => {
    if (!workload || workload.team.length === 0) return 0;
    return workload.team.reduce((sum, m) => sum + (m.month_active_hours / 160), 0) / workload.team.length;
  }, [workload]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editTender ? `Редактирование тендера ${editTender.kp_number || ''}` : 'Новый тендер'} size="xl" className="text-black">
      <div className="space-y-5">
        {/* Основные данные */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input label="Наименование тендера" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Например, Проектирование ЖК «Северный»" />
            <button
              type="button"
              onClick={regenerateName}
              className="mt-1 inline-flex items-center gap-1 text-xs transition-colors hover:underline"
              style={{ color: 'var(--text-tertiary)' }}
              title="Сгенерировать наименование из типа объекта и заказчика"
            >
              <Sparkles size={11} /> Сгенерировать из типа и заказчика
            </button>
          </div>
          <Input label="Заказчик" value={form.customer_name} onChange={(e) => handleChange('customer_name', e.target.value)} placeholder="ООО «Заказчик»" />
          <Select label="Тип объекта" value={form.project_type} onChange={(e) => handleChange('project_type', e.target.value)} options={PROJECT_TYPES} placeholder="Выберите тип" />
          <Select label="Сложность" value={form.complexity} onChange={(e) => handleChange('complexity', e.target.value)} options={COMPLEXITY_OPTIONS} />
          <Input label="Дедлайн подачи" type="date" value={form.deadline} onChange={(e) => handleChange('deadline', e.target.value)} />
          <Input label="НМЦ, ₽" type="number" value={form.nmc} onChange={(e) => handleChange('nmc', e.target.value)} placeholder="420000000" />
          <Input label="Вероятность выигрыша, %" type="number" min={0} max={100} value={form.probability} onChange={(e) => handleChange('probability', e.target.value)} />
          <Input label="Наша цена, ₽" type="number" value={form.our_price} onChange={(e) => handleChange('our_price', e.target.value)} placeholder="500000000" />
          <Input label="Маржа, %" type="number" value={form.margin_pct} onChange={(e) => handleChange('margin_pct', e.target.value)} placeholder="20" />
          <Input label="Площадка" value={form.platform} onChange={(e) => handleChange('platform', e.target.value)} placeholder="zakupki.gov.ru" />
          <Input label="Регион" value={form.region} onChange={(e) => handleChange('region', e.target.value)} placeholder="Москва" />
        </div>

        {/* Состав работ (проектирование) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Состав работ</label>
          {form.scope_items.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {form.scope_items.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border"
                  style={{
                    background: 'rgba(37,99,235,0.12)',
                    borderColor: 'rgba(37,99,235,0.4)',
                    color: '#2563EB',
                  }}
                >
                  {item}
                  <button type="button" onClick={() => removeScopeItem(item)} className="hover:opacity-70" title="Убрать">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Select
              value={scopeSelect}
              onChange={(e) => handleScopeSelectChange(e.target.value)}
              options={[
                ...SCOPE_OPTIONS.map((s) => ({ value: s, label: s })),
                { value: '__custom__', label: 'Свой вариант…' },
              ]}
              placeholder="Выберите из списка"
              className="flex-1"
            />
            {scopeSelect === '__custom__' && (
              <Input
                value={scopeCustom}
                onChange={(e) => setScopeCustom(e.target.value)}
                placeholder="Введите вручную"
                className="flex-1"
              />
            )}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={addScopeItem}
              disabled={!scopeSelect || (scopeSelect === '__custom__' && !scopeCustom.trim())}
            >
              Добавить
            </Button>
          </div>
        </div>

        {/* Стандарты */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Применяемые стандарты <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>(необязательно)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {STANDARDS_LIST.map((std) => (
              <button
                key={std}
                type="button"
                onClick={() => toggleStandard(std)}
                className="text-xs px-2.5 py-1 rounded-md border transition-colors"
                style={{
                  background: form.standards.includes(std) ? 'rgba(37,99,235,0.12)' : 'var(--bg-surface-2)',
                  borderColor: form.standards.includes(std) ? 'rgba(37,99,235,0.4)' : 'var(--border-default)',
                  color: form.standards.includes(std) ? '#2563EB' : 'var(--text-secondary)',
                }}
              >
                {std}
              </button>
            ))}
          </div>

          {/* Свой стандарт + файл */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Input
              value={customStandard}
              onChange={(e) => setCustomStandard(e.target.value)}
              placeholder="Свой стандарт, например ГОСТ Р 58833"
              className="flex-1 min-w-56"
            />
            <input
              ref={standardFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.djvu"
              className="hidden"
              onChange={(e) => setStandardFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Paperclip size={13} />}
              onClick={() => standardFileInputRef.current?.click()}
              title="Вложить файл стандарта (необязательно)"
            >
              {standardFile ? standardFile.name : 'Вложить файл'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={addCustomStandard}
              disabled={!customStandard.trim() || uploadingStandard}
              isLoading={uploadingStandard}
            >
              Добавить
            </Button>
          </div>

          {/* Выбранные вручную стандарты (не из пресета) */}
          {form.standards.some((s) => !STANDARDS_LIST.includes(s)) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.standards
                .filter((s) => !STANDARDS_LIST.includes(s))
                .map((std) => {
                  const file = form.standard_files.find((f) => f.standard === std);
                  return (
                    <span
                      key={std}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border"
                      style={{
                        background: 'rgba(37,99,235,0.12)',
                        borderColor: 'rgba(37,99,235,0.4)',
                        color: '#2563EB',
                      }}
                    >
                      {std}
                      {file && (
                        <span className="inline-flex items-center gap-0.5" style={{ color: 'var(--text-tertiary)' }}>
                          <Paperclip size={10} /> {file.file_name}
                        </span>
                      )}
                      <button type="button" onClick={() => toggleStandard(std)} className="hover:opacity-70" title="Убрать">
                        <X size={11} />
                      </button>
                    </span>
                  );
                })}
            </div>
          )}
        </div>

        {/* Кнопка расчёта */}
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" leftIcon={<Calculator size={14} />} onClick={calculate} disabled={!isValid}>
            Рассчитать трудоёмкость
          </Button>
          {!isValid && <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Заполните наименование, заказчика и тип объекта</span>}
        </div>

        {/* Результаты расчёта */}
        {showCalc && calculation && (
          <div className="space-y-4 rounded-lg p-4" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Calculator size={14} style={{ color: '#2563EB' }} /> Результат расчёта
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="Трудоёмкость" value={`${calculation.totalHours.toLocaleString('ru-RU')} чел-ч`} icon={<Clock size={12} />} color="#2563EB" />
              <MetricCard label="Длительность" value={`${calculation.durationMonths} мес`} icon={<Clock size={12} />} color="#6B5B95" />
              <MetricCard label="Команда" value={`${calculation.teamSize} чел`} icon={<Users size={12} />} color="#4F7A4C" />
              <MetricCard label="Себестоимость" value={`${(calculation.cost / 1e6).toFixed(1)} млн ₽`} icon={<TrendingUp size={12} />} color="#D4AF37" />
            </div>

            {/* Загрузка команды */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <Users size={12} style={{ color: '#6B5B95' }} /> Текущая загрузка команды
              </h5>
              {loadingWorkload ? (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Загрузка данных...</p>
              ) : workload && workload.team.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(avgUtilization * 100, 100)}%`, background: avgUtilization > 0.85 ? '#DC2626' : avgUtilization > 0.6 ? '#D4AF37' : '#0C7205' }} />
                    </div>
                    <span className="text-sm font-medium w-12 text-right" style={{ color: avgUtilization > 0.85 ? '#DC2626' : 'var(--text-secondary)' }}>{Math.round(avgUtilization * 100)}%</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {workload.team.slice(0, 4).map((member) => {
                      const util = member.month_active_hours / 160;
                      return (
                        <div key={member.id} className="flex items-center justify-between text-sm px-2 py-1 rounded" style={{ background: 'var(--bg-surface)' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{member.full_name}</span>
                          <span style={{ color: util > 0.85 ? '#DC2626' : util > 0.6 ? '#D4AF37' : '#0C7205' }}>{Math.round(util * 100)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Данные о загрузке недоступны</p>
              )}
            </div>

            {/* Риски и рекомендации */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                {calculation.overloadRisk ? <AlertTriangle size={12} style={{ color: '#DC2626' }} /> : <CheckCircle2 size={12} style={{ color: '#0C7205' }} />}
                {calculation.overloadRisk ? 'Выявлены риски' : 'Риски минимальны'}
              </h5>
              <ul className="space-y-1">
                {calculation.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm flex items-start gap-1.5" style={{ color: calculation.overloadRisk ? '#DC2626' : 'var(--text-secondary)' }}>
                    <span className="mt-0.5">{calculation.overloadRisk ? <TrendingDown size={10} /> : <CheckCircle2 size={10} />}</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Коммерческое предложение */}
            <CommercialProposalSection form={form} calculation={calculation} kpNumber={kpNumber} copied={proposalCopied} onCopy={setProposalCopied} />
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
        <Button variant="ghost" size="md" onClick={onClose} disabled={saving}>
          Отмена
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          disabled={!isValid || saving}
          isLoading={saving}
          style={(!isValid || saving) ? undefined : { background: '#2563EB', borderColor: '#2563EB', color: '#fff' }}
        >
          {editTender ? 'Сохранить изменения' : 'Создать тендер'}
        </Button>
      </div>
    </Modal>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="p-2.5 rounded-md space-y-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <div className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color }}>{icon}</span> {label}
      </div>
      <div className="text-sm font-bold" style={{ color }}>{value}</div>
    </div>
  );
}


function CommercialProposalSection({
  form,
  calculation,
  kpNumber,
  copied,
  onCopy,
}: {
  form: FormData;
  calculation: CalculationResult;
  kpNumber: string | null;
  copied: boolean;
  onCopy: (v: boolean) => void;
}) {
  const complexityLabel: Record<string, string> = {
    low: 'Низкая',
    medium: 'Средняя',
    high: 'Высокая',
  };

  const today = new Date().toLocaleDateString('ru-RU');
  // Номер КП = номер тендера: последовательный в течение года, с 1 января — заново
  const kpLabel = kpNumber || `КП-…-${new Date().getFullYear()} (присвоится при создании)`;

  const proposalText = useMemo(() => {
    const nmcFormatted = form.nmc ? `${(Number(form.nmc) / 1e6).toFixed(1)} млн` : '—';
    const priceFormatted = form.our_price ? `${(Number(form.our_price) / 1e6).toFixed(1)} млн` : '—';
    const costFormatted = `${(calculation.cost / 1e6).toFixed(1)} млн`;

    return renderProposalTemplate({
      НОМЕР_КП: kpLabel,
      ДАТА: today,
      ЗАКАЗЧИК: form.customer_name || '—',
      ОБЪЕКТ: form.name || '—',
      ТИП_ОБЪЕКТА: form.project_type || '—',
      РЕГИОН: form.region || '—',
      СОСТАВ_РАБОТ: form.scope_items.length > 0 ? form.scope_items.join(', ') : '—',
      СЛОЖНОСТЬ: complexityLabel[form.complexity] || '—',
      СТАНДАРТЫ: form.standards.length > 0 ? form.standards.join(', ') : '—',
      ДЛИТЕЛЬНОСТЬ_МЕС: String(calculation.durationMonths),
      ТРУДОЁМКОСТЬ_ЧЕЛ_Ч: calculation.totalHours.toLocaleString('ru-RU'),
      КОМАНДА_ЧЕЛ: String(calculation.teamSize),
      СЕБЕСТОИМОСТЬ: costFormatted,
      ЦЕНА: priceFormatted,
      МАРЖА: form.margin_pct || '—',
      НМЦ: nmcFormatted,
      ПЛОЩАДКА: form.platform || '—',
    });
  }, [form, calculation, today, kpLabel]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(proposalText);
      onCopy(true);
      setTimeout(() => onCopy(false), 2000);
    } catch {
      // ignore
    }
  }, [proposalText, onCopy]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          <FileText size={12} style={{ color: '#2563EB' }} /> Коммерческое предложение
        </h5>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-md border transition-colors"
          style={{
            background: copied ? 'rgba(12,114,5,0.12)' : 'var(--bg-surface)',
            borderColor: copied ? 'rgba(12,114,5,0.4)' : 'var(--border-default)',
            color: copied ? '#0C7205' : 'var(--text-secondary)',
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>
      <div
        className="rounded-md p-3 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-secondary)',
          // Оформление КП: Times New Roman 14 (таблицы внутри — 12)
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '14px',
        }}
      >
        {proposalText}
      </div>
    </div>
  );
}
