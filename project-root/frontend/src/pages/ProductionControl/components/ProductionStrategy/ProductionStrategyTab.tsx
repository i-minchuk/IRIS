import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { BpmnDiagram } from './BpmnDiagram';
import { DetailPanel } from './DetailPanel';
import { KpiPanel } from './KpiPanel';
import { ProblemsPanel } from './ProblemsPanel';
import { EmployeesPanel } from './EmployeesPanel';
import { getStrategy, seedStrategy, type StrategyData } from '../../api/strategyApi';
import { Button, Badge } from '@/components/ui';
import { Activity, BarChart3, AlertTriangle, Users, Eye, EyeOff, Maximize2, Minimize2, Download } from 'lucide-react';

type SubTab = 'diagram' | 'kpi' | 'problems' | 'employees';

const subTabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: 'diagram', label: 'Схема процесса', icon: Activity },
  { id: 'kpi', label: 'KPI', icon: BarChart3 },
  { id: 'problems', label: 'Проблемы', icon: AlertTriangle },
  { id: 'employees', label: 'Сотрудники', icon: Users },
];

const EMPTY_STRATEGY: StrategyData = { departments: [], employees: [], nodes: [], edges: [], problems: [] };

// Ширина правой панели деталей (редактируется перетаскиванием разделителя)
const PANEL_WIDTH_KEY = 'iris.strategy.panel-width';
const PANEL_DEFAULT_WIDTH = 360;
const PANEL_MIN_WIDTH = 280;
const PANEL_MAX_WIDTH = 640;

const clampPanelWidth = (width: number) =>
  Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, Math.round(width)));

const readSavedPanelWidth = () => {
  const saved = Number(localStorage.getItem(PANEL_WIDTH_KEY));
  return Number.isFinite(saved) && saved > 0 ? clampPanelWidth(saved) : PANEL_DEFAULT_WIDTH;
};

export const ProductionStrategyTab: React.FC = () => {
  const [active, setActive] = useState<SubTab>('diagram');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [highlightBottlenecks, setHighlightBottlenecks] = useState(true);
  const [highlightDuplicates, setHighlightDuplicates] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [panelWidth, setPanelWidth] = useState<number>(readSavedPanelWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelWidthRef = useRef(panelWidth);
  const diagramRowRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setStrategy(await getStrategy());
    } catch {
      setError('Не удалось загрузить данные производственного процесса');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setStrategy(await seedStrategy());
    } catch {
      setError('Не удалось загрузить базовый процесс');
    } finally {
      setSeeding(false);
    }
  };

  const applyPanelWidth = useCallback((width: number) => {
    panelWidthRef.current = width;
    setPanelWidth(width);
  }, []);

  const resetPanelWidth = useCallback(() => {
    applyPanelWidth(PANEL_DEFAULT_WIDTH);
    localStorage.setItem(PANEL_WIDTH_KEY, String(PANEL_DEFAULT_WIDTH));
  }, [applyPanelWidth]);

  // Перетаскивание разделителя: меняет ширину панели, ширина сохраняется
  // в localStorage и восстанавливается при следующем открытии.
  const handleResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const row = diagramRowRef.current;
    if (!row) return;
    setIsResizing(true);

    const onMove = (ev: PointerEvent) => {
      const rect = row.getBoundingClientRect();
      applyPanelWidth(clampPanelWidth(rect.right - ev.clientX));
    };
    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidthRef.current));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [applyPanelWidth]);

  const { departments, employees, nodes, edges, problems } = strategy ?? EMPTY_STRATEGY;

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedId) || null, [nodes, selectedId]);

  const bottleneckCount = nodes.filter((n) => n.issue === 'bottleneck').length;
  const duplicateCount = nodes.filter((n) => n.issue === 'duplicate').length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-220px)] min-h-[540px] flex-col items-center justify-center gap-2 rounded-xl border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)] p-4 text-center">
        <Activity size={32} className="animate-pulse opacity-50 text-[var(--iris-text-muted)]" />
        <p className="text-sm text-[var(--iris-text-muted)]">Загрузка производственного процесса…</p>
      </div>
    );
  }

  if (error && !strategy) {
    return (
      <div className="flex h-[calc(100vh-220px)] min-h-[540px] flex-col items-center justify-center gap-2 rounded-xl border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)] p-4 text-center">
        <AlertTriangle size={32} className="opacity-50 text-[var(--iris-text-muted)]" />
        <p className="text-sm text-[var(--iris-text-muted)]">{error}</p>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Повторить
        </Button>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-[calc(100vh-220px)] min-h-[540px] flex-col items-center justify-center gap-2 rounded-xl border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)] p-4 text-center">
        <Activity size={32} className="opacity-50 text-[var(--iris-text-muted)]" />
        <p className="text-sm text-[var(--iris-text-muted)]">Нет данных о производственном процессе</p>
        <p className="text-xs text-[var(--iris-text-muted)]">
          Схема процесса, KPI, проблемы и загрузка сотрудников появятся после заполнения данных.
        </p>
        <Button variant="primary" size="sm" className="mt-2 gap-1" onClick={handleSeed} disabled={seeding}>
          <Download size={14} />
          {seeding ? 'Загрузка…' : 'Загрузить базовый процесс'}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-3 sm:p-6 lg:p-10'
          : 'h-[calc(100vh-220px)] min-h-[540px]'
      }`}
      style={
        isFullscreen
          ? { background: 'var(--iris-bg-backdrop)', backdropFilter: 'blur(8px)' }
          : undefined
      }
    >
      <div className={`flex h-full flex-col gap-3 ${isFullscreen ? 'rounded-2xl p-5 sm:p-8 overflow-hidden neon-card' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)] p-3">
        <div className="flex items-center gap-1">
          {subTabs.map((t) => {
            const activeTab = active === t.id;
            return (
              <Button
                key={t.id}
                variant={active === t.id ? 'primary' : 'ghost'}
                size="sm"
                className={`gap-1 text-xs ${activeTab ? 'shadow-sm' : ''}`}
                onClick={() => setActive(t.id)}
              >
                <t.icon size={14} />
                {t.label}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={highlightBottlenecks ? 'primary' : 'outline'}
            size="sm"
            className={`h-7 gap-1 text-xs ${highlightBottlenecks ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
            onClick={() => setHighlightBottlenecks((v) => !v)}
          >
            {highlightBottlenecks ? <Eye size={12} /> : <EyeOff size={12} />}
            Узкие места
            <Badge variant="neutral" className="ml-1 text-xs">
              {bottleneckCount}
            </Badge>
          </Button>
          <Button
            variant={highlightDuplicates ? 'primary' : 'outline'}
            size="sm"
            className={`h-7 gap-1 text-xs ${highlightDuplicates ? 'bg-purple-500 hover:bg-purple-600' : ''}`}
            onClick={() => setHighlightDuplicates((v) => !v)}
          >
            {highlightDuplicates ? <Eye size={12} /> : <EyeOff size={12} />}
            Дубли
            <Badge variant="neutral" className="ml-1 text-xs">
              {duplicateCount}
            </Badge>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen ? 'Свернуть (Esc)' : 'Развернуть на весь экран'}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span className="hidden sm:inline">{isFullscreen ? 'Свернуть' : 'На весь экран'}</span>
          </Button>
        </div>
      </div>

      {active === 'diagram' && (
        <div ref={diagramRowRef} className="flex flex-1 gap-3 overflow-hidden">
          <BpmnDiagram
            nodes={nodes}
            edges={edges}
            departments={departments}
            selectedId={selectedId}
            onSelect={setSelectedId}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            highlightBottlenecks={highlightBottlenecks}
            highlightDuplicates={highlightDuplicates}
          />
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Изменить ширину панели деталей"
            onPointerDown={handleResizeStart}
            onDoubleClick={resetPanelWidth}
            className="hidden w-1.5 shrink-0 cursor-col-resize rounded-full transition-colors hover:bg-[var(--iris-accent-blue)] lg:block"
            style={{
              backgroundColor: isResizing ? 'var(--iris-accent-blue)' : 'var(--iris-border-default)',
              touchAction: 'none',
            }}
            title="Потяните, чтобы изменить ширину панели. Двойной клик — сброс"
          />
          <div className="hidden shrink-0 lg:block" style={{ width: panelWidth }}>
            {selectedNode ? (
              <DetailPanel node={selectedNode} employees={employees} departments={departments} onClose={() => setSelectedId(null)} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)] p-4 text-center text-sm text-[var(--iris-text-muted)]">
                <Activity size={32} className="mb-2 opacity-50" />
                <p>Выберите задачу на схеме, чтобы увидеть детали, KPI, документы и ответственных.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {active === 'kpi' && <KpiPanel departments={departments} nodes={nodes} employees={employees} />}

      {active === 'problems' && (
        <ProblemsPanel problems={problems} nodes={nodes} onSelectTask={(id) => { setSelectedId(id); setActive('diagram'); }} />
      )}

      {active === 'employees' && (
        <EmployeesPanel
          employees={employees}
          departments={departments}
          nodes={nodes}
          onChanged={() => void load()}
        />
      )}
      </div>
    </div>
  );
};
