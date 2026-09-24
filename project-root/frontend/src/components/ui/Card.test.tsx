import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default md padding', () => {
    render(<Card>Default padding</Card>);
    expect(screen.getByText('Default padding')).toHaveClass('p-6');
  });

  it('applies sm padding', () => {
    render(<Card padding="sm">Small</Card>);
    expect(screen.getByText('Small')).toHaveClass('p-3');
  });

  it('applies lg padding', () => {
    render(<Card padding="lg">Large</Card>);
    expect(screen.getByText('Large')).toHaveClass('p-8');
  });

  it('applies no padding', () => {
    render(<Card padding="none">No pad</Card>);
    const el = screen.getByText('No pad');
    expect(el.className).not.toMatch(/p-\d/);
  });

  it('applies custom className', () => {
    render(<Card className="my-card">Custom</Card>);
    expect(screen.getByText('Custom')).toHaveClass('my-card');
  });

  it('passes through HTML attributes', () => {
    render(<Card data-testid="card">Attrs</Card>);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });
});
