import type { ReactNode, ButtonHTMLAttributes, CSSProperties } from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'ghost'
  | 'outline';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getVariantStyles(variant: ButtonVariant): CSSProperties {
  switch (variant) {
    case 'primary':
      return {
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--brand-iris) 88%, white 12%), var(--brand-iris))',
        color: 'var(--text-inverse)',
        border: '1px solid color-mix(in srgb, var(--brand-iris) 60%, var(--border-default))',
        boxShadow: 'var(--shadow-sm)',
      };

    case 'secondary':
      return {
        backgroundColor: 'var(--bg-surface-2)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-default)',
      };

    case 'success':
      return {
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--accent-leaders) 88%, white 12%), var(--accent-leaders))',
        color: 'var(--text-inverse)',
        border: '1px solid color-mix(in srgb, var(--accent-leaders) 50%, var(--border-default))',
      };

    case 'danger':
      return {
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--error) 88%, white 12%), var(--error))',
        color: 'var(--text-inverse)',
        border: '1px solid color-mix(in srgb, var(--error) 50%, var(--border-default))',
      };

    case 'ghost':
      return {
        backgroundColor: 'transparent',
        color: 'var(--text-secondary)',
        border: '1px solid transparent',
      };

    case 'outline':
      return {
        backgroundColor: 'transparent',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-default)',
      };

    default:
      return {
        backgroundColor: 'var(--brand-iris)',
        color: 'var(--text-inverse)',
        border: '1px solid var(--brand-iris)',
      };
  }
}

function getHoverStyles(
  variant: ButtonVariant,
  currentTarget: HTMLButtonElement,
  entering: boolean
) {
  if (!entering) {
    Object.assign(currentTarget.style, getVariantStyles(variant));
    return;
  }

  switch (variant) {
    case 'primary':
      currentTarget.style.background =
        'linear-gradient(180deg, color-mix(in srgb, var(--brand-iris) 76%, white 24%), color-mix(in srgb, var(--brand-iris) 94%, black 6%))';
      currentTarget.style.color = 'var(--text-inverse)';
      currentTarget.style.border =
        '1px solid color-mix(in srgb, var(--brand-iris) 70%, var(--border-default))';
      break;

    case 'secondary':
      currentTarget.style.backgroundColor = 'var(--bg-surface-3)';
      currentTarget.style.color = 'var(--text-primary)';
      currentTarget.style.border = '1px solid var(--border-default)';
      break;

    case 'success':
      currentTarget.style.background =
        'linear-gradient(180deg, color-mix(in srgb, var(--accent-leaders) 76%, white 24%), color-mix(in srgb, var(--accent-leaders) 94%, black 6%))';
      currentTarget.style.color = 'var(--text-inverse)';
      currentTarget.style.border =
        '1px solid color-mix(in srgb, var(--accent-leaders) 60%, var(--border-default))';
      break;

    case 'danger':
      currentTarget.style.background =
        'linear-gradient(180deg, color-mix(in srgb, var(--error) 76%, white 24%), color-mix(in srgb, var(--error) 94%, black 6%))';
      currentTarget.style.color = 'var(--text-inverse)';
      currentTarget.style.border =
        '1px solid color-mix(in srgb, var(--error) 60%, var(--border-default))';
      break;

    case 'ghost':
      currentTarget.style.backgroundColor = 'var(--bg-surface-2)';
      currentTarget.style.color = 'var(--text-primary)';
      currentTarget.style.border = '1px solid transparent';
      break;

    case 'outline':
      currentTarget.style.backgroundColor = 'var(--bg-surface-2)';
      currentTarget.style.color = 'var(--text-primary)';
      currentTarget.style.border = '1px solid var(--border-default)';
      break;
  }
}

function getDisabledStyles(): CSSProperties {
  return {
    background: 'var(--bg-surface-2)',
    color: 'var(--text-tertiary)',
    border: '1px solid var(--border-default)',
    boxShadow: 'none',
    opacity: 0.65,
    cursor: 'not-allowed',
  };
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  type = 'button',
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md,12px)] font-medium transition-all duration-150 focus-visible:outline-none disabled:cursor-not-allowed';

  const resolvedStyle: CSSProperties = isDisabled
    ? getDisabledStyles()
    : getVariantStyles(variant);

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cx(baseStyles, sizes[size], className)}
      style={{
        ...resolvedStyle,
        ...style,
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          getHoverStyles(variant, e.currentTarget, true);
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          getHoverStyles(variant, e.currentTarget, false);
        }
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow =
          '0 0 0 2px color-mix(in srgb, var(--brand-iris) 45%, transparent)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = isDisabled
          ? 'none'
          : variant === 'primary'
          ? 'var(--shadow-sm)'
          : 'none';
      }}
      {...props}
    >
      {isLoading && (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}

      {!isLoading && leftIcon ? <span className="inline-flex">{leftIcon}</span> : null}
      <span>{children}</span>
      {!isLoading && rightIcon ? <span className="inline-flex">{rightIcon}</span> : null}
    </button>
  );
}