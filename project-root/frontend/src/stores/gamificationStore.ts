import { create } from 'zustand';
import { getLevelFromXP, getLevelProgress } from '@/lib/levelSystem';
import { calculateXP, type XPAction } from '@/lib/xpEngine';
import {
  getMyGamification,
  getLeaderboard as apiGetLeaderboard,
  getBadges as apiGetBadges,
  getDailyQuests,
} from '@/features/gamification/api/gamification';
import type { DailyQuest } from '@/types';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'workflow' | 'projects' | 'srm' | 'learning' | 'activity' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  condition: string;
  xpReward: number;
  coinReward: number;
  earnedAt?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'story';
  objective: string;
  target: number;
  current: number;
  xpReward: number;
  coinReward: number;
  completed: boolean;
  claimed: boolean;
  expiresAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  avatar?: string;
  xp: number;
  level: number;
  badges: number;
  streak: number;
  isMe?: boolean;
}

export interface PlayerState {
  xp: number;
  coins: number;
  streak: number;
  lastLogin: string;
  badges: Badge[];
  quests: Quest[];
  activeBoosters: { type: string; multiplier: number; expiresAt: string }[];
}

interface GamificationState extends PlayerState {
  level: number;
  levelTitle: string;
  nextLevelAt: number | null;
  leaderboard: LeaderboardEntry[];
  earnedBadgeIds: string[];
  isLoading: boolean;
  // Fetch actions (real backend API)
  fetchProfile: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  fetchQuests: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchAll: () => Promise<void>;
  // Local actions
  addXP: (action: XPAction, multipliers?: Parameters<typeof calculateXP>[1]) => { totalXP: number; newLevel: number; leveledUp: boolean };
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  updateStreak: () => void;
  completeQuest: (questId: string) => void;
  claimQuestReward: (questId: string) => void;
  awardBadge: (badgeId: string) => void;
  getCurrentLevel: () => number;
  getLevelProgress: () => number;
  getLeaderboard: (type: string) => LeaderboardEntry[];
}

// Backend DailyQuest -> store Quest
const mapQuest = (q: DailyQuest): Quest => ({
  id: String(q.id),
  title: q.title,
  description: q.description,
  type: 'daily',
  objective: q.quest_type,
  target: q.target_count,
  current: q.current_count,
  xpReward: q.reward_xp,
  coinReward: q.reward_points,
  completed: q.is_completed,
  // Backend начисляет награду при выполнении — отдельного claim нет
  claimed: q.is_completed,
});

export const useGamificationStore = create<GamificationState>((set, get) => ({
  xp: 0,
  coins: 0,
  streak: 0,
  lastLogin: new Date().toISOString(),
  badges: [],
  quests: [],
  activeBoosters: [],
  level: 1,
  levelTitle: '',
  nextLevelAt: null,
  leaderboard: [],
  earnedBadgeIds: [],
  isLoading: false,

  fetchProfile: async () => {
    try {
      const profile = await getMyGamification();
      // Backend /gamification/me: xp есть в ответе (xp = score * 2), но тип может отставать
      const xp = (profile as { xp?: number }).xp ?? profile.score;
      set({
        xp,
        level: profile.level,
        levelTitle: profile.level_title,
        nextLevelAt: profile.next_level_at,
        earnedBadgeIds: profile.badges ?? [],
      });
    } catch (err) {
      console.error('Failed to load gamification profile', err);
      set({ xp: 0, level: 1, levelTitle: '', nextLevelAt: null, earnedBadgeIds: [] });
    }
  },

  fetchBadges: async () => {
    try {
      const apiBadges = await apiGetBadges();
      const earned = new Set(get().earnedBadgeIds);
      const earnedAt = new Date().toISOString();
      set({
        badges: apiBadges.map(b => ({
          id: b.id,
          name: b.name,
          // Backend возвращает description; тип Badge в @/types использует desc
          description: (b as { description?: string }).description ?? b.desc ?? '',
          // category/rarity/rewards в backend отсутствуют — нейтральные значения
          category: 'special',
          rarity: 'common',
          icon: (b as { icon?: string | null }).icon ?? 'star',
          condition: '',
          xpReward: 0,
          coinReward: 0,
          earnedAt: earned.has(b.id) ? earnedAt : undefined,
        })),
      });
    } catch (err) {
      console.error('Failed to load gamification badges', err);
      set({ badges: [] });
    }
  },

  fetchQuests: async () => {
    try {
      const quests = await getDailyQuests();
      set({ quests: quests.map(mapQuest) });
    } catch (err) {
      console.error('Failed to load daily quests', err);
      set({ quests: [] });
    }
  },

  fetchLeaderboard: async () => {
    try {
      const entries = await apiGetLeaderboard();
      set({
        leaderboard: entries.map(e => ({
          rank: e.rank,
          userId: e.user_id,
          userName: e.full_name || e.username,
          xp: e.score,
          level: e.level ?? 0,
          badges: e.badges_count ?? 0,
          // streak в backend отсутствует
          streak: 0,
        })),
      });
    } catch (err) {
      console.error('Failed to load leaderboard', err);
      set({ leaderboard: [] });
    }
  },

  fetchAll: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    // Профиль первым: fetchBadges использует earnedBadgeIds из него
    await get().fetchProfile();
    await Promise.all([get().fetchBadges(), get().fetchQuests(), get().fetchLeaderboard()]);
    set({ isLoading: false });
  },

  addXP: (action, multipliers) => {
    const result = calculateXP(action, multipliers);
    const state = get();
    const oldLevel = getLevelFromXP(state.xp);
    const newXP = state.xp + result.totalXP;
    const newLevel = getLevelFromXP(newXP);
    const leveledUp = newLevel > oldLevel;

    set({ xp: newXP, level: newLevel });

    return { totalXP: result.totalXP, newLevel, leveledUp };
  },

  addCoins: (amount) => set(state => ({ coins: state.coins + amount })),

  spendCoins: (amount) => {
    const state = get();
    if (state.coins < amount) return false;
    set({ coins: state.coins - amount });
    return true;
  },

  updateStreak: () => {
    const state = get();
    const last = new Date(state.lastLogin);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      set({ streak: state.streak + 1, lastLogin: now.toISOString() });
    } else if (diffDays > 1) {
      set({ streak: 1, lastLogin: now.toISOString() });
    }
  },

  completeQuest: (questId) => {
    set(state => ({
      quests: state.quests.map(q =>
        q.id === questId ? { ...q, completed: true } : q
      ),
    }));
  },

  claimQuestReward: (questId) => {
    const state = get();
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;

    set({
      xp: state.xp + quest.xpReward,
      coins: state.coins + quest.coinReward,
      quests: state.quests.map(q =>
        q.id === questId ? { ...q, claimed: true } : q
      ),
    });
  },

  awardBadge: (badgeId) => {
    const state = get();
    const badge = state.badges.find(b => b.id === badgeId);
    if (!badge || badge.earnedAt) return;

    set({
      xp: state.xp + badge.xpReward,
      coins: state.coins + badge.coinReward,
      badges: state.badges.map(b =>
        b.id === badgeId ? { ...b, earnedAt: new Date().toISOString() } : b
      ),
    });
  },

  getCurrentLevel: () => get().level,
  getLevelProgress: () => getLevelProgress(get().xp, get().level),

  getLeaderboard: () => get().leaderboard,
}));
