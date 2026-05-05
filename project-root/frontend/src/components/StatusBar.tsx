import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useCollaborationStore } from '@/features/collaboration/store/collaborationStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useWorkspaceStore } from '@/components/workspace/store/workspaceStore';

export const StatusBar: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const { onlineUsers, isConnected, lockedDocuments } = useCollaborationStore();
  const { user } = useAuthStore();
  const { selectedDocument } = useWorkspaceStore();
  
  const currentLock = selectedDocument ? lockedDocuments.get(selectedDocument.id) : undefined;
  const isDocLockedByMe = Boolean(currentLock && currentLock.locked_by_id === user?.id);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const users = Array.from(onlineUsers.values());
  const maxVisible = 3;
  const visibleUsers = users.slice(0, maxVisible);
  const overflowCount = users.length - maxVisible;

  return (
    <div className="border-t px-3 sm:px-4 py-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[11px] sm:text-xs shrink-0"
      style={{ backgroundColor: 'var(--layout-bg)', borderColor: 'var(--header-border)', color: 'var(--text-muted)' }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>⏱️ {time.toLocaleTimeString('ru-RU')}</span>
        <span className="flex items-center gap-1">
          <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="hidden sm:inline">{isConnected ? 'Online' : 'Offline'}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="hidden sm:inline">📡</span>
          <span className={isConnected ? 'text-green-600 font-medium' : 'text-red-500'}>
            {isConnected ? 'подключён' : 'отключён'}
          </span>
        </span>
        {selectedDocument && currentLock && (
          <span className="flex items-center gap-1">
            <Lock size={12} className={isDocLockedByMe ? 'text-green-500' : 'text-amber-500'} />
            <span className={isDocLockedByMe ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
              {isDocLockedByMe ? 'Вы редактируете документ' : `Заблокировано: ${currentLock.locked_by_name || 'другой пользователь'}`}
            </span>
          </span>
        )}
        
        {users.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">👥</span>
            <div className="flex -space-x-1">
              {visibleUsers.map((u) => (
                <div
                  key={u.user_id}
                  title={u.full_name || u.email}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center text-[8px] sm:text-[10px] font-medium border border-white dark:border-[#0F172A]"
                >
                  {(u.full_name || u.email).charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            {overflowCount > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">+{overflowCount}</span>
            )}
            <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">{users.length} онлайн</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-x-3 gap-y-1">
        <span className="hidden md:inline">💾 Автосохранение: включено</span>
        <span>v0.3.0</span>
      </div>
    </div>
  );
};
