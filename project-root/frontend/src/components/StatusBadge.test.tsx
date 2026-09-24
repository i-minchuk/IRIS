import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders active status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders completed status', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders overdue status', () => {
    render(<StatusBadge status="overdue" />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('normalizes case and separators', () => {
    render(<StatusBadge status="In-Progress" />);
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('normalizes underscores', () => {
    render(<StatusBadge status="not_started" />);
    expect(screen.getByText('Not started')).toBeInTheDocument();
  });

  it('renders raw status for unknown values', () => {
    render(<StatusBadge status="custom_status" />);
    expect(screen.getByText('custom_status')).toBeInTheDocument();
  });

  it('renders "unknown" for undefined status', () => {
    render(<StatusBadge />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('applies correct colors for completed', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toHaveStyle({
      backgroundColor: 'var(--success-light)',
      color: 'var(--success)',
    });
  });

  it('applies default colors for unknown status', () => {
    render(<StatusBadge status="xyz" />);
    expect(screen.getByText('xyz')).toHaveStyle({
      backgroundColor: 'var(--bg-hover)',
      color: 'var(--text-secondary)',
    });
  });
});
