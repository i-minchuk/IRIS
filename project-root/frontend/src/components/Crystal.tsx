interface CrystalProps {
  color: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Crystal({ color, size = 64, className = '', style }: CrystalProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      className={`transition-opacity duration-300 hover:opacity-40 ${className}`}
      style={{ ...style, opacity: style?.opacity ?? 0.6 }}
    >
      {/* Основная форма кристалла — продолговатый */}
      <polygon
        points="50,2 82,35 72,95 50,115 28,95 18,35"
        fill={color}
      />
      {/* Верхняя грань (блик) */}
      <polygon
        points="50,2 82,35 50,60 18,35"
        fill="rgba(255,255,255,0.22)"
      />
      {/* Правая грань (тень) */}
      <polygon
        points="82,35 72,95 50,60"
        fill="rgba(0,0,0,0.14)"
      />
      {/* Левая грань (полутень) */}
      <polygon
        points="18,35 28,95 50,60"
        fill="rgba(0,0,0,0.06)"
      />
      {/* Нижняя грань (тень) */}
      <polygon
        points="28,95 72,95 50,60"
        fill="rgba(0,0,0,0.16)"
      />
      {/* Центральная вертикальная грань */}
      <polygon
        points="50,2 50,60 72,95 82,35"
        fill="rgba(255,255,255,0.06)"
      />
    </svg>
  );
}
