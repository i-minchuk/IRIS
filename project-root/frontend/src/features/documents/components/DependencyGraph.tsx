import React, { useMemo, useState } from 'react';
import type { DocumentNode, DependencyEdge } from '../api/dependencies';

interface Props {
  nodes: DocumentNode[];
  edges: DependencyEdge[];
  onNodeClick?: (node: DocumentNode) => void;
  onEdgeClick?: (edge: DependencyEdge) => void;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;
const COL_GAP = 240;
const ROW_GAP = 80;

function topologicalSort(nodes: DocumentNode[], edges: DependencyEdge[]): DocumentNode[] {
  const inDegree = new Map<number, number>();
  const adj = new Map<number, number[]>();
  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });
  edges.forEach((e) => {
    const src = adj.get(e.source) || [];
    src.push(e.target);
    adj.set(e.source, src);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  const queue = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0);
  const result: DocumentNode[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    result.push(node);
    (adj.get(node.id) || []).forEach((nextId) => {
      const deg = (inDegree.get(nextId) || 0) - 1;
      inDegree.set(nextId, deg);
      if (deg === 0) {
        const nextNode = nodes.find((n) => n.id === nextId);
        if (nextNode) queue.push(nextNode);
      }
    });
  }
  return result;
}

function computeLayers(sorted: DocumentNode[], edges: DependencyEdge[]): Map<number, number> {
  const layer = new Map<number, number>();
  sorted.forEach((n) => {
    const predLayers = edges
      .filter((e) => e.target === n.id)
      .map((e) => layer.get(e.source) || 0);
    layer.set(n.id, predLayers.length ? Math.max(...predLayers) + 1 : 0);
  });
  return layer;
}

function statusColor(status: string): string {
  switch (status) {
    case 'approved':
      return '#10b981';
    case 'in_review':
      return '#f59e0b';
    case 'rejected':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

function typeBadge(docType: string): string {
  const map: Record<string, string> = {
    KM: 'КМ',
    PD: 'ПД',
    AK: 'АК',
    EM: 'ЭМ',
    ZK: 'ЗК',
    AR: 'АР',
  };
  return map[docType] || docType;
}

export const DependencyGraph: React.FC<Props> = ({ nodes, edges, onNodeClick, onEdgeClick }) => {
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  const layout = useMemo(() => {
    if (!nodes.length) return { positions: new Map<number, { x: number; y: number }>(), width: 0, height: 0 };
    const sorted = topologicalSort(nodes, edges);
    const layers = computeLayers(sorted, edges);
    const maxLayer = Math.max(...layers.values(), 0);
    const columns: DocumentNode[][] = Array.from({ length: maxLayer + 1 }, () => []);
    sorted.forEach((n) => {
      columns[layers.get(n.id) || 0].push(n);
    });

    const positions = new Map<number, { x: number; y: number }>();
    let maxHeight = 0;
    columns.forEach((col, colIdx) => {
      const colHeight = col.length * (NODE_HEIGHT + ROW_GAP) - ROW_GAP;
      col.forEach((n, rowIdx) => {
        const x = colIdx * COL_GAP + NODE_WIDTH / 2 + 40;
        const y = rowIdx * (NODE_HEIGHT + ROW_GAP) + NODE_HEIGHT / 2 + 40;
        positions.set(n.id, { x, y });
      });
      maxHeight = Math.max(maxHeight, colHeight + NODE_HEIGHT + 80);
    });

    const width = (maxLayer + 1) * COL_GAP + NODE_WIDTH + 80;
    return { positions, width, height: maxHeight };
  }, [nodes, edges]);

  const handleNodeClick = (node: DocumentNode) => {
    setSelectedNode(node.id);
    onNodeClick?.(node);
  };

  return (
    <svg width={layout.width} height={layout.height} className="bg-white rounded-lg border border-gray-200">
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 L2,5 Z" fill="#9ca3af" />
        </marker>
      </defs>
      {edges.map((edge) => {
        const src = layout.positions.get(edge.source);
        const tgt = layout.positions.get(edge.target);
        if (!src || !tgt) return null;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / len;
        const ny = dy / len;
        const startX = src.x + (NODE_WIDTH / 2) * nx;
        const startY = src.y + (NODE_HEIGHT / 2) * ny;
        const endX = tgt.x - (NODE_WIDTH / 2 + 10) * nx;
        const endY = tgt.y - (NODE_HEIGHT / 2 + 10) * ny;
        return (
          <g key={`edge-${edge.id}`} className="cursor-pointer" onClick={() => onEdgeClick?.(edge)}>
            <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#d1d5db" strokeWidth={2} markerEnd="url(#arrow)" />
            <text x={(startX + endX) / 2} y={(startY + endY) / 2 - 6} textAnchor="middle" fontSize={11} fill="#6b7280">
              {edge.dependency_type}
              {edge.lag_hours > 0 ? ` +${edge.lag_hours}ч` : ''}
            </text>
          </g>
        );
      })}
      {nodes.map((node) => {
        const pos = layout.positions.get(node.id);
        if (!pos) return null;
        const isSelected = selectedNode === node.id;
        return (
          <g
            key={`node-${node.id}`}
            className="cursor-pointer"
            onClick={() => handleNodeClick(node)}
            transform={`translate(${pos.x - NODE_WIDTH / 2}, ${pos.y - NODE_HEIGHT / 2})`}
          >
            <rect
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={6}
              ry={6}
              fill={isSelected ? '#eff6ff' : '#ffffff'}
              stroke={isSelected ? '#3b82f6' : '#e5e7eb'}
              strokeWidth={isSelected ? 2 : 1}
            />
            <rect x={0} y={0} width={4} height={NODE_HEIGHT} rx={2} fill={statusColor(node.status)} />
            <text x={12} y={20} fontSize={12} fontWeight={600} fill="#111827">
              {node.number}
            </text>
            <text x={12} y={38} fontSize={11} fill="#4b5563" width={NODE_WIDTH - 20}>
              {node.name.length > 22 ? node.name.slice(0, 22) + '…' : node.name}
            </text>
            <text x={12} y={54} fontSize={10} fill="#9ca3af">
              {typeBadge(node.doc_type)} · {node.duration_hours ? `${node.duration_hours}ч` : '—'}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
