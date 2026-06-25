import { useCallback } from 'react';
import { useTimeTrackingStore } from '../store/useTimeTrackingStore';
import { startSession, stopSession } from '../api/sessions';
import { toast } from 'sonner';

interface AutoStartParams {
  documentId?: number;
  projectId?: number;
  documentName?: string;
  projectName?: string;
}

export function useAutoTimeTracker() {
  const {
    isRunning,
    sessionId,
    elapsedSeconds,
    documentId: activeDocumentId,
    startTimer,
    stopTimer,
  } = useTimeTrackingStore();

  const autoStart = useCallback(async ({
    documentId,
    projectId,
    documentName,
    projectName,
  }: AutoStartParams) => {
    const targetDocId = documentId ?? null;

    // Already running for the same document — do nothing
    if (isRunning && activeDocumentId === targetDocId) {
      return;
    }

    // Running for another document — stop current session first
    if (isRunning && sessionId) {
      try {
        await stopSession(sessionId, {
          active_time: elapsedSeconds,
          edit_count: 0,
        });
        stopTimer();
      } catch {
        toast.error('Не удалось переключить таймер');
        return;
      }
    }

    // Start new session
    try {
      const body: { document_id?: number; project_id?: number } = {};
      if (documentId && !Number.isNaN(documentId)) body.document_id = documentId;
      if (projectId && !Number.isNaN(projectId)) body.project_id = projectId;
      const session = await startSession(body);
      startTimer(session, documentId, projectId);
      const context = documentName || projectName
        ? `«${[documentName, projectName].filter(Boolean).join(' / ')}»`
        : '';
      toast.success(context ? `Таймер запущен для ${context}` : 'Таймер запущен');
    } catch {
      toast.error('Не удалось запустить таймер');
    }
  }, [isRunning, sessionId, elapsedSeconds, activeDocumentId, startTimer, stopTimer]);

  return { autoStart };
}
