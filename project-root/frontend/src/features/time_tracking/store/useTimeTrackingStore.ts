import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimeSession } from '../api/sessions';

interface TimerState {
  isRunning: boolean;
  sessionId: number | null;
  startedAt: string | null;
  documentId: number | null;
  projectId: number | null;
  elapsedSeconds: number;
  editCount: number;
}

interface TimeTrackingState extends TimerState {
  // Actions
  startTimer: (session: TimeSession, documentId?: number, projectId?: number) => void;
  stopTimer: () => void;
  tick: () => void;
  incrementEditCount: () => void;
  reset: () => void;
}

const initialState: TimerState = {
  isRunning: false,
  sessionId: null,
  startedAt: null,
  documentId: null,
  projectId: null,
  elapsedSeconds: 0,
  editCount: 0,
};

export const useTimeTrackingStore = create<TimeTrackingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startTimer: (session, documentId, projectId) => {
        set({
          isRunning: true,
          sessionId: session.id,
          startedAt: session.started_at,
          documentId: documentId ?? null,
          projectId: projectId ?? null,
          elapsedSeconds: 0,
          editCount: 0,
        });
      },

      stopTimer: () => {
        set({ ...initialState });
      },

      tick: () => {
        const { isRunning, startedAt } = get();
        if (!isRunning || !startedAt) return;
        const start = new Date(startedAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - start) / 1000);
        set({ elapsedSeconds: elapsed });
      },

      incrementEditCount: () => {
        set((state) => ({ editCount: state.editCount + 1 }));
      },

      reset: () => {
        set({ ...initialState });
      },
    }),
    {
      name: 'iris-time-tracking',
      partialize: (state) => ({
        isRunning: state.isRunning,
        sessionId: state.sessionId,
        startedAt: state.startedAt,
        documentId: state.documentId,
        projectId: state.projectId,
        elapsedSeconds: state.elapsedSeconds,
        editCount: state.editCount,
      }),
    }
  )
);
