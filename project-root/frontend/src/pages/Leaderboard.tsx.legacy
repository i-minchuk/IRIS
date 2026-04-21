import { useEffect, useState } from 'react';
import { getLeaderboard } from '../api/gamification';
import type { LeaderboardEntry } from '../types';
import { useAuth } from '../context/useAuth';

import { Trophy, Medal, Award } from 'lucide-react';

const MOCK_BOARD: LeaderboardEntry[] = [
  { rank: 1, user_id: 3, username: 'sidorov', full_name: 'Сидоров В.Г.', score: 850, level: 4, level_title: 'Эксперт', badges_count: 4 },
  { rank: 2, user_id: 4, username: 'ivanov', full_name: 'Иванов А.А.', score: 620, level: 4, level_title: 'Эксперт', badges_count: 3 },
  { rank: 3, user_id: 5, username: 'petrov', full_name: 'Петров Б.В.', score: 410, level: 3, level_title: 'Профессионал', badges_count: 2 },
  { rank: 4, user_id: 6, username: 'kozlov', full_name: 'Козлов Д.И.', score: 280, level: 3, level_title: 'Профессионал', badges_count: 1 },
  { rank: 5, user_id: 7, username: 'novikov', full_name: 'Новиков Е.К.', score: 150, level: 2, level_title: 'Уверенный', badges_count: 1 },
];

const RANK_ICONS = [Trophy, Medal, Award];
const RANK_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

export default function Leaderboard() {
  const [board, setBoard] = useState<LeaderboardEntry[]>(MOCK_BOARD);
  const { user } = useAuth();

  useEffect(() => {
    getLeaderboard().then(setBoard).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Лидерборд</h1>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {board.slice(0, 3).map((entry, i) => {
          const Icon = RANK_ICONS[i];
          return (
            <div key={entry.user_id} className={`bg-white rounded-xl shadow-sm p-6 text-center ${i === 0 ? 'ring-2 ring-yellow-400' : ''}`}>
              <Icon size={32} className={`mx-auto mb-2 ${RANK_COLORS[i]}`} />
              <div className="text-lg font-bold">{entry.full_name}</div>
              <div className="text-sm text-gray-500">{entry.level_title}</div>
              <div className="text-2xl font-bold text-primary-600 mt-2">{entry.score}</div>
              <div className="text-xs text-gray-400 mt-1">{entry.badges_count} бейджей</div>
            </div>
          );
        })}
      </div>

      {/* Full Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase w-16">#</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Инженер</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Уровень</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Очки</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Бейджи</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {board.map(e => (
              <tr key={e.user_id} className={`hover:bg-gray-50 ${e.user_id === user?.id ? 'bg-primary-50' : ''}`}>
                <td className="px-6 py-4 font-bold text-gray-400">{e.rank}</td>
                <td className="px-6 py-4 font-medium">{e.full_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{e.level_title}</td>
                <td className="px-6 py-4 font-semibold text-primary-600">{e.score}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{e.badges_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
