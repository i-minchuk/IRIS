import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

vi.mock('./Modal', () => ({
  __esModule: true,
  default: ({ children, isOpen, title }: any) => (isOpen ? <div data-testid="modal"><h2>{title}</h2>{children}</div> : null),
}));

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    render(
      <ConfirmDialog isOpen={false} message="Are you sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders message and default buttons when open', () => {
    render(
      <ConfirmDialog isOpen message="Delete this file?" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText('Delete this file?')).toBeInTheDocument();
    expect(screen.getByText('Подтвердить')).toBeInTheDocument();
    expect(screen.getByText('Отмена')).toBeInTheDocument();
  });

  it('renders custom title and labels', () => {
    render(
      <ConfirmDialog
        isOpen
        title="Custom Title"
        message="Proceed?"
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog isOpen message="Sure?" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Подтвердить'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog isOpen message="Sure?" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Отмена'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('shows loading state on confirm button', () => {
    render(
      <ConfirmDialog isOpen message="Loading test" onConfirm={vi.fn()} onCancel={vi.fn()} loading />
    );
    expect(screen.getByText('Выполнение…')).toBeInTheDocument();
    expect(screen.getByText('Выполнение…')).toBeDisabled();
    expect(screen.getByText('Отмена')).toBeDisabled();
  });

  it('applies danger styling prop', () => {
    render(
      <ConfirmDialog isOpen message="Danger?" danger onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    const btn = screen.getByText('Подтвердить');
    expect(btn).toHaveStyle({ background: '#DC2626' });
  });
});
