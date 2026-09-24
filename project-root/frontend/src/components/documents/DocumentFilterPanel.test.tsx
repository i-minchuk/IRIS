import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentFilterPanel } from './DocumentFilterPanel';

describe('DocumentFilterPanel', () => {
  const disciplines = ['АР', 'КР', 'ОВ'];

  it('renders filters header', () => {
    render(<DocumentFilterPanel filters={{}} onChange={vi.fn()} disciplines={disciplines} />);
    expect(screen.getByText('Фильтры')).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    render(<DocumentFilterPanel filters={{}} onChange={vi.fn()} disciplines={disciplines} />);
    expect(screen.getByPlaceholderText('Поиск по шифру или названию...')).toBeInTheDocument();
  });

  it('renders status select with all statuses', () => {
    render(<DocumentFilterPanel filters={{}} onChange={vi.fn()} disciplines={disciplines} />);
    expect(screen.getByText('Все статусы')).toBeInTheDocument();
    expect(screen.getByText('Черновик')).toBeInTheDocument();
    expect(screen.getByText('Согласован')).toBeInTheDocument();
  });

  it('renders discipline select with provided disciplines', () => {
    render(<DocumentFilterPanel filters={{}} onChange={vi.fn()} disciplines={disciplines} />);
    expect(screen.getByText('Все дисциплины')).toBeInTheDocument();
    expect(screen.getByText('АР')).toBeInTheDocument();
    expect(screen.getByText('КР')).toBeInTheDocument();
  });

  it('calls onChange with search value on apply', () => {
    const onChange = vi.fn();
    render(<DocumentFilterPanel filters={{}} onChange={onChange} disciplines={disciplines} />);
    const input = screen.getByPlaceholderText('Поиск по шифру или названию...');
    fireEvent.change(input, { target: { value: 'test-query' } });
    fireEvent.click(screen.getByText('Применить'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'test-query' }));
  });

  it('calls onChange with status on apply', () => {
    const onChange = vi.fn();
    render(<DocumentFilterPanel filters={{}} onChange={onChange} disciplines={disciplines} />);
    const statusSelect = screen.getByText('Все статусы').closest('select') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'approved' } });
    fireEvent.click(screen.getByText('Применить'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
  });

  it('calls onChange with discipline on apply', () => {
    const onChange = vi.fn();
    render(<DocumentFilterPanel filters={{}} onChange={onChange} disciplines={disciplines} />);
    const disciplineSelect = screen.getByText('Все дисциплины').closest('select') as HTMLSelectElement;
    fireEvent.change(disciplineSelect, { target: { value: 'АР' } });
    fireEvent.click(screen.getByText('Применить'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ discipline: 'АР' }));
  });

  it('reset clears filters and calls onChange with empty object', () => {
    const onChange = vi.fn();
    render(<DocumentFilterPanel filters={{ search: 'q', status: 'draft' }} onChange={onChange} disciplines={disciplines} />);
    fireEvent.click(screen.getByText('Сброс'));
    expect(onChange).toHaveBeenCalledWith({});
  });
});
