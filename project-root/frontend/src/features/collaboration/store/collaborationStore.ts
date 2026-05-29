import { create } from 'zustand';
import type { WSMessage } from '@/features/collaboration/hooks/useWebSocket';

export interface OnlineUser {
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

interface CollaborationState {
  // Список подключённых пользователей
  onlineUsers: OnlineUser[];
  // Текущий редактируемый документ
  currentDocumentId: number | null;
  // Статус блокировки документа
  lockInfo: LockInfo | null;
  // WebSocket состояние
  isConnected: boolean;
  sendMessage: (msg: WSMessage) => void;
  // Legacy compatibility
  lockedDocuments: Map<number, LockInfo>;

  // Actions
  setOnlineUsers: (users: OnlineUser[]) => void;
  addOnlineUser: (user: OnlineUser) => void;
  removeOnlineUser: (userId: number) => void;
  setCurrentDocument: (documentId: number | null) => void;
  setLockInfo: (lock: LockInfo | null) => void;
  setWsState: (state: { isConnected?: boolean; sendMessage?: (msg: WSMessage) => void }) => void;
  reset: () => void;
}

const initialState = {
  onlineUsers: [],
  currentDocumentId: null,
  lockInfo: null,
  isConnected: false,
  sendMessage: (_msg: WSMessage) => {},
  lockedDocuments: new Map<number, LockInfo>(),
};

export const useCollaborationStore = create<CollaborationState>((set) => ({
  ...initialState,

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addOnlineUser: (user) =>
    set((state) => {
      const exists = state.onlineUsers.some((u) => u.user_id === user.user_id);
      if (exists) {
        return {
          onlineUsers: state.onlineUsers.map((u) =>
            u.user_id === user.user_id ? user : u
          ),
        };
      }
      return { onlineUsers: [...state.onlineUsers, user] };
    }),

  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((u) => u.user_id !== userId),
    })),

  setCurrentDocument: (documentId) => set({ currentDocumentId: documentId }),

  setLockInfo: (lock) =>
    set((state) => {
      const next = new Map(state.lockedDocuments);
      if (lock) {
        next.set(lock.document_id, lock);
      }
      return { lockInfo: lock, lockedDocuments: next };
    }),

  setWsState: (updates) =>
    set((state) => ({
      ...state,
      ...updates,
    })),

  reset: () => set({ ...initialState }),
}));
