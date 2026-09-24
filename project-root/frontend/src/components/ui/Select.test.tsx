import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Select from './Select';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 3, label: 'Option C' },
];

describe('Select', () => {
  it('renders label with required asterisk', () => {
    render(<Select label="Field" id="f" required options={options} />);
    expect(screen.getByLabelText(/Field/)).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select options={options} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('Option C')).toBeInTheDocument();
  });

  it('renders placeholder option', () => {
    render(<Select options={options} placeholder="Choose..." />);
    expect(screen.getByText('Choose...')).toBeInTheDocument();
  });

  it('calls onChange with selected value', () => {
    const onChange = vi.fn();
    render(<Select options={options} onChange={onChange} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('shows error message', () => {
    render(<Select options={options} error="Invalid selection" />);
    expect(screen.getByText('Invalid selection')).toBeInTheDocument();
  });

  it('applies error border style', () => {
    render(<Select options={options} error="fail" />);
    const select = screen.getByRole('combobox');
    expect(select.style.borderColor).toBe('var(--error, #dc2626)');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select options={options} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(<Select options={options} className="my-select" />);
    expect(container.firstChild).toHaveClass('my-select');
  });
});
