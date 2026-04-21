import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPortfolio } from '../api/projects';
import type { Project, PortfolioSummary } from '../types';
import StatusBadge from '../components/StatusBadge';
import SPIIndicator from '../components/SPIIndicator';
import DailyQuestWidget from '../components/DailyQuestWidget';
import {
  FolderOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Card, Button } from '../components/ui';

type StatColor = 'docs' | 'leaders' | 'audit' | 'engineering';

const MOCK_SUMMARY: PortfolioSummary = {
  total: 5,
  active: 3,
  at_risk: 1,
  completed: 1,
};

const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    code: 'PRJ-001',
    name: 'Модернизация НПЗ',
    status: 'active',
    customer: 'Газпром',
    start_date: '2026-01-15',
    end_date_plan: '2026-12-31',
    total_tasks: 45,
    completed_tasks: 28,
    spi: 0.92,
    risk_level: 'medium',
  },
  {
    id: 2,
    code: 'PRJ-002',
    name: 'Строительство ЛЭП',
    status: 'active',
    customer: 'РусГидро',
    start_date: '2026-02-01',
    end_date_plan: '2026-09-30',
    total_tasks: 30,
    completed_tasks: 25,
    spi: 1.05,
    risk_level: 'low',
  },
  {
    id: 3,
    code: 'PRJ-003',
    name: 'Реконструкция котельной',
    status: 'active',
    customer: 'ТГК-1',
    start_date: '2026-03-01',
    end_date_plan: '2026-11-15',
    total_tasks: 20,
    completed_tasks: 5,
    spi: 0.62,
    risk_level: 'high',
  },
];

function normalizeSummary(input: PortfolioSummary | null | undefined): PortfolioSummary {
  const raw = (input ?? {}) as Partial<PortfolioSummary>;

  return {
    total: Number(raw.total ?? 0),
    active: Number(raw.active ?? 0),
    at_risk: Number(raw.at_risk ?? 0),
    completed: Number(raw.completed ?? 0),
  };
}

function normalizeProjects(input: Project[] | null | undefined): Project[] {
  if (!Array.isArray(input)) return MOCK_PROJECTS;

  return input.map((item, index) => {
    const raw = (item ?? {}) as Partial<Project>;

    return {
      id: raw.id ?? index,
      code: raw.code ?? '—',
      name: raw.name ?? `Проект ${index + 1}`,
      status: raw.status ?? 'active',
      customer: raw.customer ?? '—',
      start_date: raw.start_date ?? '',
      end_date_plan: raw.end_date_plan ?? '',
      total_tasks: raw.total_tasks ?? 0,
      completed_tasks: raw.completed_tasks ?? 0,
      spi: raw.spi ?? 0,
      risk_level: raw.risk_level ?? 'low',
    } as Project;
  });
}

export default function Dashboard() {
  const [summary, setSummary] = useState<PortfolioSummary>(MOCK_SUMMARY);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    getPortfolio()
      .then((d) => {
        if (!mounted) return;

        setSummary(normalizeSummary(d?.summary));
        setProjects(normalizeProjects(d?.projects));
        setLoadError(null);
      })
      .catch((err) => {
        if (!mounted) return;

        setSummary(MOCK_SUMMARY);
        setProjects(MOCK_PROJECTS);
        setLoadError(
          err?.message ??
            'Не удалось загрузить данные портфеля. Показаны резервные значения.'
        );
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const safeSummary = useMemo(
    () => normalizeSummary(summary ?? MOCK_SUMMARY),
    [summary]
  );

  const safeProjects = useMemo(
    () => normalizeProjects(projects ?? MOCK_PROJECTS),
    [projects]
  );

  const stats: Array<{
    label: string;
    value: number;
    icon: typeof FolderOpen;
    color: StatColor;
    desc: string;
  }> = [
    {
      label: 'Всего проектов',
      value: safeSummary.total ?? 0,
      icon: FolderOpen,
      color: 'docs',
      desc: 'За всё время',
    },
    {
      label: 'Активных',
      value: safeSummary.active ?? 0,
      icon: Clock,
      color: 'leaders',
      desc: 'В разработке',
    },
    {
      label: 'В зоне риска',
      value: safeSummary.at_risk ?? 0,
      icon: AlertTriangle,
      color: 'audit',
      desc: 'Требуют внимания',
    },
    {
      label: 'Завершено',
      value: safeSummary.completed ?? 0,
      icon: CheckCircle,
      color: 'engineering',
      desc: 'Успешно закрыты',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Портфолио проектов
          </h1>
          <p
            className="mt-2 max-w-2xl text-sm leading-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            Обзор состояния проектного портфеля на{' '}
            {new Date().toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm">
            Аналитика
          </Button>
          <Button size="sm" onClick={() => navigate('/documents/new')}>
            + Добавить проект
          </Button>
        </div>
      </section>

      {loadError ? (
        <Card
          className="px-4 py-3"
          style={{
            border: '1px solid color-mix(in srgb, var(--accent-audit) 28%, var(--border-default))',
            backgroundColor: 'color-mix(in srgb, var(--accent-audit) 10%, var(--bg-surface))',
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              style={{ color: 'var(--accent-audit)' }}
              className="mt-0.5 shrink-0"
            />
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Данные загружены с резервными значениями
              </div>
              <div className="mt-1 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                {loadError}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            color={s.color}
            desc={s.desc}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <Card
          className="overflow-hidden p-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div>
              <h2
                className="text-base font-semibold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Последние проекты
              </h2>
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Актуальный статус проектного портфеля
              </p>
            </div>

            <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}>
              Все проекты
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                <tr>
                  <th
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Проект
                  </th>
                  <th
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Заказчик
                  </th>
                  <th
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Прогресс
                  </th>
                  <th
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    SPI
                  </th>
                  <th
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Риск
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Загрузка данных...
                    </td>
                  </tr>
                ) : safeProjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Нет активных проектов
                    </td>
                  </tr>
                ) : (
                  safeProjects.map((p) => {
                    const totalTasks = p.total_tasks ?? 0;
                    const completedTasks = p.completed_tasks ?? 0;
                    const progress = Math.round(
                      totalTasks ? (completedTasks / totalTasks) * 100 : 0
                    );

                    return (
                      <tr
                        key={p.id}
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="cursor-pointer transition-colors duration-150 hover:bg-white/[0.02]"
                        style={{ borderTop: '1px solid var(--border-light)' }}
                      >
                        <td className="px-5 py-4">
                          <div
                            className="text-sm font-medium leading-5"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {p.name}
                          </div>
                          <div
                            className="mt-1 text-[11px] font-mono uppercase tracking-wide"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            {p.code}
                          </div>
                        </td>

                        <td
                          className="px-5 py-4 text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {p.customer}
                        </td>

                        <td className="px-5 py-4">
                          <div
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {progress}%
                          </div>
                          <div
                            className="mt-1 h-1.5 w-24 overflow-hidden rounded-full"
                            style={{ backgroundColor: 'var(--bg-surface-3)' }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${progress}%`,
                                background:
                                  'linear-gradient(90deg, var(--accent-docs), var(--accent-leaders))',
                              }}
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <SPIIndicator value={p.spi} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={p.risk_level} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card
            className="p-5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  className="text-base font-semibold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Общая эффективность
                </h3>
                <p
                  className="mt-2 text-sm leading-6"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Средний SPI по всем проектам вырос на 4.2% за прошлую неделю.
                </p>
              </div>

              <div
                className="rounded-xl px-3 py-1.5 text-xs font-semibold"
                style={{
                  color: 'var(--accent-leaders)',
                  backgroundColor:
                    'color-mix(in srgb, var(--accent-leaders) 14%, var(--bg-surface-2))',
                }}
              >
                +4.2%
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <MetricRow
                label="Активные проекты"
                value={safeSummary.active}
                total={safeSummary.total}
                accent="var(--accent-docs)"
              />
              <MetricRow
                label="Завершённые"
                value={safeSummary.completed}
                total={safeSummary.total}
                accent="var(--accent-leaders)"
              />
              <MetricRow
                label="Риски"
                value={safeSummary.at_risk}
                total={safeSummary.total}
                accent="var(--accent-audit)"
              />
            </div>

            <div className="mt-5">
              <Button variant="outline" size="sm" className="w-full">
                <span className="inline-flex items-center gap-2">
                  Смотреть отчет
                  <ArrowUpRight size={14} />
                </span>
              </Button>
            </div>
          </Card>

          <DailyQuestWidget />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  desc,
}: {
  label: string;
  value: number;
  icon: typeof FolderOpen;
  color: StatColor;
  desc: string;
}) {
  const accentMap: Record<StatColor, string> = {
    docs: 'var(--accent-docs)',
    leaders: 'var(--accent-leaders)',
    audit: 'var(--accent-audit)',
    engineering: 'var(--accent-engineering)',
  };

  const bgMap: Record<StatColor, string> = {
    docs: 'color-mix(in srgb, var(--accent-docs) 12%, var(--bg-surface-2))',
    leaders: 'color-mix(in srgb, var(--accent-leaders) 12%, var(--bg-surface-2))',
    audit: 'color-mix(in srgb, var(--accent-audit) 12%, var(--bg-surface-2))',
    engineering: 'color-mix(in srgb, var(--accent-engineering) 12%, var(--bg-surface-2))',
  };

  return (
    <Card
      className="p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </div>
          <div
            className="mt-3 text-3xl font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {value}
          </div>
          <div className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {desc}
          </div>
        </div>

        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundColor: bgMap[color],
            color: accentMap[color],
            border: '1px solid var(--border-default)',
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  total,
  accent,
}: {
  label: string;
  value: number;
  total: number;
  accent: string;
}) {
  const width = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {value}
        </span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--bg-surface-3)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${width}%`,
            backgroundColor: accent,
          }}
        />
      </div>
    </div>
  );
}