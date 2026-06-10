/**
 * Автономная шина событий для авторизации.
 * Разрывает циклическую зависимость apiClient ↔ authStore.
 */

type LogoutListener = () => void;

const listeners: Set<LogoutListener> = new Set();

export const authEvents = {
  onLogout(listener: LogoutListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  emitLogout(): void {
    listeners.forEach((fn) => {
      try { fn(); } catch { /* ignore */ }
    });
  },
};
