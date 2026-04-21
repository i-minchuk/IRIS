import client from './client';
import type { LeaderboardEntry, GamificationProfile, Badge, DailyQuest } from '../types';

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data } = await client.get('/api/gamification/leaderboard');
  return data;
};

export const getMyGamification = async (): Promise<GamificationProfile> => {
  const { data } = await client.get('/api/gamification/me');
  return data;
};

export const getBadges = async (): Promise<Badge[]> => {
  const { data } = await client.get('/api/gamification/badges');
  return data;
};

export const getNotifications = async (): Promise<Notification[]> => {
  const { data } = await client.get('/api/gamification/notifications');
  return data;
};

export const markNotificationRead = async (notificationId: number): Promise<void> => {
  await client.put(`/api/gamification/notifications/${notificationId}/read`);
};

export const getUnreadNotificationCount = async (): Promise<{ count: number }> => {
  const { data } = await client.get('/api/gamification/notifications/unread-count');
  return data;
};

export const getDailyQuests = async (): Promise<DailyQuest[]> => {
  const { data } = await client.get('/api/gamification/daily-quests');
  return data;
};

export const updateQuestProgress = async (questType: string): Promise<DailyQuest> => {
  const { data } = await client.post(`/api/gamification/daily-quests/${questType}/progress`);
  return data;
};
