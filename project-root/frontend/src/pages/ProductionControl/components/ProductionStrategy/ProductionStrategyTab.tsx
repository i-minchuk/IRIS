import React, { useMemo, useState } from 'react';
import { BpmnDiagram } from './BpmnDiagram';
import { DetailPanel } from './DetailPanel';
import { KpiPanel } from './KpiPanel';
import { ProblemsPanel } from './ProblemsPanel';
import { EmployeesPanel } from './EmployeesPanel';
import { DEPARTMENTS, EMPLOYEES, BPMN_NODES, BPMN_EDGES, PROBLEMS } from './data';
import { Button, Badge } from '@/components/ui';
import { Activity, BarChart3, AlertTriangle, Users, Eye, EyeOff } from 'lucide-react';

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

  const selectedNode = useMemo(() => BPMN_NODES.find((n) => n.id === selectedId) || null, [selectedId]);

  const bottleneckCount = BPMN_NODES.filter((n) => n.issue === 'bottleneck').length;
  const duplicateCount = BPMN_NODES.filter((n) => n.issue === 'duplicate').length;

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[540px] flex-col gap-3">
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
  );
};
