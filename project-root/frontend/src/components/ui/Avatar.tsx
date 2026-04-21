interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Аватар пользователя
 * Показывает инициалы, если нет фото
 */
export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const sizes: Record<NonNullable<AvatarProps['size']>, string> = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  // Получаем инициалы
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Генерируем цвет на основе имени (детерминированно)
  const getColor = (seed: string) => {
    const baseColors = [
      'var(--brand-iris)',
      'var(--accent-docs)',
      'var(--accent-leaders)',
      'var(--accent-production)',
      'var(--accent-audit)',
    ];
    const index = seed.length % baseColors.length;
    return baseColors[index];
  };

  const base = getColor(name);
  const bgColor = `color-mix(in srgb, ${base} 82%, var(--bg-surface-2))`;

  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-full font-medium ${className}`}
      style={{
        backgroundColor: bgColor,
        color: 'var(--text-inverse)',
        boxShadow: '0 0 0 1px color-mix(in srgb, var(--bg-surface) 50%, transparent)',
      }}
      title={name}
    >
      {initials || '?'}
    </div>
  );
}
