import React, { useMemo, useState, useEffect } from 'react';
import { BpmnDiagram } from './BpmnDiagram';
import { DetailPanel } from './DetailPanel';
import { KpiPanel } from './KpiPanel';
import { ProblemsPanel } from './ProblemsPanel';
import { EmployeesPanel } from './EmployeesPanel';
import { DEPARTMENTS, EMPLOYEES, BPMN_NODES, BPMN_EDGES, PROBLEMS } from './data';
import { Button, Badge } from '@/components/ui';
import { Activity, BarChart3, AlertTriangle, Users, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';

type SubTab = 'diagram' | 'kpi' | 'problems' | 'employees';

const subTabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: 'diagram', label: 'Схема процесса', icon: Activity },
  { id: 'kpi', label: 'KPI', icon: BarChart3 },
  { id: 'problems', label: 'Проблемы', icon: AlertTriangle },
  { id: 'employees', label: 'Сотрудники', icon: Users },
];

export const ProductionStrategyTab: React.FC = () => {
  const [active, setActive] = useState<SubTab>('diagram');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [highlightBottlenecks, setHighlightBottlenecks] = useState(true);
  const [highlightDuplicates, setHighlightDuplicates] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedNode = useMemo(() => BPMN_NODES.find((n) => n.id === selectedId) || null, [selectedId]);

  const bottleneckCount = BPMN_NODES.filter((n) => n.issue === 'bottleneck').length;
  const duplicateCount = BPMN_NODES.filter((n) => n.issue === 'duplicate').length;

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

  if (BPMN_NODES.length === 0) {
    return (
      <div className="flex h-[calc(100vh-220px)] min-h-[540px] flex-col items-center justify-center gap-2 rounded-xl border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)] p-4 text-center">
        <Activity size={32} className="opacity-50 text-[var(--iris-text-muted)]" />
        <p className="text-sm text-[var(--iris-text-muted)]">Нет данных о производственном процессе</p>
        <p className="text-xs text-[var(--iris-text-muted)]">
          Схема процесса, KPI, проблемы и загрузка сотрудников появятся после подключения источника данных.
        </p>
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
        <div className="flex flex-1 gap-3 overflow-hidden">
          <BpmnDiagram
            nodes={BPMN_NODES}
            edges={BPMN_EDGES}
            selectedId={selectedId}
            onSelect={setSelectedId}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            highlightBottlenecks={highlightBottlenecks}
            highlightDuplicates={highlightDuplicates}
          />
          <div className="hidden w-[360px] shrink-0 lg:block">
            {selectedNode ? (
              <DetailPanel node={selectedNode} employees={EMPLOYEES} onClose={() => setSelectedId(null)} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)] p-4 text-center text-sm text-[var(--iris-text-muted)]">
                <Activity size={32} className="mb-2 opacity-50" />
                <p>Выберите задачу на схеме, чтобы увидеть детали, KPI, документы и ответственных.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {active === 'kpi' && <KpiPanel departments={DEPARTMENTS} nodes={BPMN_NODES} employees={EMPLOYEES} />}

      {active === 'problems' && (
        <ProblemsPanel problems={PROBLEMS} nodes={BPMN_NODES} onSelectTask={(id) => { setSelectedId(id); setActive('diagram'); }} />
      )}

      {active === 'employees' && <EmployeesPanel employees={EMPLOYEES} departments={DEPARTMENTS} nodes={BPMN_NODES} />}
      </div>
    </div>
  );
};
