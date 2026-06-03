import { create } from 'zustand';
import { getLevelFromXP, getLevelProgress } from '@/lib/levelSystem';
import { calculateXP, type XPAction } from '@/lib/xpEngine';

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
  // Actions
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

const MOCK_BADGES: Badge[] = [
  { id: 'first_doc', name: 'Первый шаг', description: 'Создайте первый документ', category: 'workflow', rarity: 'common', icon: 'file', condition: 'document_created >= 1', xpReward: 50, coinReward: 10 },
  { id: 'approver', name: 'Согласующий', description: 'Согласуйте 10 документов', category: 'workflow', rarity: 'common', icon: 'check', condition: 'document_approved >= 10', xpReward: 100, coinReward: 25 },
  { id: 'project_master', name: 'Мастер проектов', description: 'Завершите 5 проектов', category: 'projects', rarity: 'rare', icon: 'folder', condition: 'project_completed >= 5', xpReward: 200, coinReward: 50 },
  { id: 'srm_pioneer', name: 'Пионер закупок', description: 'Подпишите первый договор', category: 'srm', rarity: 'common', icon: 'handshake', condition: 'contract_signed >= 1', xpReward: 75, coinReward: 20 },
  { id: 'learner', name: 'Знание — сила', description: 'Прочитайте 10 статей из БЗ', category: 'learning', rarity: 'common', icon: 'book', condition: 'kb_read >= 10', xpReward: 50, coinReward: 10 },
  { id: 'social_butterfly', name: 'Общительный', description: 'Помогите 5 коллегам', category: 'social', rarity: 'common', icon: 'users', condition: 'help_given >= 5', xpReward: 50, coinReward: 15 },
  { id: 'week_warrior', name: 'Боец недели', description: '7-дневный streak', category: 'activity', rarity: 'rare', icon: 'flame', condition: 'streak >= 7', xpReward: 150, coinReward: 40 },
  { id: 'month_master', name: 'Месяц без пропусков', description: '30-дневный streak', category: 'activity', rarity: 'epic', icon: 'crown', condition: 'streak >= 30', xpReward: 500, coinReward: 150 },
  { id: 'legend', name: 'Легенда ДокПоток', description: 'Достигните 25 уровня', category: 'special', rarity: 'legendary', icon: 'star', condition: 'level >= 25', xpReward: 1000, coinReward: 500 },
];

const MOCK_QUESTS: Quest[] = [
  { id: 'daily_login', title: 'Ежедневный вход', description: 'Войдите в систему', type: 'daily', objective: 'login', target: 1, current: 1, xpReward: 10, coinReward: 5, completed: true, claimed: false },
  { id: 'daily_approve', title: 'Согласование', description: 'Согласуйте 2 документа', type: 'daily', objective: 'document_approved', target: 2, current: 1, xpReward: 20, coinReward: 10, completed: false, claimed: false },
  { id: 'daily_learn', title: 'Обучение', description: 'Прочитайте статью из БЗ', type: 'daily', objective: 'kb_read', target: 1, current: 0, xpReward: 15, coinReward: 5, completed: false, claimed: false },
  { id: 'weekly_productive', title: 'Продуктивная неделя', description: 'Завершите 10 задач', type: 'weekly', objective: 'task_completed', target: 10, current: 4, xpReward: 100, coinReward: 30, completed: false, claimed: false },
  { id: 'weekly_docs', title: 'Документооборот', description: 'Создайте 5 документов', type: 'weekly', objective: 'document_created', target: 5, current: 2, xpReward: 80, coinReward: 25, completed: false, claimed: false },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 1, userName: 'Алексей Петров', xp: 15420, level: 18, badges: 12, streak: 15 },
  { rank: 2, userId: 3, userName: 'Мария Сидорова', xp: 12850, level: 16, badges: 10, streak: 12 },
  { rank: 3, userId: 6, userName: 'Сергей Морозов', xp: 11200, level: 15, badges: 9, streak: 8 },
  { rank: 4, userId: 5, userName: 'Иван Кузнецов', xp: 9800, level: 14, badges: 8, streak: 5 },
  { rank: 5, userId: 7, userName: 'Анна Лебедева', xp: 8450, level: 13, badges: 7, streak: 3 },
  { rank: 6, userId: 4, userName: 'Дмитрий Волков', xp: 7200, level: 12, badges: 6, streak: 0 },
  { rank: 7, userId: 8, userName: 'Ольга Новикова', xp: 6100, level: 11, badges: 5, streak: 2 },
  { rank: 8, userId: 999, userName: 'Вы', xp: 1250, level: 5, badges: 3, streak: 5, isMe: true },
];

export const useGamificationStore = create<GamificationState>((set, get) => ({
  xp: 8450,
  coins: 1250,
  streak: 3,
  lastLogin: new Date().toISOString(),
  badges: MOCK_BADGES,
  quests: MOCK_QUESTS,
  activeBoosters: [],

  addXP: (action, multipliers) => {
    const result = calculateXP(action, multipliers);
    const state = get();
    const oldLevel = getLevelFromXP(state.xp);
    const newXP = state.xp + result.totalXP;
    const newLevel = getLevelFromXP(newXP);
    const leveledUp = newLevel > oldLevel;

    set({ xp: newXP });

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

  getCurrentLevel: () => getLevelFromXP(get().xp),
  getLevelProgress: () => getLevelProgress(get().xp, getLevelFromXP(get().xp)),

  getLeaderboard: () => MOCK_LEADERBOARD,
}));
