import { useState, useEffect, useCallback } from 'react';

/**
 * Хук для управления состоянием табов с сохранением в localStorage.
 *
 * @param storageKey — ключ в localStorage (например, 'iris_documents_tab')
 * @param defaultValue — значение по умолчанию
 * @returns [activeTab, setActiveTab]
 *
 * @example
 * const [tab, setTab] = useTabState<MainTab>('iris_portfolio_tab', 'tenders');
 */
export function useTabState<T extends string>(storageKey: string, defaultValue: T): [T, (tab: T) => void] {
  const [activeTab, setActiveTab] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const saved = localStorage.getItem(storageKey) as T | null;
      return saved ?? defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setTab = useCallback(
    (tab: T) => {
      setActiveTab(tab);
      try {
        localStorage.setItem(storageKey, tab);
      } catch {
        // ignore localStorage errors (private mode, quota exceeded)
      }
    },
    [storageKey]
  );

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        setActiveTab(e.newValue as T);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [storageKey]);

  return [activeTab, setTab];
}
