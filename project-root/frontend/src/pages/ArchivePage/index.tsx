// src/pages/ArchivePage/index.tsx
import React, { useEffect, useState } from 'react';
import {
  getArchiveYears,
  getYearArchive,
  ArchiveYearItem,
  YearArchive,
  YearArchiveProject,
} from './api/archiveApi';
import {
  Archive, FolderOpen, FileText, AlertTriangle, ShoppingCart, Users,
  ListChecks, History, ChevronLeft, FileSignature, Send, Package,
} from 'lucide-react';

const TAB_COLOR = '#6B7280';

const PROJECT_STATUS: Record<string, string> = {
  draft: 'Черновик',
  active: 'В работе',
  completed: 'Завершён',
  archived: 'В архиве',
};

const TENDER_STAGE: Record<string, string> = {
  new: 'Новый',
  qualification: 'Квалификация',
  preparation: 'Подготовка',
  approval: 'Согласование',
  submitted: 'Подано',
  auction: 'Торги',
  waiting: 'Ожидание',
  won: 'Выигран',
  lost: 'Проигран',
  contract: 'Контракт',
};

const REQUEST_STATUS: Record<string, string> = {
  draft: 'Черновик',
  submitted: 'Подана',
  manager_review: 'У руководителя',
  director_review: 'У директора',
  approved: 'Согласована',
  rejected: 'Отклонена',
  rfq_sent: 'Запрос цен',
  quotation_received: 'КП получены',
  comparison: 'Сравнение',
  po_issued: 'Заказ оформлен',
  completed: 'Завершена',
};

const ORDER_STATUS: Record<string, string> = {
  draft: 'Черновик',
  submitted: 'Размещён',
  confirmed: 'Подтверждён',
  in_production: 'В производстве',
  shipped: 'Отгружен',
  in_transit: 'В пути',
  customs: 'Таможня',
  delivered: 'Доставлен',
  inspection: 'Приёмка',
  accepted: 'Принят',
  rejected: 'Отклонён',
  completed: 'Завершён',
};

const REMARK_STATUS: Record<string, string> = {
  new: 'Новое',
  in_progress: 'В работе',
  resolved: 'Устранено',
  closed: 'Закрыто',
  rejected: 'Отклонено',
};

const CONTRACT_STATUS: Record<string, string> = {
  draft: 'Черновик',
  legal_review: 'Юр. проверка',
  negotiation: 'Согласование',
  approved: 'Одобрен',
  signed: 'Подписан',
  active: 'Действует',
  completed: 'Завершён',
  terminated: 'Расторгнут',
};

const TIMELINE_TYPE: Record<string, { label: string; icon: React.ElementType }> = {
  tender: { label: 'Тендер', icon: Send },
  contract: { label: 'Договор', icon: FileSignature },
  document: { label: 'Документ', icon: FileText },
  remark: { label: 'Замечание', icon: AlertTriangle },
  purchase_request: { label: 'Заявка', icon: ShoppingCart },
  order: { label: 'Заказ', icon: Package },
};

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU') : '—';

const fmtMoney = (amount?: number | null, currency = 'RUB') =>
  amount == null ? '—' : `${amount.toLocaleString('ru-RU')} ${currency}`;

const Section: React.FC<{ title: string; icon: React.ElementType; count?: number; children: React.ReactNode }> = ({
  title, icon: Icon, count, children,
}) => (
  <div
    className="rounded-xl p-4"
    style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-default)' }}
  >
    <div className="mb-3 flex items-center gap-2">
      <Icon size={16} style={{ color: TAB_COLOR }} />
      <h3 className="text-sm font-bold" style={{ color: 'var(--iris-text-primary)' }}>{title}</h3>
      {count != null && (
        <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--iris-bg-app)', color: 'var(--iris-text-muted)' }}>
          {count}
        </span>
      )}
    </div>
    {children}
  </div>
);

const EmptyRow: React.FC = () => (
  <p className="text-xs" style={{ color: 'var(--iris-text-muted)' }}>Нет данных</p>
);

const ArchivePage: React.FC = () => {
  const [years, setYears] = useState<ArchiveYearItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearData, setYearData] = useState<YearArchive | null>(null);
  const [selectedProject, setSelectedProject] = useState<YearArchiveProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await getArchiveYears();
        setYears(list);
        if (list.length > 0) setSelectedYear(list[0].year);
      } catch {
        setError('Не удалось загрузить архив');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedYear == null) return;
    (async () => {
      try {
        setLoading(true);
        setYearData(await getYearArchive(selectedYear));
        setSelectedProject(null);
      } catch {
        setError('Не удалось загрузить данные года');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedYear]);

  const summary = yearData?.summary;

  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--iris-bg-app)', color: 'var(--iris-text-primary)' }}>
      {/* Шапка + годы */}
      <div className="border-b px-4 py-3 sm:px-6" style={{ background: 'var(--iris-bg-surface-elevated)', borderColor: 'var(--iris-border-default)' }}>
        <div className="mb-2 flex items-center gap-2">
          <Archive size={18} style={{ color: TAB_COLOR }} />
          <h1 className="text-base font-bold">Архив проектов</h1>
          <span className="text-sm" style={{ color: 'var(--iris-text-muted)' }}>
            — все данные по проектам по годам: тендеры, договоры, документы, замечания, МТО, загрузка
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {years.map((y) => (
            <button
              key={y.year}
              onClick={() => setSelectedYear(y.year)}
              className="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
              style={
                selectedYear === y.year
                  ? { background: TAB_COLOR, color: '#fff' }
                  : { background: 'var(--iris-bg-app)', color: 'var(--iris-text-secondary)', border: '1px solid var(--iris-border-default)' }
              }
            >
              {y.year}
              <span className="ml-1 text-xs opacity-80">({y.projects_count})</span>
            </button>
          ))}
          {years.length === 0 && !loading && (
            <span className="text-sm" style={{ color: 'var(--iris-text-muted)' }}>Пока нет данных ни за один год</span>
          )}
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading && (
          <p className="text-sm" style={{ color: 'var(--iris-text-muted)' }}>Загрузка…</p>
        )}
        {error && (
          <p className="text-sm" style={{ color: 'var(--iris-accent-coral)' }}>{error}</p>
        )}

        {!loading && !error && selectedProject && (
          <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} />
        )}

        {!loading && !error && !selectedProject && yearData && (
          <>
            {/* Сводка года */}
            {summary && (
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {[
                  { label: 'Проектов', value: summary.projects_count },
                  { label: 'Тендеров', value: summary.tenders_count },
                  { label: 'Договоров', value: summary.contracts_count },
                  { label: 'Документов', value: summary.documents_count },
                  { label: 'Замечаний', value: summary.remarks_count },
                  { label: 'Заявок МТО', value: summary.purchase_requests_count },
                  { label: 'Заказов', value: summary.orders_count },
                  { label: 'Часов работ', value: summary.workload_hours },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-lg p-3"
                    style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-default)' }}
                  >
                    <div className="text-xs" style={{ color: 'var(--iris-text-muted)' }}>{kpi.label}</div>
                    <div className="text-lg font-bold" style={{ color: 'var(--iris-text-primary)' }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Проекты года */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {yearData.projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className="rounded-xl p-4 text-left transition-shadow hover:shadow-md"
                  style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-default)' }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--iris-text-muted)' }}>{p.code}</span>
                    <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--iris-bg-app)', color: 'var(--iris-text-secondary)' }}>
                      {PROJECT_STATUS[p.status] || p.status}
                    </span>
                  </div>
                  <div className="mb-1 text-sm font-bold" style={{ color: 'var(--iris-text-primary)' }}>{p.name}</div>
                  <div className="mb-3 text-xs" style={{ color: 'var(--iris-text-muted)' }}>
                    {p.customer_name || '—'} · создан {fmtDate(p.created_at)}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'var(--iris-text-secondary)' }}>
                    <span title="Тендеры"><Send size={12} className="mr-0.5 inline" />{p.tenders.length}</span>
                    <span title="Договоры"><FileSignature size={12} className="mr-0.5 inline" />{p.contracts.length}</span>
                    <span title="Документы"><FileText size={12} className="mr-0.5 inline" />{p.documents.length}</span>
                    <span title="Замечания"><AlertTriangle size={12} className="mr-0.5 inline" />{p.remarks.length}</span>
                    <span title="Заказы"><Package size={12} className="mr-0.5 inline" />{p.orders.length}</span>
                    <span title="Задачи"><ListChecks size={12} className="mr-0.5 inline" />{p.tasks_total}</span>
                  </div>
                </button>
              ))}
              {yearData.projects.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-2 py-16 text-center">
                  <FolderOpen size={40} style={{ color: 'var(--iris-text-muted)', opacity: 0.5 }} />
                  <p className="text-sm" style={{ color: 'var(--iris-text-muted)' }}>
                    За {yearData.year} год проектов нет
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ProjectDetail: React.FC<{ project: YearArchiveProject; onBack: () => void }> = ({ project, onBack }) => (
  <div className="flex flex-col gap-4">
    <button
      onClick={onBack}
      className="flex w-fit items-center gap-1 text-sm transition-colors hover:opacity-80"
      style={{ color: 'var(--iris-text-muted)' }}
    >
      <ChevronLeft size={16} /> К списку проектов
    </button>

    <div className="rounded-xl p-4" style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-default)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs" style={{ color: 'var(--iris-text-muted)' }}>{project.code}</div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--iris-text-primary)' }}>{project.name}</h2>
          <div className="text-sm" style={{ color: 'var(--iris-text-secondary)' }}>
            Заказчик: {project.customer_name || '—'} · Создан {fmtDate(project.created_at)}
            {project.planned_finish && <> · Плановая готовность {fmtDate(project.planned_finish)}</>}
          </div>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--iris-bg-app)', color: 'var(--iris-text-secondary)' }}>
          {PROJECT_STATUS[project.status] || project.status}
        </span>
      </div>
    </div>

    {/* Таймлайн: проект с момента тендера */}
    <Section title="Хронология проекта" icon={History} count={project.timeline.length}>
      {project.timeline.length === 0 ? <EmptyRow /> : (
        <div className="flex flex-col gap-1">
          {project.timeline.map((e, i) => {
            const t = TIMELINE_TYPE[e.type] || { label: e.type, icon: FileText };
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-xs" style={{ background: 'var(--iris-bg-app)' }}>
                <t.icon size={14} style={{ color: TAB_COLOR, flexShrink: 0 }} />
                <span className="w-24 shrink-0" style={{ color: 'var(--iris-text-muted)' }}>{fmtDate(e.date)}</span>
                <span style={{ color: 'var(--iris-text-primary)' }}>{e.title}</span>
              </div>
            );
          })}
        </div>
      )}
    </Section>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {/* Тендеры */}
      <Section title="Тендеры" icon={Send} count={project.tenders.length}>
        {project.tenders.length === 0 ? <EmptyRow /> : project.tenders.map((t) => (
          <div key={t.id} className="mb-2 rounded-lg p-2 text-xs" style={{ background: 'var(--iris-bg-app)' }}>
            <div className="font-semibold" style={{ color: 'var(--iris-text-primary)' }}>
              {t.kp_number ? `${t.kp_number} · ` : ''}{t.name}
            </div>
            <div style={{ color: 'var(--iris-text-muted)' }}>
              {t.customer_name} · {TENDER_STAGE[t.stage] || t.stage} · НМЦ {fmtMoney(t.nmc)} · Наша цена {fmtMoney(t.our_price)}
            </div>
          </div>
        ))}
      </Section>

      {/* Договоры */}
      <Section title="Договоры" icon={FileSignature} count={project.contracts.length}>
        {project.contracts.length === 0 ? <EmptyRow /> : project.contracts.map((c) => (
          <div key={c.id} className="mb-2 rounded-lg p-2 text-xs" style={{ background: 'var(--iris-bg-app)' }}>
            <div className="font-semibold" style={{ color: 'var(--iris-text-primary)' }}>{c.number} · {c.title}</div>
            <div style={{ color: 'var(--iris-text-muted)' }}>
              {c.customer_name} · {CONTRACT_STATUS[c.status] || c.status} · {fmtMoney(c.amount, c.currency)} · {fmtDate(c.start_date)} — {fmtDate(c.end_date)}
            </div>
          </div>
        ))}
      </Section>

      {/* Документы */}
      <Section title="Документы" icon={FileText} count={project.documents.length}>
        {project.documents.length === 0 ? <EmptyRow /> : project.documents.map((d) => (
          <div key={d.id} className="mb-2 flex items-center justify-between gap-2 rounded-lg p-2 text-xs" style={{ background: 'var(--iris-bg-app)' }}>
            <span style={{ color: 'var(--iris-text-primary)' }}>{d.number} · {d.name}</span>
            <span style={{ color: 'var(--iris-text-muted)' }}>{d.doc_type} · {d.status} · {fmtDate(d.created_at)}</span>
          </div>
        ))}
      </Section>

      {/* Замечания */}
      <Section title="Замечания" icon={AlertTriangle} count={project.remarks.length}>
        {project.remarks.length === 0 ? <EmptyRow /> : (
          <>
            <div className="mb-2 flex flex-wrap gap-1">
              {Object.entries(project.remarks_by_status).map(([st, n]) => (
                <span key={st} className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--iris-bg-surface-elevated)', color: 'var(--iris-text-secondary)', border: '1px solid var(--iris-border-default)' }}>
                  {REMARK_STATUS[st] || st}: {n}
                </span>
              ))}
            </div>
            {project.remarks.map((r) => (
              <div key={r.id} className="mb-2 rounded-lg p-2 text-xs" style={{ background: 'var(--iris-bg-app)' }}>
                <div className="font-semibold" style={{ color: 'var(--iris-text-primary)' }}>{r.title}</div>
                <div style={{ color: 'var(--iris-text-muted)' }}>
                  {REMARK_STATUS[r.status] || r.status} · {r.priority} · {r.author || '—'} · {fmtDate(r.created_at)}
                  {r.resolved_at && <> · устранено {fmtDate(r.resolved_at)}</>}
                </div>
              </div>
            ))}
          </>
        )}
      </Section>

      {/* МТО: заявки и заказы */}
      <Section title="Поставка МТО" icon={ShoppingCart} count={project.purchase_requests.length + project.orders.length}>
        {project.purchase_requests.length === 0 && project.orders.length === 0 ? <EmptyRow /> : (
          <>
            {project.purchase_requests.map((rq) => (
              <div key={`pr-${rq.id}`} className="mb-2 rounded-lg p-2 text-xs" style={{ background: 'var(--iris-bg-app)' }}>
                <div className="font-semibold" style={{ color: 'var(--iris-text-primary)' }}>
                  Заявка {rq.number || rq.id} · {rq.title}
                </div>
                <div style={{ color: 'var(--iris-text-muted)' }}>
                  {REQUEST_STATUS[rq.status] || rq.status} · {fmtMoney(rq.amount)} · {fmtDate(rq.created_at)}
                </div>
              </div>
            ))}
            {project.orders.map((o) => (
              <div key={`po-${o.id}`} className="mb-2 rounded-lg p-2 text-xs" style={{ background: 'var(--iris-bg-app)' }}>
                <div className="font-semibold" style={{ color: 'var(--iris-text-primary)' }}>
                  Заказ {o.number} · {o.supplier_name}
                </div>
                <div style={{ color: 'var(--iris-text-muted)' }}>
                  {ORDER_STATUS[o.status] || o.status} · {fmtMoney(o.amount)} · поставка {fmtDate(o.delivery_date)}
                </div>
              </div>
            ))}
          </>
        )}
      </Section>

      {/* Загрузка персонала */}
      <Section title="Загрузка персонала" icon={Users} count={project.workload.length}>
        {project.workload.length === 0 ? <EmptyRow /> : project.workload.map((w) => {
          const max = project.workload[0]?.hours || 1;
          return (
            <div key={w.user_id} className="mb-2 text-xs">
              <div className="mb-0.5 flex justify-between">
                <span style={{ color: 'var(--iris-text-primary)' }}>{w.name}</span>
                <span style={{ color: 'var(--iris-text-muted)' }}>{w.hours} ч</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'var(--iris-bg-app)' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (w.hours / max) * 100)}%`, background: TAB_COLOR }} />
              </div>
            </div>
          );
        })}
      </Section>

      {/* Задачи */}
      <Section title="Задачи" icon={ListChecks} count={project.tasks_total}>
        {project.tasks_total === 0 ? <EmptyRow /> : (
          <div className="flex flex-wrap gap-1">
            {Object.entries(project.tasks_by_status).map(([st, n]) => (
              <span key={st} className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--iris-bg-surface-elevated)', color: 'var(--iris-text-secondary)', border: '1px solid var(--iris-border-default)' }}>
                {st}: {n}
              </span>
            ))}
          </div>
        )}
      </Section>
    </div>
  </div>
);

export default ArchivePage;
