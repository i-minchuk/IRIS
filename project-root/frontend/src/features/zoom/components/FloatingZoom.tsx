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
    bg: 'rgba(243, 244, 246, 0.95)',
    border: 'rgba(209, 213, 219, 0.8)',
    buttonBg: 'rgb(229, 231, 235)',
    buttonHover: 'rgb(209, 213, 219)',
    buttonText: 'rgb(75, 85, 99)',
    text: 'rgb(55, 65, 81)',
    divider: 'rgb(209, 213, 219)',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  };

  const darkColors = {
    bg: 'rgba(31, 41, 55, 0.95)',
    border: 'rgba(75, 85, 99, 0.5)',
    buttonBg: 'rgb(55, 65, 81)',
    buttonHover: 'rgb(75, 85, 99)',
    buttonText: 'rgb(209, 213, 219)',
    text: 'rgb(229, 231, 235)',
    divider: 'rgb(75, 85, 99)',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  };

  const c = isDark ? darkColors : lightColors;

  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-full border"
      style={{
        background: c.bg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor: c.border,
        boxShadow: c.shadow,
      }}
    >
      <button
        onClick={() => setScale(scale - 0.05)}
        disabled={scale <= MIN_SCALE}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: c.buttonBg, color: c.buttonText }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.buttonHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = c.buttonBg; }}
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <span className="text-sm font-mono min-w-[50px] text-center select-none" style={{ color: c.text }}>
        {Math.round(scale * 100)}%
      </span>

      <button
        onClick={() => setScale(scale + 0.05)}
        disabled={scale >= MAX_SCALE}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: c.buttonBg, color: c.buttonText }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.buttonHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = c.buttonBg; }}
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="w-px h-5 mx-1" style={{ backgroundColor: c.divider }} />

      <button
        onClick={reset}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
        style={{ backgroundColor: c.buttonBg, color: c.buttonText }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.buttonHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = c.buttonBg; }}
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}