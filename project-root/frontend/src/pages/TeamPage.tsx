import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useTheme } from '@/providers/ThemeProvider';
import {
  Trophy, Medal, Award, Star, Flame, Zap, Crown,
  Target, BookOpen, Handshake, FileCheck, Users, Sparkles,
  ChevronRight, FolderKanban, ChevronDown, AlertTriangle,
  BarChart3, Gem
} from 'lucide-react';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */
interface Employee {
  name: string;
  role: string;
  current: number;
  max: number;
  avatar?: string;
}

interface Department {
  id: string;
  name: string;
  current: number;
  max: number;
  plan: number;
  route: string;
  iconColor: string;
  employees: Employee[];
}

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */
const DEPT_COLORS = {
  tender:   '#2563EB',
  project:  '#6B5B95',
  approval: '#D4AF37',
  archive:  '#0C7205',
  overdue:  '#DC2626',
};

const RARITY_COLORS = {
  common: '#6B7280',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#D4AF37',
};

const BADGE_ICONS: Record<string, React.ReactNode> = {
  file: <FileCheck size={12} />,
  check: <Target size={12} />,
  folder: <Award size={12} />,
  handshake: <Handshake size={12} />,
  book: <BookOpen size={12} />,
  users: <Users size={12} />,
  flame: <Flame size={12} />,
  crown: <Crown size={12} />,
  star: <Star size={12} />,
};

const DEPARTMENTS: Department[] = [
  {
    id: 'tender', name: 'Тендерный отдел', current: 34, max: 40, plan: 30, route: '/documents?dept=tender', iconColor: DEPT_COLORS.tender,
    employees: [
      { name: 'А. Смирнов', role: 'Ведущий инженер', current: 12, max: 10 },
      { name: 'Е. Козлова', role: 'Инженер КД', current: 9, max: 8 },
      { name: 'Д. Петров', role: 'Младший инженер', current: 8, max: 12 },
      { name: 'М. Волков', role: 'Архивариус', current: 5, max: 10 },
    ]
  },
  {
    id: 'project', name: 'Проектный отдел', current: 28, max: 35, plan: 28, route: '/documents?dept=project', iconColor: DEPT_COLORS.project,
    employees: [
      { name: 'И. Соколов', role: 'ГИП', current: 8, max: 6 },
      { name: 'Н. Лебедева', role: 'Инженер ПТО', current: 11, max: 10 },
      { name: 'В. Морозов', role: 'Конструктор', current: 9, max: 12 },
    ]
  },
  {
    id: 'approval', name: 'ОК / Согласование', current: 19, max: 25, plan: 20, route: '/workflow?dept=approval', iconColor: DEPT_COLORS.approval,
    employees: [
      { name: 'О. Новиков', role: 'Начальник ОК', current: 7, max: 5 },
      { name: 'Т. Фёдорова', role: 'Специалист ОК', current: 8, max: 10 },
      { name: 'С. Павлов', role: 'Юрист', current: 4, max: 10 },
    ]
  },
  {
    id: 'archive', name: 'Архив', current: 5, max: 20, plan: 10, route: '/archive', iconColor: DEPT_COLORS.archive,
    employees: [
      { name: 'Л. Гусева', role: 'Архивист', current: 3, max: 10 },
      { name: 'К. Борисов', role: 'Младший архивист', current: 2, max: 10 },
    ]
  },
];

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
function getLoadLabel(current: number, max: number) {
  const pct = current / max;
  if (pct > 0.85) return 'Перегруз';
  if (pct > 0.6) return 'Норма';
  return 'Свободен';
}

function getStatusColor(current: number, max: number) {
  const pct = current / max;
  if (pct > 0.85) return '#DC2626';
  if (pct > 0.6) return '#D4AF37';
  return '#0C7205';
}

function getRankStyle(rank: number) {
  if (rank === 1) return { bg: 'rgba(212,175,55,0.15)', border: '#D4AF37', icon: <Trophy size={14} /> };
  if (rank === 2) return { bg: 'rgba(192,192,192,0.15)', border: '#C0C0C0', icon: <Medal size={14} /> };
  if (rank === 3) return { bg: 'rgba(205,127,50,0.15)', border: '#CD7F32', icon: <Award size={14} /> };
  return { bg: 'var(--bg-surface-2)', border: 'var(--border-default)', icon: <span className="text-xs font-medium">{rank}</span> };
}

/* ═══════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════ */
type TabKey = 'leaderboard' | 'workload' | 'achievements';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'leaderboard', label: 'Рейтинг', icon: <Trophy size={14} /> },
  { key: 'workload', label: 'Загрузка', icon: <BarChart3 size={14} /> },
  { key: 'achievements', label: 'Достижения', icon: <Gem size={14} /> },
];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */
export default function TeamPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<TabKey>('leaderboard');

  // Leaderboard data
  const entries = useGamificationStore(s => s.getLeaderboard('global_xp'));
  const badges = useGamificationStore(s => s.badges);
  const earnedBadges = badges.filter(b => b.earnedAt);

  // Workload state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sortedDepts = useMemo(() => [...DEPARTMENTS].sort((a, b) => (b.current / b.max) - (a.current / a.max)), []);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-5 px-3 md:px-6 py-4 md:pt-2 pb-6">
      {/* Header */}
      <div>
        <h1 className="sr-only sr-only" style={{ color: 'var(--text-primary)' }}>Сотрудники</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Рейтинг, загрузка и достижения команды</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                color: active ? '#fff' : 'var(--text-secondary)',
                background: active ? '#3B82F6' : 'transparent',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ TAB: LEADERBOARD ═══ */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Podium */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-end justify-center gap-3 md:gap-6">
              {top3.map((_e, idx) => {
                const heights = ['h-20', 'h-28', 'h-16'];
                const order = [1, 0, 2];
                const actualIdx = order[idx];
                const e = top3[actualIdx];
                if (!e) return null;
                const style = getRankStyle(e.rank);

                return (
                  <div key={e.userId} className="flex flex-col items-center flex-1 max-w-[120px]">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2"
                      style={{
                        background: style.bg,
                        color: style.border,
                        border: `2px solid ${style.border}`,
                      }}
                    >
                      {e.userName.charAt(0)}
                    </div>
                    <div
                      className={`w-full ${heights[idx]} rounded-t-xl flex flex-col items-center justify-end pb-2`}
                      style={{
                        background: `linear-gradient(180deg, ${style.border}35 0%, ${style.border}10 100%)`,
                        borderTop: `3px solid ${style.border}`,
                        borderLeft: `1px solid ${style.border}30`,
                        borderRight: `1px solid ${style.border}30`,
                      }}
                    >
                      <span className="text-lg font-bold" style={{ color: style.border }}>{e.rank}</span>
                    </div>
                    <div className="text-xs font-medium mt-2 text-center truncate w-full" style={{ color: 'var(--text-primary)' }}>
                      {e.userName}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{e.xp.toLocaleString()} XP</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Flame size={10} style={{ color: '#EF4444' }} />
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{e.streak}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full table */}
          <div className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Полный рейтинг</h3>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{entries.length} участников</span>
            </div>
            <div className="flex flex-col gap-1">
              {rest.map(entry => {
                const style = getRankStyle(entry.rank);
                return (
                  <div
                    key={entry.userId}
                    className="flex items-center gap-3 p-2.5 rounded-lg transition-colors"
                    style={{ background: entry.isMe ? 'rgba(59,130,246,0.08)' : 'transparent' }}
                    onMouseEnter={(e) => { if (!entry.isMe) e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
                    onMouseLeave={(e) => { if (!entry.isMe) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="w-6 flex justify-center">{style.icon}</div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: style.bg, color: style.border }}
                    >
                      {entry.userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {entry.userName} {entry.isMe && <span className="text-[10px] font-normal" style={{ color: '#3B82F6' }}>(Вы)</span>}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Уровень {entry.level}</div>
                    </div>
                    <div className="flex items-center gap-3 text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1"><Star size={12} style={{ color: '#D4AF37' }} /> {entry.xp.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Award size={12} style={{ color: '#8B5CF6' }} /> {entry.badges}</span>
                      <span className="flex items-center gap-1"><Flame size={12} style={{ color: '#EF4444' }} /> {entry.streak}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: WORKLOAD ═══ */}
      {activeTab === 'workload' && (
        <div className="p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Загрузка по отделам</h3>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Сортировка: по загрузке ↓</span>
          </div>
          <div className="flex flex-col gap-2">
            {sortedDepts.map((dept) => {
              const pct = Math.round((dept.current / dept.max) * 100);
              const isExpanded = expandedId === dept.id;
              const loadLabel = getLoadLabel(dept.current, dept.max);
              const statusColor = getStatusColor(dept.current, dept.max);

              return (
                <div
                  key={dept.id}
                  className="rounded-lg overflow-hidden transition-all"
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid ${isExpanded ? statusColor + '40' : 'var(--border-default)'}`,
                  }}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : dept.id)}
                    className="w-full text-left p-3 transition-colors"
                    style={{ cursor: 'pointer', background: 'none', border: 'none' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span style={{ color: dept.iconColor }}><FolderKanban size={14} /></span>
                        <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{dept.name}</span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                          style={{ background: statusColor + '20', color: statusColor, border: `1px solid ${statusColor}40` }}
                        >
                          {loadLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <span className="text-xs font-bold" style={{ color: statusColor }}>{pct}%</span>
                        {isExpanded ? <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: statusColor, opacity: 0.8 }} />
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Сотрудников: {dept.employees.length} | Задач: {dept.current}/{dept.max}
                      </span>
                      {dept.current > dept.max && (
                        <span className="text-[9px] flex items-center gap-0.5 shrink-0" style={{ color: '#DC2626' }}>
                          <AlertTriangle size={9} /> Перегруз
                        </span>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="border-t pt-2 mt-0.5" style={{ borderColor: 'var(--border-default)' }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>Сотрудники</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(dept.route); }}
                            className="text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors"
                            style={{ color: DEPT_COLORS.tender, background: 'rgba(37,99,235,0.1)' }}
                          >
                            Перейти <ChevronRight size={8} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-1">
                          {dept.employees.map((emp, ei) => {
                            const empColor = getStatusColor(emp.current, emp.max);
                            return (
                              <div key={ei} className="flex items-center justify-between py-0.5">
                                <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{emp.name}</span>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  <span
                                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                                    style={{ background: empColor + '20', color: empColor, border: `1px solid ${empColor}40` }}
                                  >
                                    {emp.current}{emp.max > 0 ? `/${emp.max}` : ''}
                                  </span>
                                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{emp.role}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ TAB: ACHIEVEMENTS ═══ */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {/* Earned badges */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)' }}>
                <Sparkles size={14} style={{ color: '#D4AF37' }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Лучшие практики команды</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map(badge => {
                const color = RARITY_COLORS[badge.rarity];
                return (
                  <div
                    key={badge.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: `${color}12`,
                      color: color,
                      border: `1px solid ${color}30`,
                    }}
                    title={badge.description}
                  >
                    {BADGE_ICONS[badge.icon] || <Zap size={12} />}
                    <span>{badge.name}</span>
                    <span className="text-[10px] opacity-60">+{badge.xpReward} XP</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All badges grid */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Все достижения</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {badges.map(badge => {
                const color = RARITY_COLORS[badge.rarity];
                const isEarned = !!badge.earnedAt;
                return (
                  <div
                    key={badge.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg transition-colors"
                    style={{
                      background: isEarned ? `${color}08` : 'var(--bg-surface-2)',
                      border: `1px solid ${isEarned ? color + '30' : 'var(--border-default)'}`,
                      opacity: isEarned ? 1 : 0.6,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: isEarned ? `${color}20` : 'var(--bg-surface)', color }}
                    >
                      {BADGE_ICONS[badge.icon] || <Zap size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base md:text-lg font-medium leading-relaxed mt-1 font-medium" style={{ color: isEarned ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{badge.name}</span>
                        {isEarned && <Star size={10} style={{ color }} />}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{badge.description}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: `${color}15`, color }}>{badge.rarity}</span>
                        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>+{badge.xpReward} XP · {badge.coinReward} 🪙</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
