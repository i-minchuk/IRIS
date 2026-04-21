import { ZoomIn, ZoomOut, Minus } from 'lucide-react';
import { useWorkspaceStore } from './store/workspaceStore';
import type { ContentScale } from './store/workspaceStore';

export default function ScaleControl() {
  const { contentScale, zoomIn, zoomOut, resetZoom, setContentScale } = useWorkspaceStore();

  const scales: { value: ContentScale; label: string }[] = [
    { value: 90, label: '90%' },
    { value: 100, label: '100%' },
    { value: 110, label: '110%' },
    { value: 120, label: '120%' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
      <button
        onClick={zoomOut}
        className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        title="Уменьшить масштаб"
      >
        <ZoomOut size={14} />
      </button>

      <div className="flex items-center gap-1 px-2">
        {scales.map((scale) => (
          <button
            key={scale.value}
            onClick={() => setContentScale(scale.value)}
            className={`text-xs font-medium px-1.5 py-0.5 rounded transition-colors ${
              contentScale === scale.value ? '' : 'hover:bg-[var(--bg-hover)]'
            }`}
            style={{
              color: contentScale === scale.value ? 'var(--accent-engineering)' : 'var(--text-secondary)',
              backgroundColor: contentScale === scale.value ? 'var(--topbar-active)' : 'transparent',
            }}
            title={`${scale.label}`}
          >
            {scale.label}
          </button>
        ))}
      </div>

      <button
        onClick={zoomIn}
        className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        title="Увеличить масштаб"
      >
        <ZoomIn size={14} />
      </button>

      {contentScale !== 100 && (
        <button
          onClick={resetZoom}
          className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          title="Сбросить масштаб"
        >
          <Minus size={12} />
        </button>
      )}
    </div>
  );
}
