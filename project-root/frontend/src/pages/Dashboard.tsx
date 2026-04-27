import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  analyticsApi,
  type KpiTile,
  type PortfolioData,
  type AlertsData,
  type TenderPipelineData,
  type DocumentsByProjectData,
  type SqcdpData,
  type ShipmentCalendarData,
  type SparklinesData,
} from '@/features/analytics/api/analytics';
import { resourcesApi, type HeatmapData, type HeatmapEmployee } from '@/features/resources/api/resources';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { KPITile } from '@/features/analytics/components/KPITile';
import { ResourceHeatmap } from '@/features/resources/components/ResourceHeatmap';
import { EmployeeCardModal } from '@/features/resources/components/EmployeeCardModal';
import { ProjectPortfolio } from '@/features/analytics/components/ProjectPortfolio';
import { TopAlerts } from '@/features/analytics/components/TopAlerts';
import { TenderPipeline } from '@/features/analytics/components/TenderPipeline';
import { DocumentKanban } from '@/features/analytics/components/DocumentKanban';
import { ProductionSQCDP } from '@/features/analytics/components/ProductionSQCDP';
import { ShipmentCalendar } from '@/features/analytics/components/ShipmentCalendar';
import { SparklinePanel } from '@/features/analytics/components/SparklinePanel';
import { AlertTriangle, FolderOpen, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

function CollapsibleSection({ title, children, defaultOpen = true, className = '' }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={className}>
      <button
        onClick={() => setOpen(!open)}
        className="mb-2 flex w-full items-center justify-between sm:hidden"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title}
        </span>
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>
      <div className={`${open ? 'block' : 'hidden'} sm:block`}>{children}</div>
    </section>
  );
}

export default function Dashboard() {
  const [tiles, setTiles] = useState<KpiTile[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [alerts, setAlerts] = useState<AlertsData | null>(null);
  const [tenderPipeline, setTenderPipeline] = useState<TenderPipelineData | null>(null);
  const [documentsByProject, setDocumentsByProject] = useState<DocumentsByProjectData | null>(null);
  const [sqcdp, setSqcdp] = useState<SqcdpData | null>(null);
  const [shipments, setShipments] = useState<ShipmentCalendarData | null>(null);
  const [sparklines, setSparklines] = useState<SparklinesData | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<HeatmapEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('access_token');
  const { isConnected, lastMessage } = useWebSocket(token);

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [
        kpiRes,
        heatmapRes,
        portfolioRes,
        alertsRes,
        tenderRes,
        docsRes,
        sqcdpRes,
        shipRes,
        sparkRes,
      ] = await Promise.all([
        analyticsApi.getKpiTiles(),
        resourcesApi.getHeatmap(),
        analyticsApi.getPortfolio(),
        analyticsApi.getAlerts(),
        analyticsApi.getTenderPipeline(),
        analyticsApi.getDocumentsByProject(),
        analyticsApi.getProductionSqcdp(),
        analyticsApi.getShipmentsCalendar(),
        analyticsApi.getSparklines(),
      ]);
      setTiles(kpiRes.data.tiles);
      setHeatmap(heatmapRes.data);
      setPortfolio(portfolioRes.data);
      setAlerts(alertsRes.data);
      setTenderPipeline(tenderRes.data);
      setDocumentsByProject(docsRes.data);
      setSqcdp(sqcdpRes.data);
      setShipments(shipRes.data);
      setSparklines(sparkRes.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (!silent) setError('Не удалось загрузить данные дашборда');
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Auto-refresh intervals
  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];

    // KPI + Documents + Shipments — 5 мин
    intervals.push(setInterval(() => loadAll(true), 5 * 60 * 1000));
    // Resources — 15 мин
    intervals.push(setInterval(() => resourcesApi.getHeatmap().then((r) => setHeatmap(r.data)).catch(console.error), 15 * 60 * 1000));
    // Tenders — 10 мин
    intervals.push(setInterval(() => analyticsApi.getTenderPipeline().then((r) => setTenderPipeline(r.data)).catch(console.error), 10 * 60 * 1000));
    // Production — 2 мин
    intervals.push(setInterval(() => analyticsApi.getProductionSqcdp().then((r) => setSqcdp(r.data)).catch(console.error), 2 * 60 * 1000));
    // Shipments — 1 мин
    intervals.push(setInterval(() => analyticsApi.getShipmentsCalendar().then((r) => setShipments(r.data)).catch(console.error), 1 * 60 * 1000));

    return () => intervals.forEach(clearInterval);
  }, [loadAll]);

  // WebSocket real-time updates
  useEffect(() => {
    if (lastMessage?.type === 'dashboard_update') {
      loadAll(true);
    }
  }, [lastMessage, loadAll]);

  const handleTileClick = (tile: KpiTile) => {
    if (tile.id === 'overdue_docs') {
      navigate('/documents');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <FolderOpen className="animate-pulse" size={24} />
          <span className="text-sm">Загрузка дашборда…</span>
        </div>
      </div>
    );
  }

  if (error && tiles.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-xl border border-rose-500/30 bg-white dark:bg-[#1e293b] p-6 max-w-md shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
            <div>
              <div className="text-gray-900 dark:text-white font-medium text-sm">Ошибка загрузки</div>
              <div className="text-gray-500 dark:text-slate-400 text-xs mt-1">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Единый центр управления
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Обзор потока ключевых показателей проектной организации
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              live
            </span>
          )}
          {lastUpdated && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              обновлено {lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => loadAll()}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-3 w-3" />
            Обновить
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <CollapsibleSection title="KPI">
        <section className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {tiles.map((tile) => (
            <KPITile
              key={tile.id}
              label={tile.label}
              value={tile.value}
              trend={tile.trend}
              trend_direction={tile.trend_direction}
              status={tile.status}
              subtext={tile.subtext}
              clickable={tile.clickable}
              onClick={() => handleTileClick(tile)}
            />
          ))}
        </section>
      </CollapsibleSection>

      {/* Alerts + Portfolio row */}
      <CollapsibleSection title="Портфель и тревоги">
        <section className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ProjectPortfolio data={portfolio} loading={false} />
          </div>
          <div className="xl:col-span-1">
            <TopAlerts data={alerts} loading={false} />
          </div>
        </section>
      </CollapsibleSection>

      {/* Resource Heatmap */}
      <CollapsibleSection title="Загруженность персонала">
        {heatmap && (
          <ResourceHeatmap departments={heatmap.departments} onEmployeeClick={setSelectedEmployee} />
        )}
      </CollapsibleSection>

      {/* Tender Pipeline */}
      <CollapsibleSection title="Тендерный pipeline">
        <TenderPipeline data={tenderPipeline} loading={false} />
      </CollapsibleSection>

      {/* Document Kanban */}
      <CollapsibleSection title="Документооборот">
        <DocumentKanban data={documentsByProject} loading={false} />
      </CollapsibleSection>

      {/* Production SQCDP */}
      <CollapsibleSection title="Производство SQCDP">
        <ProductionSQCDP data={sqcdp} loading={false} />
      </CollapsibleSection>

      {/* Shipment Calendar */}
      <CollapsibleSection title="Отгрузки и логистика">
        <ShipmentCalendar data={shipments} loading={false} />
      </CollapsibleSection>

      {/* Sparkline Panel */}
      <CollapsibleSection title="Тренды">
        <SparklinePanel data={sparklines} loading={false} />
      </CollapsibleSection>

      {/* Employee Card Modal */}
      {selectedEmployee && (
        <EmployeeCardModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      )}
    </div>
  );
}
