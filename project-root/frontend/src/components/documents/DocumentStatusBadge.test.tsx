import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentStatusBadge } from './DocumentStatusBadge';

describe('DocumentStatusBadge', () => {
  it('renders label for draft status', () => {
    render(<DocumentStatusBadge status="draft" />);
    expect(screen.getByText('Черновик')).toBeInTheDocument();
  });

  it('renders label for approved status', () => {
    render(<DocumentStatusBadge status="approved" />);
    expect(screen.getByText('Согласован')).toBeInTheDocument();
  });

  it('applies small size classes by default', () => {
    render(<DocumentStatusBadge status="draft" />);
    const span = screen.getByText('Черновик');
    expect(span.className).toContain('px-2');
    expect(span.className).toContain('text-xs');
  });

  it('applies medium size classes when size="md"', () => {
    render(<DocumentStatusBadge status="release" size="md" />);
    const span = screen.getByText('Выпущен');
    expect(span.className).toContain('px-3');
    expect(span.className).toContain('text-sm');
  });

  it('uses correct color for cancelled status', () => {
    render(<DocumentStatusBadge status="cancelled" />);
    const span = screen.getByText('Отменён');
    expect(span).toHaveStyle({ color: '#EF4444' });
  });

  it('uses correct color for archived status', () => {
    render(<DocumentStatusBadge status="archived" />);
    const span = screen.getByText('В архиве');
    expect(span).toHaveStyle({ color: '#6B7280' });
  });
});
