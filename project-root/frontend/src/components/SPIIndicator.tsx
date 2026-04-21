export default function SPIIndicator({ value }: { value: number | null }) {
  if (value === null) return <span className="text-tertiary-token">—</span>;
  
  const isGood = value >= 0.95;
  const isWarning = value >= 0.8;
  
  const color = isGood ? 'var(--success)' : isWarning ? 'var(--warning)' : 'var(--error)';
  const bg = isGood ? 'var(--success-light)' : isWarning ? 'var(--warning-light)' : 'var(--error-light)';
  
  return (
    <span 
      className="inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold"
      style={{ color, backgroundColor: bg }}
    >
      {value.toFixed(2)}
    </span>
  );
}
