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
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </label>
      ) : null}

      <input
        id={id}
        {...props}
        className={cn(
          'w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors duration-150',
        )}
        style={{
          backgroundColor: 'var(--bg-surface-2)',
          borderColor: hasError ? 'var(--error)' : 'var(--border-default)',
          color: 'var(--text-primary)',
          boxShadow: 'none',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = hasError
            ? 'var(--error)'
            : 'var(--brand-iris)';
          e.currentTarget.style.boxShadow =
            '0 0 0 1px color-mix(in srgb, var(--brand-iris) 40%, transparent)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = hasError
            ? 'var(--error)'
            : 'var(--border-default)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      {hasError ? (
        <p className="mt-1 text-xs" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      ) : helpText ? (
        <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {helpText}
        </p>
      ) : null}
    </div>
  );
}