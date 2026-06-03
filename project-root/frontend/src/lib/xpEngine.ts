export type XPAction =
  | 'document_approved'
  | 'document_created'
  | 'document_reviewed'
  | 'remark_resolved'
  | 'project_completed'
  | 'task_completed'
  | 'purchase_request_approved'
  | 'contract_signed'
  | 'daily_login'
  | 'streak_3_days'
  | 'streak_7_days'
  | 'streak_30_days'
  | 'badge_earned'
  | 'quest_completed'
  | 'help_given'
  | 'knowledge_shared';

export const XP_BASE: Record<XPAction, number> = {
  document_approved: 15,
  document_created: 10,
  document_reviewed: 8,
  remark_resolved: 12,
  project_completed: 200,
  task_completed: 25,
  purchase_request_approved: 25,
  contract_signed: 60,
  daily_login: 10,
  streak_3_days: 30,
  streak_7_days: 75,
  streak_30_days: 300,
  badge_earned: 50,
  quest_completed: 40,
  help_given: 5,
  knowledge_shared: 20,
};

export interface XPMultipliers {
  levelMultiplier: number;
  skillMultiplier: number;
  streakMultiplier: number;
  boosterActive: boolean;
  boosterMultiplier: number;
}

export function calculateXP(
  action: XPAction,
  multipliers: Partial<XPMultipliers> = {}
): { baseXP: number; bonusXP: number; totalXP: number; breakdown: string[] } {
  const base = XP_BASE[action] ?? 5;
  const breakdown: string[] = [`Базовое: ${base} XP`];

  let total = base;

  const levelMult = multipliers.levelMultiplier ?? 1.0;
  if (levelMult > 1) {
    const bonus = Math.round(base * (levelMult - 1));
    total += bonus;
    breakdown.push(`Уровень x${levelMult}: +${bonus} XP`);
  }

  const skillMult = multipliers.skillMultiplier ?? 1.0;
  if (skillMult > 1) {
    const bonus = Math.round(base * (skillMult - 1));
    total += bonus;
    breakdown.push(`Навыки x${skillMult}: +${bonus} XP`);
  }

  const streakMult = multipliers.streakMultiplier ?? 1.0;
  if (streakMult > 1) {
    const bonus = Math.round(base * (streakMult - 1));
    total += bonus;
    breakdown.push(`Streak x${streakMult}: +${bonus} XP`);
  }

  if (multipliers.boosterActive && multipliers.boosterMultiplier) {
    const bonus = Math.round(base * (multipliers.boosterMultiplier - 1));
    total += bonus;
    breakdown.push(`Бустер x${multipliers.boosterMultiplier}: +${bonus} XP`);
  }

  return {
    baseXP: base,
    bonusXP: total - base,
    totalXP: total,
    breakdown,
  };
}

export function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return String(xp);
}
