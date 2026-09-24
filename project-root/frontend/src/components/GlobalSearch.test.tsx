import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalSearch from './GlobalSearch';
import { useGlobalSearchStore } from '@/stores/globalSearchStore';

describe('GlobalSearch', () => {
  beforeEach(() => {
    useGlobalSearchStore.getState().reset();
  });

  it('renders search input', () => {
    render(<GlobalSearch />);
    expect(screen.getByTitle('Глобальный поиск (Ctrl+K)')).toBeInTheDocument();
  });

  it('shows scope button with current scope label', () => {
    render(<GlobalSearch />);
    expect(screen.getByText('Текущая вкладка')).toBeInTheDocument();
  });

  it('updates query on input change', () => {
    render(<GlobalSearch />);
    const input = screen.getByTitle('Глобальный поиск (Ctrl+K)');
    fireEvent.change(input, { target: { value: 'test query' } });
    expect(useGlobalSearchStore.getState().query).toBe('test query');
  });

  it('shows clear button when query is not empty', () => {
    useGlobalSearchStore.getState().setQuery('something');
    render(<GlobalSearch />);
    expect(screen.getByLabelText('Очистить поиск')).toBeInTheDocument();
  });

  it('hides clear button when query is empty', () => {
    render(<GlobalSearch />);
    expect(screen.queryByLabelText('Очистить поиск')).not.toBeInTheDocument();
  });

  it('clears query on clear button click', () => {
    useGlobalSearchStore.getState().setQuery('something');
    render(<GlobalSearch />);
    fireEvent.click(screen.getByLabelText('Очистить поиск'));
    expect(useGlobalSearchStore.getState().query).toBe('');
  });

  it('toggles scope dropdown on button click', () => {
    render(<GlobalSearch />);
    fireEvent.click(screen.getByTitle('Область поиска'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Везде')).toBeInTheDocument();
    expect(screen.getByText('По проекту / заказчику')).toBeInTheDocument();
  });

  it('changes scope on option click', () => {
    render(<GlobalSearch />);
    fireEvent.click(screen.getByTitle('Область поиска'));
    fireEvent.click(screen.getByText('Везде'));
    expect(useGlobalSearchStore.getState().scope).toBe('everywhere');
  });

  it('shows checkmark for selected scope', () => {
    render(<GlobalSearch />);
    fireEvent.click(screen.getByTitle('Область поиска'));
    const selectedOption = screen.getByRole('option', { name: /Текущая вкладка/ });
    expect(selectedOption).toHaveAttribute('aria-selected', 'true');
  });

  it('shows tab-specific placeholder', () => {
    useGlobalSearchStore.getState().setActiveTab('/documents');
    render(<GlobalSearch />);
    expect(screen.getByPlaceholderText('Поиск по документам…')).toBeInTheDocument();
  });

  it('shows default placeholder when no active tab', () => {
    render(<GlobalSearch />);
    expect(screen.getByPlaceholderText('Поиск')).toBeInTheDocument();
  });

  it('clears query on Escape key', () => {
    useGlobalSearchStore.getState().setQuery('to clear');
    render(<GlobalSearch />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(useGlobalSearchStore.getState().query).toBe('');
  });

  it('focuses input on Ctrl+K', () => {
    render(<GlobalSearch />);
    const input = screen.getByTitle('Глобальный поиск (Ctrl+K)');
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(document.activeElement).toBe(input);
  });

  it('closes dropdown on click outside', () => {
    render(<GlobalSearch />);
    fireEvent.click(screen.getByTitle('Область поиска'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
