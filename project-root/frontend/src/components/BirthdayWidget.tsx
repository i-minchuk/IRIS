import { Cake, Gift } from 'lucide-react';

interface Birthday {
  id: string;
  name: string;
  date: string; // MM-DD
  role: string;
  avatar?: string;
}

interface Props {
  birthdays: Birthday[];
}

function getTodayStr() {
  const today = new Date();
  return `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function getTomorrowStr() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
}

function formatDateShort(dateStr: string) {
  // dateStr = MM-DD
  const [m, d] = dateStr.split('-');
  return `${d}.${m}`;
}

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [m, d] = dateStr.split('-').map(Number);
  let target = new Date(today.getFullYear(), m - 1, d);
  if (target < today) {
    target = new Date(today.getFullYear() + 1, m - 1, d);
  }
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function BirthdayWidget({ birthdays }: Props) {
  const todayStr = getTodayStr();
  const tomorrowStr = getTomorrowStr();

  const sorted = [...birthdays].sort((a, b) => {
    const da = daysUntil(a.date);
    const db = daysUntil(b.date);
    return da - db;
  });

  const todayBirthdays = sorted.filter(b => b.date === todayStr);
  const upcoming = sorted.filter(b => b.date !== todayStr).slice(0, 5);

  if (todayBirthdays.length === 0 && upcoming.length === 0) {
    return null;
  }

  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Дни рождения</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(236,72,153,0.12)', color: '#EC4899' }}>
            {todayBirthdays.length > 0 ? `${todayBirthdays.length} сегодня` : `${upcoming.length} ближайших`}
          </span>
          <Cake size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* Сегодня */}
        {todayBirthdays.map(b => (
          <div
            key={b.id}
            className="flex items-center gap-2.5 p-2.5 rounded-lg"
            style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(236,72,153,0.15)' }}>
              <Gift size={14} style={{ color: '#EC4899' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{b.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0" style={{ background: 'rgba(236,72,153,0.15)', color: '#EC4899' }}>
                  Сегодня! 🎉
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.role}</div>
            </div>
          </div>
        ))}

        {/* Ближайшие */}
        {upcoming.map(b => {
          const isTomorrow = b.date === tomorrowStr;
          const days = daysUntil(b.date);
          return (
            <div
              key={b.id}
              className="flex items-center gap-2.5 p-2 rounded-lg transition-colors"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--bg-surface-2)' }}>
                <Cake size={12} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{b.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.role}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-medium" style={{ color: isTomorrow ? '#EC4899' : 'var(--text-secondary)' }}>
                  {isTomorrow ? 'Завтра' : `${formatDateShort(b.date)}`}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {isTomorrow ? '' : `через ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
