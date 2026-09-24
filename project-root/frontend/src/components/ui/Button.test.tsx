import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  it('shows loading spinner and disables button', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled();
    expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('renders leftIcon', () => {
    render(<Button leftIcon={<span data-testid="left">★</span>}>Icon</Button>);
    expect(screen.getByTestId('left')).toBeInTheDocument();
  });

  it('renders rightIcon', () => {
    render(<Button rightIcon={<span data-testid="right">★</span>}>Icon</Button>);
    expect(screen.getByTestId('right')).toBeInTheDocument();
  });

  it('applies size class for sm', () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button', { name: 'Small' })).toHaveClass('h-8');
  });

  it('applies size class for lg', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button', { name: 'Large' })).toHaveClass('h-12');
  });

  it('applies primary variant styles by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button', { name: 'Primary' });
    expect(btn.style.color).toBe('var(--text-inverse)');
  });

  it('applies danger variant styles', () => {
    render(<Button variant="danger">Danger</Button>);
    const btn = screen.getByRole('button', { name: 'Danger' });
    expect(btn.style.color).toBe('var(--text-inverse)');
  });

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button', { name: 'Ghost' });
    expect(btn.style.backgroundColor).toBe('transparent');
  });
});
