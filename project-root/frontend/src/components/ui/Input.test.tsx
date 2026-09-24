import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input', () => {
  it('renders label when provided', () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Input error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('renders helpText when no error', () => {
    render(<Input helpText="Enter your email" />);
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
  });

  it('prefers error over helpText', () => {
    render(<Input error="Invalid" helpText="Hint" />);
    expect(screen.getByText('Invalid')).toBeInTheDocument();
    expect(screen.queryByText('Hint')).not.toBeInTheDocument();
  });

  it('applies custom className to wrapper', () => {
    render(<Input className="my-wrapper" data-testid="input" />);
    expect(screen.getByTestId('input').parentElement).toHaveClass('my-wrapper');
  });

  it('passes value and onChange correctly', () => {
    const onChange = vi.fn();
    render(<Input value="test" onChange={onChange} data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveValue('test');
    fireEvent.change(input, { target: { value: 'changed' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('applies error border style', () => {
    render(<Input error="fail" data-testid="input" />);
    const input = screen.getByTestId('input') as HTMLInputElement;
    expect(input.style.borderColor).toBe('var(--error, #dc2626)');
  });
});
