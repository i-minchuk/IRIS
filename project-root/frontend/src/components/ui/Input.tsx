import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  className?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function Input({
  label,
  id,
  error,
  helpText,
  className = '',
  style,
  ...props
}: InputProps) {
  const hasError = Boolean(error);

  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium"
          style={{ color: 'inherit' }}
        >
          {label}
        </label>
      ) : null}

      <input
        id={id}
        {...props}
        className={cn(
          'w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors duration-150 placeholder:text-gray-400',
        )}
        style={{
          backgroundColor: 'var(--bg-surface-2, #f8fafc)',
          borderColor: hasError ? 'var(--error, #dc2626)' : 'var(--border-default, #e2e8f0)',
          color: 'inherit',
          boxShadow: 'none',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = hasError
            ? 'var(--error, #dc2626)'
            : 'var(--brand-iris, #2563eb)';
          e.currentTarget.style.boxShadow =
            '0 0 0 1px color-mix(in srgb, var(--brand-iris, #2563eb) 40%, transparent)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = hasError
            ? 'var(--error, #dc2626)'
            : 'var(--border-default, #e2e8f0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      {hasError ? (
        <p className="mt-1 text-xs" style={{ color: 'var(--error, #dc2626)' }}>
          {error}
        </p>
      ) : helpText ? (
        <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary, #94a3b8)' }}>
          {helpText}
        </p>
      ) : null}
    </div>
  );
}