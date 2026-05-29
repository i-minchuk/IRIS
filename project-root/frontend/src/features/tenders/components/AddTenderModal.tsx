import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Calculator, Users, AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown, FileText, Copy, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { resourcesApi } from '@/features/resources/api/resources';
import type { WorkloadData } from '@/features/resources/api/resources';
import { createTender } from '@/features/tenders/api/tenders';

interface AddTenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

interface FormData {
  name: string;
  customer_name: string;
  project_type: string;
  volume: string;
  volume_unit: string;
  complexity: string;
  standards: string[];
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
    volume: '',
    volume_unit: 'тыс. м²',
    complexity: 'medium',
    standards: [],
    deadline: '',
    nmc: '',
    our_price: '',
    margin_pct: '20',
    probability: '50',
    platform: '',
    region: '',
  };
}

export default function AddTenderModal({ isOpen, onClose, onCreated }: AddTenderModalProps) {
  const [form, setForm] = useState<FormData>(getDefaultForm);
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [workload, setWorkload] = useState<WorkloadData | null>(null);
  const [loadingWorkload, setLoadingWorkload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [proposalCopied, setProposalCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(getDefaultForm());
      setCalculation(null);
      setShowCalc(false);
      setLoadingWorkload(true);
      resourcesApi
        .getWorkload()
        .then((res) => setWorkload(res.data))
        .catch(() => setWorkload(null))
        .finally(() => setLoadingWorkload(false));
    }
  }, [isOpen]);

  const handleChange = useCallback(
    (field: keyof FormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const toggleStandard = useCallback((std: string) => {
    setForm((prev) => ({
      ...prev,
      standards: prev.standards.includes(std)
        ? prev.standards.filter((s) => s !== std)
        : [...prev.standards, std],
    }));
  }, []);

  const calculate = useCallback(() => {
    const volume = Number(form.volume) || 0;
    const type = form.project_type || 'ЖК';
    const complexity = form.complexity || 'medium';
    const base = BASE_HOURS[type]?.[complexity] ?? BASE_HOURS['ЖК'][complexity];
    const standardsMult = 1 + form.standards.length * 0.03;
    const totalHours = Math.round(volume * base * standardsMult);

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
  }, [form.volume, form.project_type, form.complexity, form.standards, form.deadline, form.margin_pct, workload]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await createTender({
        name: form.name,
        customer_name: form.customer_name,
        project_type: form.project_type,
        volume: Number(form.volume) || 0,
        volume_unit: form.volume_unit,
        complexity: form.complexity,
        standards: form.standards,
        deadline: form.deadline || undefined,
        nmc: Number(form.nmc) || undefined,
        our_price: Number(form.our_price) || undefined,
        margin_pct: Number(form.margin_pct) || undefined,
        probability: Number(form.probability) || undefined,
        platform: form.platform,
        region: form.region,
        status: 'preparation',
        stage: 'new',
        team_composition: {},
      });
      onCreated?.();
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      let message = 'Не удалось создать тендер';
      if (status === 400) message = 'Ошибка в данных';
      else if (status === 403) message = 'Доступ запрещён';
      else if (status === 404) message = 'Не найдено';
      else if (status === 422) message = 'Ошибка валидации';
      else if (status >= 500) message = 'Ошибка сервера';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [form, onClose, onCreated]);

  const isValid = useMemo(
    () => form.name.trim() && form.customer_name.trim() && form.project_type && form.volume,
    [form]
  );

  const avgUtilization = useMemo(() => {
    if (!workload || workload.team.length === 0) return 0;
    return workload.team.reduce((sum, m) => sum + (m.month_active_hours / 160), 0) / workload.team.length;
  }, [workload]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Новый тендер" size="xl" className="text-black">
      <div className="space-y-5">
        {/* Основные данные */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Название тендера" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Например, ЖК «Северный»" />
          <Input label="Заказчик" value={form.customer_name} onChange={(e) => handleChange('customer_name', e.target.value)} placeholder="ООО «Заказчик»" />
          <Select label="Тип объекта" value={form.project_type} onChange={(e) => handleChange('project_type', e.target.value)} options={PROJECT_TYPES} placeholder="Выберите тип" />
          <div className="flex gap-2">
            <Input label="Объём работ" type="number" value={form.volume} onChange={(e) => handleChange('volume', e.target.value)} placeholder="100" className="flex-1" />
            <Select label="Ед. изм." value={form.volume_unit} onChange={(e) => handleChange('volume_unit', e.target.value)} options={[{ value: 'тыс. м²', label: 'тыс. м²' }, { value: 'м²', label: 'м²' }, { value: 'га', label: 'га' }, { value: 'км', label: 'км' }]} className="w-28" />
          </div>
          <Select label="Сложность" value={form.complexity} onChange={(e) => handleChange('complexity', e.target.value)} options={COMPLEXITY_OPTIONS} />
          <Input label="Дедлайн подачи" type="date" value={form.deadline} onChange={(e) => handleChange('deadline', e.target.value)} />
          <Input label="НМЦ, ₽" type="number" value={form.nmc} onChange={(e) => handleChange('nmc', e.target.value)} placeholder="420000000" />
          <Input label="Вероятность выигрыша, %" type="number" min={0} max={100} value={form.probability} onChange={(e) => handleChange('probability', e.target.value)} />
          <Input label="Наша цена, ₽" type="number" value={form.our_price} onChange={(e) => handleChange('our_price', e.target.value)} placeholder="500000000" />
          <Input label="Маржа, %" type="number" value={form.margin_pct} onChange={(e) => handleChange('margin_pct', e.target.value)} placeholder="20" />
          <Input label="Площадка" value={form.platform} onChange={(e) => handleChange('platform', e.target.value)} placeholder="zakupki.gov.ru" />
          <Input label="Регион" value={form.region} onChange={(e) => handleChange('region', e.target.value)} placeholder="Москва" className="md:col-span-2" />
        </div>

        {/* Стандарты */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Применяемые стандарты</label>
          <div className="flex flex-wrap gap-2">
            {STANDARDS_LIST.map((std) => (
              <button
                key={std}
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
        </div>

        {/* Кнопка расчёта */}
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" leftIcon={<Calculator size={14} />} onClick={calculate} disabled={!isValid}>
            Рассчитать трудоёмкость
          </Button>
          {!isValid && <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Заполните название, заказчика, тип и объём</span>}
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
                    <span className="text-[11px] font-medium w-12 text-right" style={{ color: avgUtilization > 0.85 ? '#DC2626' : 'var(--text-secondary)' }}>{Math.round(avgUtilization * 100)}%</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {workload.team.slice(0, 4).map((member) => {
                      const util = member.month_active_hours / 160;
                      return (
                        <div key={member.id} className="flex items-center justify-between text-[11px] px-2 py-1 rounded" style={{ background: 'var(--bg-surface)' }}>
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
                  <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: calculation.overloadRisk ? '#DC2626' : 'var(--text-secondary)' }}>
                    <span className="mt-0.5">{calculation.overloadRisk ? <TrendingDown size={10} /> : <CheckCircle2 size={10} />}</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Коммерческое предложение */}
            <CommercialProposalSection form={form} calculation={calculation} copied={proposalCopied} onCopy={setProposalCopied} />
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
          Создать тендер
        </Button>
      </div>
    </Modal>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="p-2.5 rounded-md space-y-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color }}>{icon}</span> {label}
      </div>
      <div className="text-sm font-bold" style={{ color }}>{value}</div>
    </div>
  );
}


function CommercialProposalSection({
  form,
  calculation,
  copied,
  onCopy,
}: {
  form: FormData;
  calculation: CalculationResult;
  copied: boolean;
  onCopy: (v: boolean) => void;
}) {
  const complexityLabel: Record<string, string> = {
    low: 'Низкая',
    medium: 'Средняя',
    high: 'Высокая',
  };

  const today = new Date().toLocaleDateString('ru-RU');

  const proposalText = useMemo(() => {
    const nmcFormatted = form.nmc ? `${(Number(form.nmc) / 1e6).toFixed(1)} млн` : '—';
    const priceFormatted = form.our_price ? `${(Number(form.our_price) / 1e6).toFixed(1)} млн` : '—';
    const costFormatted = `${(calculation.cost / 1e6).toFixed(1)} млн`;

    return `КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
№ КП-${today.replace(/\./g, '')}
Дата: ${today}

ЗАКАЗЧИК: ${form.customer_name || '—'}
ОБЪЕКТ: ${form.name || '—'}
Тип объекта: ${form.project_type || '—'}
Регион: ${form.region || '—'}

1. ОПИСАНИЕ ОБЪЕКТА И ОБЪЁМА РАБОТ
Объект: ${form.name || '—'}
Тип: ${form.project_type || '—'}
Объём: ${form.volume || '—'} ${form.volume_unit}
Сложность: ${complexityLabel[form.complexity] || '—'}
Применяемые стандарты: ${form.standards.length > 0 ? form.standards.join(', ') : '—'}

2. СОСТАВ И ОБЪЁМ РАБОТ
Разработка рабочей документации, включая:
• Архитектурные решения (АР)
• Конструкции железобетонные (КЖ)
• Конструкции металлические (КМ)
• Отопление, вентиляция и кондиционирование (ОВиК)
• Электроснабжение и электроосвещение (ЭОМ)
• Водоснабжение и канализация (ВК)
• Технологические решения (при необходимости)

3. СРОКИ ВЫПОЛНЕНИЯ
Общая длительность: ${calculation.durationMonths} мес.
Трудоёмкость: ${calculation.totalHours.toLocaleString('ru-RU')} чел-ч
Команда: ${calculation.teamSize} чел.

4. СТОИМОСТЬ РАБОТ
Себестоимость: ${costFormatted} ₽
Наша цена: ${priceFormatted} ₽
Маржа: ${form.margin_pct || '—'}%
НМЦ заказчика: ${nmcFormatted} ₽

5. УСЛОВИЯ
• Срок действия предложения: 30 дней
• Форма оплаты: по договорённости
• Гарантия качества: соответствие ГОСТ и СП
• Платформа тендера: ${form.platform || '—'}

---
ООО «ДокПоток IRIS»
Тел.: +7 (495) 000-00-00
E-mail: tender@dokpotok.ru
`;
  }, [form, calculation, today]);

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
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border transition-colors"
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
        className="rounded-md p-3 text-[11px] leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
      >
        {proposalText}
      </div>
    </div>
  );
}
