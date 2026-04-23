import React, { useEffect, useState } from 'react';
import { useCollaborationStore } from '@/features/collaboration/store/collaborationStore';

export const StatusBar: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const { onlineUsers, isConnected } = useCollaborationStore();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const users = Array.from(onlineUsers.values());
  const maxVisible = 5;
  const visibleUsers = users.slice(0, maxVisible);
  const overflowCount = users.length - maxVisible;

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-1 flex items-center justify-between text-xs text-gray-500 shrink-0">
      <div className="flex items-center gap-4">
        <span>⏱️ {time.toLocaleTimeString('ru-RU')}</span>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          {isConnected ? 'Online' : 'Offline'}
        </span>
        <span className="flex items-center gap-1.5">
          <span>📡 WebSocket:</span>
          <span className={isConnected ? 'text-green-600 font-medium' : 'text-red-500'}>
            {isConnected ? 'подключён' : 'отключён'}
          </span>
        </span>
        {users.length > 0 && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-gray-400">👥</span>
            <div className="flex -space-x-1.5">
              {visibleUsers.map((u) => (
                <div
                  key={u.user_id}
                  title={u.full_name || u.email}
                  className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-medium border border-white"
                >
                  {(u.full_name || u.email).charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            {overflowCount > 0 && (
              <span className="text-[10px] text-gray-400">+{overflowCount}</span>
            )}
            <span className="text-gray-400">{users.length} онлайн</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>💾 Автосохранение: включено</span>
        <span>v0.3.0 Phase 3</span>
      </div>
    </div>
  );
};
