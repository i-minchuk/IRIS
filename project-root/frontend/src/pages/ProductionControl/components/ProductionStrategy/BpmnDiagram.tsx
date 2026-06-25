import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { BpmnEdge, BpmnNode, IssueType } from './types';
import { DEPARTMENTS, DEPARTMENT_BY_KEY, OE, GS, BD, BPMN_NODES, BPMN_EDGES } from './data';
import { AlertTriangle, GitMerge } from 'lucide-react';

interface BpmnDiagramProps {
  nodes?: BpmnNode[];
  edges?: BpmnEdge[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  highlightBottlenecks?: boolean;
  highlightDuplicates?: boolean;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}

const MARGIN = 24;
const TOTAL_W = GS + OE;
const TOTAL_H = BD;

export const BpmnDiagram: React.FC<BpmnDiagramProps> = ({
  nodes = BPMN_NODES,
  edges = BPMN_EDGES,
  selectedId,
  onSelect,
  highlightBottlenecks = true,
  highlightDuplicates = true,
  hoveredId,
  onHover,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState({ w: 1200, h: 600 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: BpmnNode } | null>(null);

  const fit = (size = container) => {
    const scale = Math.min(
      size.w / (TOTAL_W + MARGIN),
      size.h / (TOTAL_H + MARGIN)
    );
    const clamped = Math.max(0.45, Math.min(2.5, scale));
    return {
      x: (size.w - TOTAL_W * clamped) / 2,
      y: (size.h - TOTAL_H * clamped) / 2,
      scale: clamped,
    };
  };

  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const size = { w: Math.max(400, rect.width), h: Math.max(300, rect.height) };
      setContainer(size);
      setTransform(fit(size));
    };
    update();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } else {
      window.addEventListener('resize', update);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', update);
    };
  }, []);

  const issueVisible = (issue: IssueType) => {
    if (issue === 'bottleneck') return highlightBottlenecks;
    if (issue === 'duplicate') return highlightDuplicates;
    return true;
  };

  const issueFill = (issue: IssueType) => {
    if (issue === 'bottleneck') return '#fff7ed';
    if (issue === 'duplicate') return '#fdf4ff';
    return '#ffffff';
  };

  const issueStroke = (issue: IssueType) => {
    if (issue === 'bottleneck') return '#f97316';
    if (issue === 'duplicate') return '#a855f7';
    return '#334155';
  };

  const issueIcon = (issue: IssueType) => {
    if (issue === 'bottleneck') return <AlertTriangle size={12} className="text-orange-500" />;
    if (issue === 'duplicate') return <GitMerge size={12} className="text-purple-500" />;
    return null;
  };

  const deptIndex = useMemo(() => {
    const map = new Map<string, number>();
    DEPARTMENTS.forEach((d, i) => map.set(d.key, i));
    return map;
  }, []);

  const getConnectionPoints = (from: BpmnNode, to: BpmnNode): { x1: number; y1: number; x2: number; y2: number } => {
    const cx1 = from.x + from.w / 2;
    const cy1 = from.y + from.h / 2;
    const cx2 = to.x + to.w / 2;
    const cy2 = to.y + to.h / 2;
    const dx = cx2 - cx1;
    const dy = cy2 - cy1;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let x1 = cx1;
    let y1 = cy1;
    let x2 = cx2;
    let y2 = cy2;

    if (absDx > absDy) {
      x1 = dx > 0 ? from.x + from.w : from.x;
      x2 = dx > 0 ? to.x : to.x + to.w;
    } else {
      y1 = dy > 0 ? from.y + from.h : from.y;
      y2 = dy > 0 ? to.y : to.y + to.h;
    }
    return { x1, y1, x2, y2 };
  };

  const buildPath = (from: BpmnNode, to: BpmnNode): string => {
    const fromIdx = deptIndex.get(from.dept) ?? 0;
    const toIdx = deptIndex.get(to.dept) ?? 0;
    const { x1, y1, x2, y2 } = getConnectionPoints(from, to);
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);

    // cross-lane orthogonal routing
    if (fromIdx !== toIdx) {
      const top = Math.min(fromIdx, toIdx);
      const bottom = Math.max(fromIdx, toIdx);
      const upperLane = DEPARTMENTS[top];
      const lowerLane = DEPARTMENTS[bottom];
      const midY = (upperLane.laneY + upperLane.laneH + lowerLane.laneY) / 2;
      return `M ${x1} ${y1} V ${midY} H ${x2} V ${y2}`;
    }

    if (dx > dy) {
      const midX = (x1 + x2) / 2;
      return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
    }
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  };

  const nodeById = useMemo(() => {
    const map = new Map<string, BpmnNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.bpmn-task, .bpmn-event, .bpmn-gateway')) return;
    setDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setTransform({ ...transform, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(2.5, Math.max(0.45, transform.scale * scaleFactor));
    const x = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
    const y = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
    setTransform({ x, y, scale: newScale });
  };

  const zoomTo = (factor: number) => {
    const newScale = Math.min(2.5, Math.max(0.45, transform.scale * factor));
    const cx = container.w / 2;
    const cy = container.h / 2;
    const x = cx - (cx - transform.x) * (newScale / transform.scale);
    const y = cy - (cy - transform.y) * (newScale / transform.scale);
    setTransform({ x, y, scale: newScale });
  };

  const zoomIn = () => zoomTo(1.15);
  const zoomOut = () => zoomTo(1 / 1.15);
  const reset = () => setTransform(fit());

  return (
    <div ref={wrapRef} className="relative flex-1 overflow-hidden rounded-xl border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)]">
      <svg
        ref={svgRef}
        width={container.w}
        height={container.h}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <marker id="arrow-seq" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
          </marker>
          <marker id="arrow-cond" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#0ea5e9" />
          </marker>
          <marker id="arrow-msg" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
          </marker>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Grid */}
          <rect x={0} y={0} width={TOTAL_W} height={BD} fill="url(#grid)" opacity={0.4} />

          {/* Lanes */}
          {DEPARTMENTS.map((d) => (
            <g key={d.key}>
              <rect x={0} y={d.laneY} width={OE} height={d.laneH} fill={d.bg} stroke={d.border} strokeWidth={1} />
              {(() => {
                const words = d.shortLabel.split(' ');
                const gap = 8;
                const charW = 5.2;
                let dy = 0;
                const cx = OE / 2;
                const cy = d.laneY + d.laneH / 2;
                return (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={700}
                    fill={d.color}
                    transform={`rotate(-90, ${cx}, ${cy})`}
                  >
                    {words.map((word, i) => {
                      if (i > 0) {
                        const prev = words[i - 1];
                        dy += ((prev.length + word.length) / 2) * charW + gap;
                      }
                      return (
                        <tspan key={i} x={cx} dy={i === 0 ? 0 : dy}>
                          {word}
                        </tspan>
                      );
                    })}
                  </text>
                );
              })()}
              <rect x={OE} y={d.laneY} width={GS} height={d.laneH} fill="#ffffff" fillOpacity={0.6} stroke={d.border} strokeDasharray="4 4" />
            </g>
          ))}

          {/* Edges */}
          {edges.map((edge) => {
            const from = nodeById.get(edge.from);
            const to = nodeById.get(edge.to);
            if (!from || !to) return null;
            const path = buildPath(from, to);
            const color = edge.type === 'conditional' ? '#0ea5e9' : edge.type === 'message' ? '#10b981' : '#64748b';
            const marker = edge.type === 'conditional' ? 'url(#arrow-cond)' : edge.type === 'message' ? 'url(#arrow-msg)' : 'url(#arrow-seq)';
            return (
              <g key={edge.id}>
                <path d={path} fill="none" stroke={color} strokeWidth={2} markerEnd={marker} />
                {edge.label && (
                  <text fontSize={10} fill="#475569">
                    <textPath href={`#${edge.id}-path`} startOffset="50%" textAnchor="middle">
                      {edge.label}
                    </textPath>
                  </text>
                )}
                <path id={`${edge.id}-path`} d={path} fill="none" stroke="none" />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const dept = DEPARTMENT_BY_KEY[node.dept];
            const visible = issueVisible(node.issue);
            const fill = issueFill(node.issue);
            const stroke = issueStroke(node.issue);
            const selected = selectedId === node.id;
            const hovered = hoveredId === node.id;

            if (node.type === 'event') {
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className={`bpmn-event ${selected ? 'selected' : ''}`}
                  onClick={() => onSelect(selected ? null : node.id)}
                  onMouseEnter={() => {
                    onHover?.(node.id);
                    setTooltip({ x: node.x + node.w + 8, y: node.y, node });
                  }}
                  onMouseLeave={() => {
                    onHover?.(null);
                    setTooltip(null);
                  }}
                >
                  <circle cx={node.w / 2} cy={node.h / 2} r={node.w / 2} fill={fill} stroke={stroke} strokeWidth={2} />
                  {node.id === 'end' && <circle cx={node.w / 2} cy={node.h / 2} r={node.w / 2 - 4} fill="none" stroke={stroke} strokeWidth={2} />}
                  <text x={node.w / 2} y={node.h + 16} textAnchor="middle" fontSize={10} fill="#334155">
                    {node.label}
                  </text>
                </g>
              );
            }

            if (node.type === 'gateway') {
              const s = node.w;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className={`bpmn-gateway ${selected ? 'selected' : ''}`}
                  onClick={() => onSelect(selected ? null : node.id)}
                  onMouseEnter={() => {
                    onHover?.(node.id);
                    setTooltip({ x: node.x + s + 8, y: node.y, node });
                  }}
                  onMouseLeave={() => {
                    onHover?.(null);
                    setTooltip(null);
                  }}
                >
                  <polygon
                    points={`${s / 2},0 ${s},${s / 2} ${s / 2},${s} 0,${s / 2}`}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={2}
                  />
                  <text x={s / 2} y={s + 16} textAnchor="middle" fontSize={9} fill="#334155">
                    {node.label}
                  </text>
                </g>
              );
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className={`bpmn-task ${node.issue === 'bottleneck' && visible ? 'bottleneck' : ''} ${
                  node.issue === 'duplicate' && visible ? 'duplicate' : ''
                } ${selected ? 'selected' : ''} ${hovered ? 'hovered' : ''}`}
                onClick={() => onSelect(selected ? null : node.id)}
                onMouseEnter={() => {
                  onHover?.(node.id);
                  setTooltip({ x: node.x + node.w + 8, y: node.y, node });
                }}
                onMouseLeave={() => {
                  onHover?.(null);
                  setTooltip(null);
                }}
              >
                <rect
                  x={0}
                  y={0}
                  width={node.w}
                  height={node.h}
                  rx={8}
                  ry={8}
                  fill={fill}
                  stroke={selected || hovered ? dept.color : stroke}
                  strokeWidth={selected ? 3 : hovered ? 2 : 1.5}
                />
                <rect x={0} y={0} width={6} height={node.h} rx={4} fill={dept.color} />
                <foreignObject x={10} y={4} width={node.w - 18} height={node.h - 8}>
                  <div
                    className="flex h-full flex-col justify-center leading-tight"
                    style={{ color: 'var(--iris-text-primary)' }}
                  >
                    <div className="text-xs font-bold" style={{ lineHeight: 1.2 }}>
                      {node.label}
                    </div>
                    <div className="mt-0.5 text-xs" style={{ color: 'var(--iris-text-muted)' }}>
                      {node.avgDays ? `~${node.avgDays} дн.` : 'мгновенно'}
                    </div>
                  </div>
                </foreignObject>
                {visible && node.issue !== 'ok' && (
                  <g transform={`translate(${node.w - 20}, 8)`}>{issueIcon(node.issue)}</g>
                )}
              </g>
            );
          })}

          {/* Tooltip in SVG coords */}
          {tooltip && (
            <foreignObject x={tooltip.x} y={tooltip.y} width={260} height={120}>
              <div className="tooltip-bpmn rounded-lg border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)] p-2 shadow-md">
                <div className="text-xs font-semibold text-[var(--iris-text-primary)]">{tooltip.node.label}</div>
                <div className="text-xs text-[var(--iris-text-secondary)]">{tooltip.node.description.slice(0, 110)}...</div>
                {tooltip.node.avgDays > 0 && (
                  <div className="mt-1 text-xs text-[var(--iris-text-muted)]">Средняя длительность: {tooltip.node.avgDays} дн.</div>
                )}
              </div>
            </foreignObject>
          )}
        </g>
      </svg>

      {/* Controls */}
      <div className="absolute bottom-3 left-3 flex gap-1 rounded-lg border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)] p-1 shadow-sm">
        <button onClick={zoomIn} className="rounded px-2 py-1 text-sm hover:bg-[var(--iris-bg-surface)]">+</button>
        <button onClick={zoomOut} className="rounded px-2 py-1 text-sm hover:bg-[var(--iris-bg-surface)]">−</button>
        <button onClick={reset} className="rounded px-2 py-1 text-xs hover:bg-[var(--iris-bg-surface)]">Сброс</button>
      </div>
      <div className="absolute bottom-3 right-3 rounded-lg border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)] px-2 py-1 text-xs text-[var(--iris-text-muted)] shadow-sm">
        Колёсико — зум · Drag — панорама · Клик — детали
      </div>
    </div>
  );
};
