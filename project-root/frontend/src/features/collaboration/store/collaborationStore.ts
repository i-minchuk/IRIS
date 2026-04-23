import { create } from 'zustand';

export interface UserPresence {
  user_id: number;
  full_name: string;
  email: string;
  page?: string | null;
  document_id?: number | null;
}

export interface LockInfo {
  document_id: number;
  locked_by_id: number;
  locked_by_name?: string;
  locked_at?: string;
}

export interface WSMessage {
  type: string;
  payload?: Record<string, unknown>;
}

interface CollaborationState {
  onlineUsers: Map<number, UserPresence>;
  lockedDocuments: Map<number, LockInfo>;
  currentSubscribers: UserPresence[];
  isConnected: boolean;
  sendMessage: (msg: WSMessage) => void;
  // actions
  setUserPresence: (user: UserPresence) => void;
  removeUserPresence: (userId: number) => void;
  setDocumentLock: (lock: LockInfo) => void;
  removeDocumentLock: (documentId: number) => void;
  setCurrentSubscribers: (subscribers: UserPresence[]) => void;
  setWsState: (state: { isConnected?: boolean; sendMessage?: (msg: WSMessage) => void }) => void;
  reset: () => void;
}

const initialState = {
  onlineUsers: new Map<number, UserPresence>(),
  lockedDocuments: new Map<number, LockInfo>(),
  currentSubscribers: [],
  isConnected: false,
  sendMessage: (_msg: WSMessage) => {},
};

export const useCollaborationStore = create<CollaborationState>((set) => ({
  ...initialState,

  setUserPresence: (user) =>
    set((state) => {
      const next = new Map(state.onlineUsers);
      next.set(user.user_id, user);
      return { onlineUsers: next };
    }),

  removeUserPresence: (userId) =>
    set((state) => {
      const next = new Map(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),

  setDocumentLock: (lock) =>
    set((state) => {
      const next = new Map(state.lockedDocuments);
      next.set(lock.document_id, lock);
      return { lockedDocuments: next };
    }),

  removeDocumentLock: (documentId) =>
    set((state) => {
      const next = new Map(state.lockedDocuments);
      next.delete(documentId);
      return { lockedDocuments: next };
    }),

  setCurrentSubscribers: (subscribers) => set({ currentSubscribers: subscribers }),

  setWsState: (updates) => set((state) => ({ ...state, ...updates })),

  reset: () => set({ ...initialState }),
}));
