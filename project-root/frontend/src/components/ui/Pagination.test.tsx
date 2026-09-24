import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('returns null when pages <= 1', () => {
    const { container } = render(<Pagination page={1} pages={1} onPageChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders page info', () => {
    render(<Pagination page={2} pages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('disables prev button on first page', () => {
    render(<Pagination page={1} pages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('←')).toBeDisabled();
    expect(screen.getByText('→')).not.toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination page={5} pages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('→')).toBeDisabled();
    expect(screen.getByText('←')).not.toBeDisabled();
  });

  it('calls onPageChange with previous page', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('←'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('→'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});
