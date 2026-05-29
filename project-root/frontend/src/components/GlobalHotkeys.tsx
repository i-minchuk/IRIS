import { useNavigate } from 'react-router-dom';
import { useHotkey } from '@/shared/hooks/useHotkeys';

export function GlobalHotkeys() {
  const navigate = useNavigate();

  // Ctrl+K — фокус на глобальный поиск
  useHotkey('k', true, () => {
    const el = document.getElementById('global-search');
    if (el) {
      (el as HTMLElement).focus();
    }
  });

  // Ctrl+S — сохранить активную форму
  useHotkey('s', true, () => {
    const activeForm = document.querySelector('form[data-hotkey-submit="true"]') as HTMLFormElement | null;
    if (activeForm) {
      activeForm.requestSubmit();
    }
  });

  // Ctrl+1..9 — переключение вкладок
  useHotkey('1', true, () => navigate('/dashboard'));
  useHotkey('2', true, () => navigate('/tenders'));
  useHotkey('3', true, () => navigate('/portfolio'));
  useHotkey('4', true, () => navigate('/project-portfolio'));
  useHotkey('5', true, () => navigate('/project-tasks'));
  useHotkey('6', true, () => navigate('/documents'));
  useHotkey('7', true, () => navigate('/production'));
  useHotkey('8', true, () => navigate('/archive'));
  useHotkey('9', true, () => navigate('/achievements'));

  // Escape — закрыть модалки
  useHotkey('Escape', false, () => {
    const openModals = document.querySelectorAll('[data-testid="modal"]');
    if (openModals.length > 0) {
      // Находим кнопку закрытия в самой верхней (последней открытой) модалке
      const topModal = openModals[openModals.length - 1] as HTMLElement;
      const closeBtn = topModal.querySelector('button[aria-label="Закрыть"]') as HTMLButtonElement | null;
      closeBtn?.click();
    }
  });

  return null;
}
