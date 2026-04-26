import React, { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useWebSocket, type WSMessage } from '@/shared/hooks/useWebSocket';
import { useCollaborationStore } from '@/features/collaboration/store/collaborationStore';

export const CollaborationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuthStore();
  const { isConnected, lastMessage, send } = useWebSocket(token || null);
  const collab = useCollaborationStore();

  // Sync WebSocket state into store
  useEffect(() => {
    collab.setWsState({ isConnected, sendMessage: send });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, send]);

  // Process incoming messages
  useEffect(() => {
    if (!lastMessage) return;
    const msg = lastMessage as WSMessage;
    const payload = msg.payload || {};
    
    // Обработка ошибок от сервера
    if (msg.type === 'error') {
      console.error('WebSocket error:', payload.detail || payload);
      // Можно добавить показ уведомления пользователю
      return;
    }
    
    if (msg.type === 'presence_join' || msg.type === 'presence_update') {
      collab.setUserPresence({
        user_id: payload.user_id as number,
        full_name: payload.full_name as string,
        email: payload.email as string,
        page: payload.page as string | undefined,
        document_id: payload.document_id as number | undefined,
      });
    } else if (msg.type === 'presence_leave') {
      collab.removeUserPresence(payload.user_id as number);
    } else if (msg.type === 'document_locked') {
      collab.setDocumentLock({
        document_id: payload.document_id as number,
        locked_by_id: payload.locked_by as number,
        locked_by_name: payload.locked_by_name as string,
      });
    } else if (msg.type === 'document_unlocked') {
      collab.removeDocumentLock(payload.document_id as number);
    } else if (msg.type === 'document_subscribers') {
      const subs = (payload.subscribers || []) as Array<{ user_id: number; full_name: string; email: string }>;
      collab.setCurrentSubscribers(subs.map((s) => ({ user_id: s.user_id, full_name: s.full_name, email: s.email })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  // Broadcast own presence when connected / page changes
  useEffect(() => {
    if (isConnected && user) {
      send({
        type: 'presence_update',
        payload: { page: window.location.pathname, document_id: null },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, user?.id]);

  return <>{children}</>;
};
