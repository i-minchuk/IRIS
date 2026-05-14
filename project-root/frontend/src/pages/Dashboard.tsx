import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, FileText, ArrowLeftRight, Archive,
  FileCheck, Clock, AlertTriangle, TrendingUp,
  TrendingDown, Minus
} from 'lucide-react';
import TeamLoadSection from './TeamLoadSection';

/* ── Types ── */
interface KPIData {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  icon: React.ReactNode;
  accent: 'blue' | 'yellow' | 'green' | 'red';
}

interface ProjectProgress {
  name: string;
  percent: number;
  status: 'active' | 'review' | 'approved' | 'overdue';
}

interface RecentDoc {
  id: string;
  name: string;
  project: string;
  status: string;
  date: string;
  statusColor: string;
}

/* ── Mock data (replace with API calls) ── */
const kpiData: KPIData[] = [
  { label: 'Документы в потоке', value: '1,247', change: '+12% к прошлой неделе', trend: 'up', icon: <FileText size={22} />, accent: 'blue' },
  { label: 'На согласовании', value: '84', change: 'Среднее время: 2.3 дня', trend: 'flat', icon: <Clock size={22} />, accent: 'yellow' },
  { label: 'Согласовано за месяц', value: '156', change: '+8% к прошлому месяцу', trend: 'up', icon: <FileCheck size={22} />, accent: 'green' },
  { label: 'Просрочено', value: '7', change: 'Требуют немедленного внимания', trend: 'down', icon: <AlertTriangle size={22} />, accent: 'red' },
];

const projectProgress: ProjectProgress[] = [
  { name: 'ЖК «Северный»', percent: 78, status: 'active' },
  { name: 'ТЦ «Меридиан»', percent: 45, status: 'review' },
  { name: 'Склад А-12', percent: 92, status: 'approved' },
  { name: 'Офис «Гамма»', percent: 23, status: 'overdue' },
  { name: 'ТЭЦ-5', percent: 61, status: 'active' },
];

const recentDocs: RecentDoc[] = [
  { id: '1', name: 'КЖ-01-001.dwg', project: 'ЖК «Северный»', status: 'На проверке', date: '09.05.2026', statusColor: 'yellow' },
  { id: '2', name: 'АР-03-015.pdf', project: 'ТЦ «Меридиан»', status: 'Согласован', date: '08.05.2026', statusColor: 'green' },
  { id: '3', name: 'ОВиК-02-008.docx', project: 'Склад А-12', status: 'Утверждён', date: '07.05.2026', statusColor: 'blue' },
  { id: '4', name: 'ЭОМ-05-003.dwg', project: 'Офис «Гамма»', status: 'Просрочен', date: '01.05.2026', statusColor: 'red' },
  { id: '5', name: 'КР-01-002.pdf', project: 'ТЭЦ-5', status: 'На согласовании', date: '06.05.2026', statusColor: 'yellow' },
];

/* ── Helpers ── */
const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'flat' }) => {
  if (trend === 'up') return <TrendingUp size={14} className="inline mr-1" />;
  if (trend === 'down') return <TrendingDown size={14} className="inline mr-1" />;
  return <Minus size={14} className="inline mr-1" />;
};

const StatusBadge = ({ color, text }: { color: string; text: string }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/15 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colorMap[color] || colorMap.blue}`}>
      {text}
    </span>
  );
};

const navCards = [
  { title: 'Портфель заказов', subtitle: 'Управление проектами', icon: <FolderKanban size={28} />, neon: 'neon-purple', path: '/projects' },
  { title: 'Документация', subtitle: 'Все документы проектов', icon: <FileText size={28} />, neon: 'neon-green', path: '/documents' },
  { title: 'Документооборот', subtitle: 'Задачи и замечания', icon: <ArrowLeftRight size={28} />, neon: 'neon-yellow', path: '/workflow' },
  { title: 'Архив', subtitle: 'История и версии', icon: <Archive size={28} />, neon: 'neon-gray', path: '/archive' },
];

/* ── Component ── */
export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ projects: 0, remarks: 0 });

  useEffect(() => {
    // TODO: replace with real API
    setStats({ projects: 12, remarks: 7 });
  }, []);

  return (
    <div className="min-h-screen w-full p-4 md:p-6 lg:p-8" style={{ background: 'var(--layout-bg)', color: 'var(--text-primary)' }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Панель управления
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Аналитика по проектам и документообороту
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>Проектов: <strong style={{ color: 'var(--text-primary)' }}>{stats.projects}</strong></span>
            <span className="mx-2">|</span>
            <span>Замечаний: <strong style={{ color: 'var(--text-primary)' }}>{stats.remarks}</strong></span>
          </div>
        </div>

        {/* ── KPI Cards (как на 1-й картинке) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi) => (
            <div
              key={kpi.label}
              className={`neon-${kpi.accent} p-5 transition-all duration-300 hover:scale-[1.02] kpi-${kpi.accent}`}
              style={{ background: 'var(--card-bg)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</span>
                <span style={{ color: `var(--iris-accent-${kpi.accent === 'blue' ? 'blue' : kpi.accent === 'yellow' ? 'cyan' : kpi.accent === 'green' ? 'green' : 'coral'})` }}>
                  {kpi.icon}
                </span>
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{kpi.value}</div>
              <div className="text-xs flex items-center" style={{ color: 'var(--text-muted)' }}>
                <TrendIcon trend={kpi.trend} />
                {kpi.change}
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts Row (как на 2-й картинке — placeholder для реальных графиков) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Line chart placeholder */}
          <div className="lg:col-span-2 chart-glow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Динамика документооборота</h3>
              <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--iris-bg-hover)', color: 'var(--text-secondary)' }}>Последние 30 дней</span>
            </div>
            {/* TODO: insert real chart here (Recharts / Chart.js) */}
            <div className="h-48 flex items-end justify-between gap-2 px-2">
              {[35, 45, 30, 55, 40, 60, 50, 70, 65, 80, 75, 90].map((h, i) => (
                <div key={i} className="w-full rounded-t" style={{ height: `${h}%`, background: `linear-gradient(to top, #4F7A4C, #6B5B95)` }} />
              ))}
            </div>
          </div>

          {/* Pie / Ring chart placeholder */}
          <div className="chart-glow flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold mb-4 w-full" style={{ color: 'var(--text-primary)' }}>Статусы документов</h3>
            {/* TODO: insert real pie chart */}
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#2F3654" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#4F7A4C" strokeWidth="12" strokeDasharray="75 251" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#D4AF37" strokeWidth="12" strokeDasharray="50 251" strokeDashoffset="-75" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" strokeWidth="12" strokeDasharray="40 251" strokeDashoffset="-125" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#FF6B6B" strokeWidth="12" strokeDasharray="25 251" strokeDashoffset="-165" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>1,247</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4F7A4C]" /> Согласовано</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D4AF37]" /> На проверке</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> В работе</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF6B6B]" /> Просрочено</span>
            </div>
          </div>
        </div>

        {/* ── Project Progress + Recent Docs ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Project progress bars */}
          <div className="chart-glow">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Прогресс проектов</h3>
            <div className="space-y-4">
              {projectProgress.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{p.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-elevated)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${p.percent}%`,
                        background: p.status === 'overdue' ? '#FF6B6B' : p.status === 'approved' ? '#4F7A4C' : p.status === 'review' ? '#D4AF37' : '#3B82F6',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent documents table */}
          <div className="chart-glow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Последние документы</h3>
              <button
                onClick={() => navigate('/documents')}
                className="text-xs font-medium hover:underline"
                style={{ color: 'var(--iris-accent-blue)' }}
              >
                Все документы →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-divider)' }}>
                    <th className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Документ</th>
                    <th className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Проект</th>
                    <th className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Статус</th>
                    <th className="text-left py-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--border-divider)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="py-2.5 pr-4" style={{ color: 'var(--text-primary)' }}>{doc.name}</td>
                      <td className="py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>{doc.project}</td>
                      <td className="py-2.5 pr-4"><StatusBadge color={doc.statusColor} text={doc.status} /></td>
                      <td className="py-2.5" style={{ color: 'var(--text-muted)' }}>{doc.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Загрузка команды ── */}
        <div className="mt-4">
          <TeamLoadSection />
        </div>

        {/* ── Quick Navigation (карточки разделов) ── */}
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Быстрый переход</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {navCards.map((card) => (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className={`${card.neon} p-4 text-left transition-all duration-300 hover:scale-[1.03] flex flex-col gap-2`}
              >
                <div className="w-fit p-2 rounded-lg" style={{ background: 'var(--card-elevated)' }}>
                  {card.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{card.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{card.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
