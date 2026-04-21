import type { ChangeEventHandler } from 'react';

type SelectValue = string | number;

export interface SelectOption {
  value: SelectValue;
  label: string;
}

export interface SelectProps {
  label?: string;
  id?: string;
  name?: string;
  value?: SelectValue;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  options: SelectOption[];
  error?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function Select({
  label,
  id,
  name,
  options,
  error,
  className = '',
  value = '',
  onChange,
  required = false,
  disabled = false,
  placeholder,
}: SelectProps) {
  const hasError = Boolean(error);

  return (
    <div className={className}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
          {required ? (
            <span className="ml-1" style={{ color: 'var(--error)' }}>
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="w-full appearance-none rounded-md border px-3 py-2 pr-10 text-sm outline-none transition-colors duration-150"
          style={{
            backgroundColor: disabled ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
            borderColor: hasError ? 'var(--error)' : 'var(--border-default)',
            color: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
            boxShadow: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
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
        >
          {placeholder ? <option value="">{placeholder}</option> : null}

          {options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      {error ? (
        <p className="mt-1 text-xs" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}