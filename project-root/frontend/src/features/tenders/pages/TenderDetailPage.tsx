import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, FileText, Users, Factory, Truck, ClipboardCheck,
  Calculator, BookOpen, AlertTriangle, Loader2
} from 'lucide-react';
import { tenderExtendedApi } from '@/features/tenders/api/tenderExtended';
import type { TenderDetail } from '@/features/tenders/types/tender-extended';
import TenderOverviewTab from './TenderOverviewTab';
import TenderTeamTab from './TenderTeamTab';
import TenderProductionTab from './TenderProductionTab';
import TenderProcurementTab from './TenderProcurementTab';
import TenderDocumentsTab from './TenderDocumentsTab';
import TenderCalculatorTab from './TenderCalculatorTab';

const TABS = [
  { id: 'overview', label: 'Обзор', icon: <FileText size={14} /> },
  { id: 'team', label: 'Команда', icon: <Users size={14} /> },
  { id: 'production', label: 'Производство', icon: <Factory size={14} /> },
  { id: 'procurement', label: 'Закупки', icon: <Truck size={14} /> },
  { id: 'documents', label: 'Документы', icon: <ClipboardCheck size={14} /> },
  { id: 'calculator', label: 'Расчёт', icon: <Calculator size={14} /> },
] as const;

type TabId = typeof TABS[number]['id'];

export default function TenderDetailPage() {
  const [searchParams] = useSearchParams();
  const tenderId = Number(searchParams.get('tender'));
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [detail, setDetail] = useState<TenderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetail = useCallback(async () => {
    if (!tenderId || Number.isNaN(tenderId)) {
      setError('Неверный ID тендера');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await tenderExtendedApi.getDetail(tenderId);
      setDetail(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Не удалось загрузить данные тендера');
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--brand-iris)' }} />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <AlertTriangle size={32} style={{ color: '#DC2626' }} />
        <p style={{ color: 'var(--text-secondary)' }}>{error || 'Тендер не найден'}</p>
        <button
          onClick={() => navigate('/portfolio')}
          className="text-sm px-3 py-1.5 rounded-md"
          style={{ background: 'var(--brand-iris)', color: '#fff' }}
        >
          Вернуться к тендерам
        </button>
      </div>
    );
  }

  const { tender, project, tasks, documents, workflows } = detail;

  // Stage badge color
  const stageColors: Record<string, string> = {
    new: '#6B7280',
    qualification: '#6B7280',
    preparation: '#2563EB',
    approval: '#D4AF37',
    submitted: '#0EA5E9',
    auction: '#8B5CF6',
    waiting: '#0EA5E9',
    won: '#0C7205',
    lost: '#DC2626',
    contract: '#0C7205',
  };
  const stageLabels: Record<string, string> = {
    new: 'Новый',
    qualification: 'Квалификация',
    preparation: 'Подготовка',
    approval: 'Согласование',
    submitted: 'Подан',
    auction: 'Аукцион',
    waiting: 'Ожидание',
    won: 'Выигран',
    lost: 'Проигран',
    contract: 'Договор',
  };

  return (
    <div className="w-full px-3 md:px-6 py-4 md:py-6" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/portfolio')}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {tender.name}
              </h1>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: (stageColors[tender.stage] || '#6B7280') + '15',
                  color: stageColors[tender.stage] || '#6B7280',
                  border: `1px solid ${(stageColors[tender.stage] || '#6B7280')}30`,
                }}
              >
                {stageLabels[tender.stage] || tender.stage}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {tender.customer_name} · {tender.project_type} · {tender.region || '—'}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {tender.nmc ? `₽ ${(tender.nmc / 1e6).toFixed(1)} млн` : '—'}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>НМЦ</div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <QuickStat label="Наша цена" value={tender.our_price ? `₽ ${(tender.our_price / 1e6).toFixed(1)} млн` : '—'} color="#2563EB" />
          <QuickStat label="Маржа" value={tender.margin_pct ? `${tender.margin_pct}%` : '—'} color={tender.margin_pct && tender.margin_pct > 20 ? '#0C7205' : '#D4AF37'} />
          <QuickStat label="Вероятность" value={tender.probability ? `${tender.probability}%` : '—'} color={tender.probability && tender.probability >= 50 ? '#0C7205' : '#DC2626'} />
          <QuickStat label="Трудоёмкость" value={tender.calculated_hours ? `${tender.calculated_hours.toLocaleString('ru-RU')} ч` : '—'} color="#6B5B95" />
          <QuickStat label="Команда" value={tender.team_size ? `${tender.team_size} чел` : '—'} color="#4F7A4C" />
          <QuickStat
            label="Дедлайн"
            value={tender.deadline ? `${Math.ceil((new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} дн.` : '—'}
            color={tender.deadline && new Date(tender.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? '#DC2626' : '#6B7280'}
          />
        </div>

        {/* Project link */}
        {project && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}
          >
            <BookOpen size={14} style={{ color: 'var(--brand-iris)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              Связанный проект: <strong style={{ color: 'var(--text-primary)' }}>{project.name}</strong> ({project.code})
            </span>
            <span
              className="ml-auto text-xs px-1.5 py-0.5 rounded"
              style={{
                background: project.status === 'active' ? 'rgba(12,114,5,0.12)' : 'var(--bg-surface)',
                color: project.status === 'active' ? '#0C7205' : 'var(--text-secondary)',
              }}
            >
              {project.status}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b pb-1 overflow-x-auto" style={{ borderColor: 'var(--border-default)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap"
            style={{
              color: activeTab === tab.id ? 'var(--brand-iris)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand-iris)' : '2px solid transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && <TenderOverviewTab tender={tender} tasks={tasks} workflows={workflows} />}
        {activeTab === 'team' && <TenderTeamTab tenderId={tenderId} />}
        {activeTab === 'production' && <TenderProductionTab tenderId={tenderId} />}
        {activeTab === 'procurement' && <TenderProcurementTab tenderId={tenderId} />}
        {activeTab === 'documents' && <TenderDocumentsTab tenderId={tenderId} existingDocuments={documents} />}
        {activeTab === 'calculator' && <TenderCalculatorTab tender={tender} />}
      </div>
    </div>
  );
}

function QuickStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
      <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
