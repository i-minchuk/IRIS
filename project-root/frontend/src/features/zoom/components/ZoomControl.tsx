import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useZoomStore, MIN_SCALE, MAX_SCALE, STEP } from '../store/zoomStore';

export const ZoomControl: React.FC = () => {
  const { scale, setScale, reset } = useZoomStore();

  const decrease = () => setScale(scale - STEP);
  const increase = () => setScale(scale + STEP);

  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border px-1.5 py-1 text-xs transition-colors duration-200"
      style={{
        backgroundColor: 'var(--button-bg)',
        borderColor: 'var(--color-brand-border)',
        color: 'var(--text-secondary)',
      }}
      title="Масштаб интерфейса"
    >
      <button
        onClick={decrease}
        disabled={scale <= MIN_SCALE}
        className="flex items-center justify-center rounded p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ minHeight: 28, minWidth: 28 }}
        aria-label="Уменьшить масштаб"
      >
        <Minus size={14} />
      </button>

      <span className="min-w-[3ch] text-center font-medium tabular-nums select-none">
        {Math.round(scale * 100)}%
      </span>

      <button
        onClick={increase}
        disabled={scale >= MAX_SCALE}
        className="flex items-center justify-center rounded p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ minHeight: 28, minWidth: 28 }}
        aria-label="Увеличить масштаб"
      >
        <Plus size={14} />
      </button>

      {scale !== 1 && (
        <button
          onClick={reset}
          className="flex items-center justify-center rounded p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10 ml-0.5"
          style={{ minHeight: 28, minWidth: 28 }}
          aria-label="Сбросить масштаб"
          title="Сбросить"
        >
          <RotateCcw size={12} />
        </button>
      )}
    </div>
  );
};
