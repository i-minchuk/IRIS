import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Красная кнопка подтверждения для деструктивных действий */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Диалог подтверждения действия в стиле окна логина:
 * узкая карточка по центру, заголовок, основная кнопка слева-центр,
 * «Отмена» — текстовая справа.
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Подтвердите действие',
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmColor = danger ? '#DC2626' : '#2563EB';
  const confirmColorHover = danger ? '#b91c1c' : '#1d4ed8';

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm" showCloseButton={false}>
      <div className="text-center">
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="text-sm font-medium px-8 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            style={{
              background: confirmColor,
              color: '#ffffff',
              minWidth: '120px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = confirmColorHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = confirmColor; }}
          >
            {loading ? 'Выполнение…' : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-sm font-medium px-2 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            style={{ color: 'var(--text-secondary)', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
