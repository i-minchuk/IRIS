import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('applies variant styles for success', () => {
    render(<Badge variant="success">OK</Badge>);
    const span = screen.getByText('OK');
    expect(span).toHaveStyle({ color: 'var(--success)' });
  });

  it('applies variant styles for error', () => {
    render(<Badge variant="error">Fail</Badge>);
    const span = screen.getByText('Fail');
    expect(span).toHaveStyle({ color: 'var(--error)' });
  });

  it('renders dot indicator when dot=true', () => {
    render(<Badge dot>Status</Badge>);
    const wrapper = screen.getByText('Status').parentElement as HTMLElement;
    expect(wrapper.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('renders leftIcon when provided', () => {
    render(<Badge leftIcon={<span data-testid="icon">★</span>}>Icon</Badge>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Badge className="my-class">Custom</Badge>);
    expect(screen.getByText('Custom').parentElement).toHaveClass('my-class');
  });

  it('defaults to neutral variant', () => {
    render(<Badge>Neutral</Badge>);
    const span = screen.getByText('Neutral');
    expect(span).toHaveStyle({ color: 'var(--text-secondary)' });
  });
});
