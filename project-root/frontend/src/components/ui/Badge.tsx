import type { ReactNode, CSSProperties } from 'react';

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'leaders'
  | 'engineering'
  | 'production'
  | 'docs'
  | 'approvals'
  | 'audit';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  leftIcon?: ReactNode;
  dot?: boolean;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getBadgeStyles(variant: BadgeVariant): CSSProperties {
  switch (variant) {
    case 'success':
      return {
        color: 'var(--success)',
        backgroundColor:
          'color-mix(in srgb, var(--success) 16%, var(--bg-surface-2))',
        border: '1px solid color-mix(in srgb, var(--success) 28%, var(--border-default))',
      };

    case 'warning':
      return {
        color: 'var(--warning)',
        backgroundColor:
          'color-mix(in srgb, var(--warning) 18%, var(--bg-surface-2))',
        border: '1px solid color-mix(in srgb, var(--warning) 28%, var(--border-default))',
      };

    case 'error':
      return {
        color: 'var(--error)',
        backgroundColor:
          'color-mix(in srgb, var(--error) 16%, var(--bg-surface-2))',
        border: '1px solid color-mix(in srgb, var(--error) 28%, var(--border-default))',
      };

    case 'info':
      return {
        color: 'var(--accent-docs)',
        backgroundColor:
          'color-mix(in srgb, var(--accent-docs) 16%, var(--bg-surface-2))',
        border: '1px solid color-mix(in srgb, var(--accent-docs) 28%, var(--border-default))',
      };

    case 'leaders':
      return {
        color: 'var(--accent-leaders)',
        backgroundColor:
          'color-mix(in srgb, var(--accent-leaders) 16%, var(--bg-surface-2))',
        border:
          '1px solid color-mix(in srgb, var(--accent-leaders) 28%, var(--border-default))',
      };

    case 'engineering':
      return {
        color: 'var(--accent-engineering)',
        backgroundColor:
          'color-mix(in srgb, var(--accent-engineering) 16%, var(--bg-surface-2))',
        border:
          '1px solid color-mix(in srgb, var(--accent-engineering) 28%, var(--border-default))',
      };

    case 'production':
      return {
        color: 'var(--accent-production)',
        backgroundColor:
          'color-mix(in srgb, var(--accent-production) 16%, var(--bg-surface-2))',
        border:
          '1px solid color-mix(in srgb, var(--accent-production) 28%, var(--border-default))',
      };

    case 'docs':
      return {
        color: 'var(--accent-docs)',
        backgroundColor:
          'color-mix(in srgb, var(--accent-docs) 16%, var(--bg-surface-2))',
        border: '1px solid color-mix(in srgb, var(--accent-docs) 28%, var(--border-default))',
      };

    case 'approvals':
      return {
        color: 'var(--accent-approvals)',
        backgroundColor:
          'color-mix(in srgb, var(--accent-approvals) 18%, var(--bg-surface-2))',
        border:
          '1px solid color-mix(in srgb, var(--accent-approvals) 28%, var(--border-default))',
      };

    case 'audit':
      return {
        color: 'var(--accent-audit)',
        backgroundColor:
          'color-mix(in srgb, var(--accent-audit) 16%, var(--bg-surface-2))',
        border: '1px solid color-mix(in srgb, var(--accent-audit) 28%, var(--border-default))',
      };

    case 'neutral':
    default:
      return {
        color: 'var(--text-secondary)',
        backgroundColor: 'var(--bg-surface-2)',
        border: '1px solid var(--border-default)',
      };
  }
}

export default function Badge({
  children,
  variant = 'neutral',
  className = '',
  leftIcon,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium leading-none',
        className
      )}
      style={getBadgeStyles(variant)}
    >
      {dot ? (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
          aria-hidden="true"
        />
      ) : null}
      {leftIcon ? <span className="inline-flex">{leftIcon}</span> : null}
      <span>{children}</span>
    </span>
  );
}