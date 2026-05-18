import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useZoomStore, MIN_SCALE, MAX_SCALE } from "../store/zoomStore";
import { useTheme } from "@/providers/ThemeProvider";

export function FloatingZoom() {
  const { scale, setScale, reset, hidden } = useZoomStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // НЕ показываем кнопку зума, если страница попросила скрыться
  if (hidden) return null;

  const lightColors = {
    bg: 'rgba(243, 244, 246, 0.85)',
    border: 'rgba(209, 213, 219, 0.6)',
    buttonBg: 'rgb(229, 231, 235)',
    buttonHover: 'rgb(209, 213, 219)',
    buttonText: 'rgb(75, 85, 99)',
    text: 'rgb(55, 65, 81)',
    divider: 'rgb(209, 213, 219)',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  };

  const darkColors = {
    bg: 'rgba(31, 41, 55, 0.85)',
    border: 'rgba(75, 85, 99, 0.4)',
    buttonBg: 'rgb(55, 65, 81)',
    buttonHover: 'rgb(75, 85, 99)',
    buttonText: 'rgb(209, 213, 219)',
    text: 'rgb(229, 231, 219)',
    divider: 'rgb(75, 85, 99)',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
  };

  const c = isDark ? darkColors : lightColors;

  return (
    <div 
      className="fixed bottom-2 right-2 z-[1000] flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-opacity duration-200 opacity-60 hover:opacity-100"
      style={{
        background: c.bg,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderColor: c.border,
        boxShadow: c.shadow,
      }}
    >
      <button
        onClick={() => setScale(scale - 0.05)}
        disabled={scale <= MIN_SCALE}
        className="flex h-6 w-6 items-center justify-center rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: c.buttonBg, color: c.buttonText }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.buttonHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = c.buttonBg; }}
      >
        <ZoomOut className="w-3 h-3" />
      </button>

      <span className="text-[10px] font-mono min-w-[32px] text-center select-none" style={{ color: c.text }}>
        {Math.round(scale * 100)}%
      </span>

      <button
        onClick={() => setScale(scale + 0.05)}
        disabled={scale >= MAX_SCALE}
        className="flex h-6 w-6 items-center justify-center rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: c.buttonBg, color: c.buttonText }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.buttonHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = c.buttonBg; }}
      >
        <ZoomIn className="w-3 h-3" />
      </button>

      <div className="w-px h-3 mx-0.5" style={{ backgroundColor: c.divider }} />

      <button
        onClick={reset}
        className="flex h-6 w-6 items-center justify-center rounded transition-colors"
        style={{ backgroundColor: c.buttonBg, color: c.buttonText }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.buttonHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = c.buttonBg; }}
      >
        <RotateCcw className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}