import { useEffect, useCallback } from 'react';

export type HotkeyHandler = (e: KeyboardEvent) => void;

export function useHotkey(key: string, ctrl: boolean, handler: HotkeyHandler) {
  const memoizedHandler = useCallback(handler, [handler]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const matchKey = e.key.toLowerCase() === key.toLowerCase();
      const matchCtrl = e.ctrlKey === ctrl;
      if (matchKey && matchCtrl) {
        e.preventDefault();
        memoizedHandler(e);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, ctrl, memoizedHandler]);
}
