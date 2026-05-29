import apiClient from '@/shared/api/client';
import type { LeaderboardEntry, GamificationProfile, Badge, DailyQuest } from '../types';

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data } = await apiClient.get('/gamification/leaderboard');
  return data;
};

export const getMyGamification = async (): Promise<GamificationProfile> => {
  const { data } = await apiClient.get('/gamification/me');
  return data;
};

export const getBadges = async (): Promise<Badge[]> => {
  const { data } = await apiClient.get('/gamification/badges');
  return data;
};

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const { data } = await apiClient.get('/gamification/notifications');
  return data;
};

export const markNotificationRead = async (notificationId: number): Promise<void> => {
  await apiClient.put(`/gamification/notifications/${notificationId}/read`);
};

export const getUnreadNotificationCount = async (): Promise<{ count: number }> => {
  const { data } = await apiClient.get('/gamification/notifications/unread-count');
  return data;
};

export const getDailyQuests = async (): Promise<DailyQuest[]> => {
  const { data } = await apiClient.get('/gamification/daily-quests');
  return data;
};

export const updateQuestProgress = async (questType: string): Promise<DailyQuest> => {
  const { data } = await apiClient.post(`/gamification/daily-quests/${questType}/progress`);
  return data;
};
