import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './Modal';

describe('Modal', () => {
  beforeEach(() => {
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    document.body.style.overflow = 'unset';
  });

  it('does not render when isOpen is false', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="Test"><p>Content</p></Modal>);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders title and children when open', () => {
    render(<Modal isOpen onClose={vi.fn()} title="Hello"><p>World</p></Modal>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  it('shows close button by default', () => {
    render(<Modal isOpen onClose={vi.fn()} title="T"><span /></Modal>);
    expect(screen.getByLabelText('Закрыть')).toBeInTheDocument();
  });

  it('hides close button when showCloseButton=false', () => {
    render(<Modal isOpen onClose={vi.fn()} title="T" showCloseButton={false}><span /></Modal>);
    expect(screen.queryByLabelText('Закрыть')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="T"><span /></Modal>);
    const backdrop = screen.getByTestId('modal').querySelector('[aria-hidden="true"]');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="T"><span /></Modal>);
    fireEvent.click(screen.getByLabelText('Закрыть'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="T"><span /></Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets body overflow hidden when open', () => {
    render(<Modal isOpen onClose={vi.fn()} title="T"><span /></Modal>);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('renders footer when provided', () => {
    render(<Modal isOpen onClose={vi.fn()} title="T" footer={<button>Save</button>}><span /></Modal>);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('applies size class for sm', () => {
    const { container } = render(<Modal isOpen onClose={vi.fn()} title="T" size="sm"><span /></Modal>);
    expect(container.querySelector('.max-w-md')).toBeInTheDocument();
  });

  it('applies size class for lg', () => {
    const { container } = render(<Modal isOpen onClose={vi.fn()} title="T" size="lg"><span /></Modal>);
    expect(container.querySelector('.max-w-4xl')).toBeInTheDocument();
  });
});
