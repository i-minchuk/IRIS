export interface LevelInfo {
  level: number;
  title: string;
  tier: string;
  tierColor: string;
  xpRequired: number;
  perks: string[];
}

export const TIER_NAMES: Record<number, { name: string; color: string }> = {
  1: { name: 'Стажёр', color: '#6B7280' },
  2: { name: 'Инженер', color: '#3B82F6' },
  3: { name: 'Ведущий', color: '#8B5CF6' },
  4: { name: 'Эксперт', color: '#F59E0B' },
  5: { name: 'Мастер', color: '#EF4444' },
  6: { name: 'Гуру', color: '#10B981' },
  7: { name: 'Легенда', color: '#D4AF37' },
  8: { name: 'Титан', color: '#EC4899' },
  9: { name: 'Властелин', color: '#6366F1' },
  10: { name: 'Провидец', color: '#14B8A6' },
  11: { name: 'Архитектор', color: '#F97316' },
};

export function getXPForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.8));
}

export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

export function getLevelFromXP(xp: number): number {
  let level = 1;
  let totalNeeded = 0;
  while (true) {
    const needed = getXPForLevel(level);
    if (totalNeeded + needed > xp) break;
    totalNeeded += needed;
    level++;
    if (level >= 50) break;
  }
  return Math.min(level, 50);
}

export function getLevelProgress(currentXP: number, currentLevel: number): number {
  const xpForCurrent = getXPForLevel(currentLevel);
  const totalBefore = getTotalXPForLevel(currentLevel - 1);
  const xpInLevel = currentXP - totalBefore;
  return Math.min(100, Math.max(0, Math.round((xpInLevel / xpForCurrent) * 100)));
}

export function getLevelInfo(level: number): LevelInfo {
  const tier = Math.min(11, Math.ceil(level / 5));
  const tierData = TIER_NAMES[tier];
  return {
    level,
    title: tierData.name,
    tier: tierData.name,
    tierColor: tierData.color,
    xpRequired: getXPForLevel(level),
    perks: getPerksForLevel(level),
  };
}

function getPerksForLevel(level: number): string[] {
  const perks: string[] = [];
  if (level >= 5) perks.push('Персональная рамка аватара');
  if (level >= 10) perks.push('Доступ к тёмной теме "Midnight"');
  if (level >= 15) perks.push('Множитель XP x1.5');
  if (level >= 20) perks.push('Эксклюзивный бейдж "Ветеран"');
  if (level >= 25) perks.push('Множитель монет x2');
  if (level >= 30) perks.push('Доступ к раннему доступу фич');
  if (level >= 40) perks.push('Титул "Легенда ДокПоток"');
  if (level >= 50) perks.push('Максимальный множитель XP x3');
  return perks;
}

export const LEVEL_TABLE: LevelInfo[] = Array.from({ length: 50 }, (_, i) =>
  getLevelInfo(i + 1)
);
