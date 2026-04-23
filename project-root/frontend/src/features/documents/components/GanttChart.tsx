import React, { useMemo } from 'react';
import type { DocumentNode, DependencyEdge } from '../api/dependencies';

interface Props {
  nodes: DocumentNode[];
  edges: DependencyEdge[];
  onNodeClick?: (node: DocumentNode) => void;
}

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 40;
const BAR_HEIGHT = 20;
const LEFT_MARGIN = 180;
const RIGHT_MARGIN = 40;
const DAY_WIDTH = 40;

function parseDate(d?: string | null): Date | null {
  if (!d) return null;
  const date = new Date(d);
  return isNaN(date.getTime()) ? null : date;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffDays(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(d: Date): string {
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

const statusColors: Record<string, string> = {
  draft: '#9ca3af',
  in_review: '#3b82f6',
  approved: '#10b981',
  crs_pending: '#a855f7',
  crs_approved: '#059669',
};

export const GanttChart: React.FC<Props> = ({ nodes, edges, onNodeClick }) => {
  const layout = useMemo(() => {
    const docsWithDates = nodes.map((n) => ({
      ...n,
      start: parseDate(n.planned_start) || parseDate(n.actual_start),
      end: parseDate(n.planned_end) || parseDate(n.actual_end),
    })).filter((n) => n.start && n.end);

    if (docsWithDates.length === 0) {
      return { width: 800, height: HEADER_HEIGHT + nodes.length * ROW_HEIGHT, days: [] as Date[], startDate: null as Date | null };
    }

    const allDates = docsWithDates.flatMap((n) => [n.start!, n.end!]);
    const minDate = startOfDay(new Date(Math.min(...allDates.map((d) => d.getTime()))));
    const maxDate = startOfDay(new Date(Math.max(...allDates.map((d) => d.getTime()))));
    // Add buffer
    const startDate = addDays(minDate, -2);
    const endDate = addDays(maxDate, 5);
    const totalDays = diffDays(startDate, endDate) + 1;

    const days: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      days.push(addDays(startDate, i));
    }

    const width = LEFT_MARGIN + totalDays * DAY_WIDTH + RIGHT_MARGIN;
    const height = HEADER_HEIGHT + nodes.length * ROW_HEIGHT;

    return { width, height, days, startDate };
  }, [nodes]);

  const getX = (date: Date | null) => {
    if (!date || !layout.startDate) return LEFT_MARGIN;
    return LEFT_MARGIN + diffDays(layout.startDate, date) * DAY_WIDTH;
  };

  return (
    <svg width={layout.width} height={layout.height} className="bg-white rounded-lg border border-gray-200">
      {/* Header background */}
      <rect x={0} y={0} width={layout.width} height={HEADER_HEIGHT} fill="#f9fafb" />
      <line x1={0} y1={HEADER_HEIGHT} x2={layout.width} y2={HEADER_HEIGHT} stroke="#e5e7eb" />

      {/* Day grid + labels */}
      {layout.days.map((day, i) => {
        const x = LEFT_MARGIN + i * DAY_WIDTH;
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        return (
          <g key={day.toISOString()}>
            {isWeekend && (
              <rect x={x} y={HEADER_HEIGHT} width={DAY_WIDTH} height={layout.height - HEADER_HEIGHT} fill="#f3f4f6" />
            )}
            <line x1={x} y1={0} x2={x} y2={layout.height} stroke="#e5e7eb" strokeDasharray="2,2" />
            <text x={x + DAY_WIDTH / 2} y={16} textAnchor="middle" fontSize={10} fill="#6b7280">
              {day.toLocaleDateString('ru-RU', { weekday: 'short' })}
            </text>
            <text x={x + DAY_WIDTH / 2} y={30} textAnchor="middle" fontSize={10} fill="#374151" fontWeight={500}>
              {formatDate(day)}
            </text>
          </g>
        );
      })}

      {/* Today line */}
      {layout.startDate && (
        <g>
          <line
            x1={getX(new Date())}
            y1={HEADER_HEIGHT}
            x2={getX(new Date())}
            y2={layout.height}
            stroke="#ef4444"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
          <text x={getX(new Date()) + 4} y={HEADER_HEIGHT + 12} fontSize={9} fill="#ef4444">Сегодня</text>
        </g>
      )}

      {/* Rows */}
      {nodes.map((node, idx) => {
        const y = HEADER_HEIGHT + idx * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
        const plannedStart = parseDate(node.planned_start);
        const plannedEnd = parseDate(node.planned_end);
        const actualStart = parseDate(node.actual_start);
        const actualEnd = parseDate(node.actual_end);

        const plannedX = plannedStart ? getX(plannedStart) : null;
        const plannedW = plannedStart && plannedEnd ? Math.max(DAY_WIDTH, diffDays(plannedStart, plannedEnd) * DAY_WIDTH) : null;
        const actualX = actualStart ? getX(actualStart) : null;
        const actualW = actualStart && actualEnd ? Math.max(DAY_WIDTH, diffDays(actualStart, actualEnd) * DAY_WIDTH) : null;

        return (
          <g key={node.id}>
            {/* Row background */}
            <rect x={0} y={HEADER_HEIGHT + idx * ROW_HEIGHT} width={layout.width} height={ROW_HEIGHT} fill={idx % 2 === 0 ? '#ffffff' : '#fafafa'} />

            {/* Label */}
            <text x={8} y={y + BAR_HEIGHT / 2 + 4} fontSize={11} fill="#374151" fontWeight={500}>
              {node.number}
            </text>
            <text x={8} y={y + BAR_HEIGHT / 2 + 16} fontSize={9} fill="#9ca3af" className="truncate">
              {node.name.length > 22 ? node.name.slice(0, 22) + '…' : node.name}
            </text>
            <line x1={LEFT_MARGIN - 4} y1={HEADER_HEIGHT + idx * ROW_HEIGHT} x2={LEFT_MARGIN - 4} y2={HEADER_HEIGHT + (idx + 1) * ROW_HEIGHT} stroke="#e5e7eb" />

            {/* Planned bar */}
            {plannedX !== null && plannedW !== null && (
              <g className="cursor-pointer" onClick={() => onNodeClick?.(node)}>
                <rect
                  x={plannedX}
                  y={y}
                  width={plannedW}
                  height={BAR_HEIGHT}
                  rx={4}
                  fill={statusColors[node.status] || '#9ca3af'}
                  opacity={0.25}
                  stroke={statusColors[node.status] || '#9ca3af'}
                  strokeWidth={1}
                />
                <text x={plannedX + 4} y={y + BAR_HEIGHT / 2 + 4} fontSize={9} fill={statusColors[node.status] || '#6b7280'}>
                  П
                </text>
              </g>
            )}

            {/* Actual bar */}
            {actualX !== null && actualW !== null && (
              <g className="cursor-pointer" onClick={() => onNodeClick?.(node)}>
                <rect
                  x={actualX}
                  y={y + 2}
                  width={actualW}
                  height={BAR_HEIGHT - 4}
                  rx={3}
                  fill={statusColors[node.status] || '#9ca3af'}
                />
                <text x={actualX + 4} y={y + BAR_HEIGHT / 2 + 3} fontSize={9} fill="#ffffff">
                  {node.number}
                </text>
              </g>
            )}

            {/* Duration label */}
            {node.duration_hours && (
              <text
                x={layout.width - RIGHT_MARGIN + 4}
                y={y + BAR_HEIGHT / 2 + 4}
                fontSize={9}
                fill="#6b7280"
              >
                {node.duration_hours}ч
              </text>
            )}
          </g>
        );
      })}

      {/* Dependencies */}
      {edges.map((edge) => {
        const sourceIdx = nodes.findIndex((n) => n.id === edge.source);
        const targetIdx = nodes.findIndex((n) => n.id === edge.target);
        if (sourceIdx === -1 || targetIdx === -1) return null;

        const sourceY = HEADER_HEIGHT + sourceIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
        const targetY = HEADER_HEIGHT + targetIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
        const sourceEnd = parseDate(nodes[sourceIdx].planned_end) || parseDate(nodes[sourceIdx].actual_end);
        const targetStart = parseDate(nodes[targetIdx].planned_start) || parseDate(nodes[targetIdx].actual_start);
        const x1 = sourceEnd ? getX(sourceEnd) : LEFT_MARGIN;
        const x2 = targetStart ? getX(targetStart) : LEFT_MARGIN;

        // Curve
        const midX = (x1 + x2) / 2;

        return (
          <g key={`dep-${edge.id}`}>
            <path
              d={`M ${x1} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${x2} ${targetY}`}
              fill="none"
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeDasharray="4,2"
              markerEnd="url(#arrow-gantt)"
            />
          </g>
        );
      })}

      <defs>
        <marker id="arrow-gantt" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#9ca3af" />
        </marker>
      </defs>
    </svg>
  );
};
