import { useCallback, useEffect, useRef } from 'react';
import { startSession, stopSession } from '../api/sessions';

const IDLE_GAP_MS = 120_000; // пауза активности, после которой время уходит в простой
const BURST_MS = 30_000; // минимальный учёт одного «всплеска» активности

/**
 * Автоматический учёт времени работы над документом.
 * Сессия стартует при входе в редактирование (start) и завершается
 * при выходе из редактора / закрытии страницы (stop).
 * Активное время считается по событиям редактирования (trackEdit):
 * серии действий с паузами <= 2 мин идут в активное время, остальное — в простой.
 */
export function useDocumentTimeTracking() {
  const sessionIdRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(0);
  const activeMsRef = useRef(0);
  const editCountRef = useRef(0);
  const stoppingRef = useRef(false);

  const flushActivity = () => {
    const last = lastActivityRef.current;
    if (!last) return;
    const now = Date.now();
    const gap = now - last;
    activeMsRef.current += gap <= IDLE_GAP_MS ? gap : BURST_MS;
    lastActivityRef.current = now;
  };

  const buildStopBody = () => {
    flushActivity();
    return {
      active_time: Math.max(1, Math.round(activeMsRef.current / 1000)),
      edit_count: editCountRef.current,
    };
  };

  const stop = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || stoppingRef.current) return;
    stoppingRef.current = true;
    sessionIdRef.current = null;
    try {
      await stopSession(sessionId, buildStopBody());
    } catch {
      // Сессия могла быть уже завершена (beforeunload) — игнорируем
    } finally {
      stoppingRef.current = false;
      activeMsRef.current = 0;
      editCountRef.current = 0;
      lastActivityRef.current = 0;
    }
  }, []);

  const start = useCallback(async (documentId: number, projectId?: number) => {
    if (sessionIdRef.current) return; // сессия уже идёт
    try {
      const session = await startSession({
        document_id: documentId,
        project_id: projectId,
      });
      sessionIdRef.current = session.id;
      lastActivityRef.current = Date.now();
      activeMsRef.current = 0;
      editCountRef.current = 0;
    } catch (err) {
      console.error('Не удалось начать сессию учёта времени', err);
    }
  }, []);

  const trackEdit = useCallback(() => {
    if (!sessionIdRef.current) return;
    flushActivity();
    editCountRef.current += 1;
  }, []);

  // Завершение сессии при закрытии/перезагрузке страницы
  useEffect(() => {
    const handleUnload = () => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;
      flushActivity();
      const token = localStorage.getItem('access_token');
      fetch(`/api/v1/time-tracking/sessions/${sessionId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          active_time: Math.max(1, Math.round(activeMsRef.current / 1000)),
          edit_count: editCountRef.current,
        }),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // Завершение сессии при размонтировании (уход со страницы документов)
  useEffect(() => {
    return () => {
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        sessionIdRef.current = null;
        stopSession(sessionId, buildStopBody()).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { start, stop, trackEdit };
}
