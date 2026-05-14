import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText, Search, Filter, Plus, Upload, CheckCircle2, Clock, AlertTriangle,
  Eye, Download, Trash2, ChevronDown, Star, Trophy, Flame, Award, ArrowUpRight,
  FolderKanban, User, Calendar, Hash
} from 'lucide-react';

/* ── Types ── */
type DocType = 'KJ' | 'AR' | 'OViK' | 'EOM' | 'KR' | 'other';
type DocStatus = 'draft' | 'review' | 'approved' | 'confirmed' | 'archived';

interface Document {
  id: string;
  code: string;
  name: string;
  project: string;
  type: DocType;
  status: DocStatus;
  revision: string;
  author: string;
  reviewer: string;
  date: string;
  size: string;
  format: string;
}

/* ── Configs ── */
const docTypeConfig: Record<DocType, { label: string; color: string; bg: string; border: string }> = {
  KJ:    { label: 'КЖ',  color: '#4F7A4C', bg: 'rgba(79,122,76,0.15)',  border: 'rgba(79,122,76,0.4)' },
  AR:    { label: 'АР',  color: '#6B5B95', bg: 'rgba(107,91,149,0.15)', border: 'rgba(107,91,149,0.4)' },
  OViK:  { label: 'ОВиК', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)' },
  EOM:   { label: 'ЭОМ', color: '#D4AF37', bg: 'rgba(212,175,55,0.15)',  border: 'rgba(212,175,55,0.4)' },
  KR:    { label: 'КР',  color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)', border: 'rgba(255,107,107,0.4)' },
  other: { label: 'Проч', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)' },
};

const statusConfig: Record<DocStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  draft:     { label: 'Черновик',      color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)', icon: <Clock size={12} /> },
  review:    { label: 'На проверке',   color: '#D4AF37', bg: 'rgba(212,175,55,0.15)',  border: 'rgba(212,175,55,0.4)',  icon: <Eye size={12} /> },
  approved:  { label: 'Согласован',    color: '#4F7A4C', bg: 'rgba(79,122,76,0.15)',  border: 'rgba(79,122,76,0.4)',  icon: <CheckCircle2 size={12} /> },
  confirmed: { label: 'Утверждён',     color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', icon: <Award size={12} /> },
  archived:  { label: 'В архиве',      color: '#6B7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.4)', icon: <FolderKanban size={12} /> },
};

/* ── Mock data ── */
const docsData: Document[] = [
  { id: 'd1', code: 'КЖ-01-001', name: 'Сборочный чертёж корпуса', project: 'ЖК «Северный»', type: 'KJ', status: 'approved', revision: 'Rev.1', author: 'Иванов А.С.', reviewer: 'Петров В.К.', date: '09.05.2026', size: '2.4 MB', format: 'dwg' },
  { id: 'd2', code: 'АР-03-015', name: 'Планировочное решение этажа', project: 'ТЦ «Меридиан»', type: 'AR', status: 'confirmed', revision: 'Rev.0', author: 'Сидорова Е.М.', reviewer: 'Козлов Д.А.', date: '08.05.2026', size: '5.1 MB', format: 'pdf' },
  { id: 'd3', code: 'ОВиК-02-008', name: 'Схема вентиляции подвала', project: 'Склад А-12', type: 'OViK', status: 'review', revision: 'Rev.2', author: 'Новикова И.П.', reviewer: 'Иванов А.С.', date: '07.05.2026', size: '1.8 MB', format: 'pdf' },
  { id: 'd4', code: 'ЭОМ-05-003', name: 'Однолинейная схема ТЭЦ-5', project: 'ТЭЦ-5', type: 'EOM', status: 'draft', revision: 'Rev.0', author: 'Козлов Д.А.', reviewer: '', date: '06.05.2026', size: '3.2 MB', format: 'dwg' },
  { id: 'd5', code: 'КР-01-002', name: 'Расчёт железобетонных конструкций', project: 'ТЭЦ-5', type: 'KR', status: 'approved', revision: 'Rev.A', author: 'Петров В.К.', reviewer: 'Сидорова Е.М.', date: '05.05.2026', size: '8.7 MB', format: 'docx' },
  { id: 'd6', code: 'КЖ-02-004', name: 'Узел примыкания балки', project: 'ЖК «Северный»', type: 'KJ', status: 'review', revision: 'Rev.0', author: 'Иванов А.С.', reviewer: 'Петров В.К.', date: '04.05.2026', size: '1.1 MB', format: 'dwg' },
  { id: 'd7', code: 'АР-04-001', name: 'Фасадный решение', project: 'Офис «Гамма»', type: 'AR', status: 'draft', revision: 'Rev.0', author: 'Сидорова Е.М.', reviewer: '', date: '03.05.2026', size: '4.5 MB', format: 'pdf' },
  { id: 'd8', code: 'ОВиК-03-002', name: 'Тепловой пункт', project: 'ТЦ «Меридиан»', type: 'OViK', status: 'confirmed', revision: 'Rev.1', author: 'Новикова И.П.', reviewer: 'Козлов Д.А.', date: '02.05.2026', size: '2.9 MB', format: 'pdf' },
];

/* ── Gamification data ── */
const leaderboard = [
  { name: 'Петров В.К.', role: 'Инженер КЖ', approved: 12, streak: 5, badges: ['Мастер КЖ', 'Скоростной'] },
  { name: 'Сидорова Е.М.', role: 'Инженер ОВ', approved: 9, streak: 3, badges: ['Архивариус'] },
  { name: 'Иванов А.С.', role: 'ГИП', approved: 7, streak: 7, badges: ['Главный по согласованиям'] },
  { name: 'Новикова И.П.', role: 'Тендерный спец.', approved: 4, streak: 2, badges: ['Новичок'] },
];

const myStats = {
  approvedThisWeek: 3,
  pendingReview: 2,
  streakDays: 5,
  rank: 3,
};

/* ── Helpers ── */
function TypeBadge({ type }: { type: DocType }) {
  const cfg = docTypeConfig[type];
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>{cfg.label}</span>;
}

function StatusBadge({ status }: { status: DocStatus }) {
  const cfg = statusConfig[status];
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>{cfg.icon}{cfg.label}</span>;
}

/* ── Main Page ── */
export default function DocumentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const search = searchParams.get('code') || '';
  const [filterType, setFilterType] = useState<DocType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<DocStatus | 'all'>('all');
  const [filterProject, setFilterProject] = useState('all');
  const [showGamification, setShowGamification] = useState(true);

  const filtered = docsData.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || d.type === filterType;
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchProject = filterProject === 'all' || d.project === filterProject;
    return matchSearch && matchType && matchStatus && matchProject;
  });

  const projects = Array.from(new Set(docsData.map(d => d.project)));

  return (
    <div className="min-h-screen w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Документация</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Управление проектной документацией и ревизиями</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowGamification(!showGamification)} className="px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors" style={{ color: '#D4AF37', borderColor: 'rgba(212,175,55,0.4)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <Trophy size={14} /> {showGamification ? 'Скрыть активность' : 'Показать активность'}
          </button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8942F 100%)', boxShadow: '0 4px 16px rgba(212,175,55,0.35)' }}>
            <Upload size={16} /> Загрузить
          </button>
        </div>
      </div>

      {/* ── Gamification Block ── */}
      {showGamification && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* My Stats */}
          <div className="neon-yellow p-5 space-y-4" style={{ background: 'var(--card-bg)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Star size={18} style={{ color: '#D4AF37' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Моя активность</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg" style={{ background: 'var(--iris-bg-hover)' }}>
                <div className="text-xl font-bold" style={{ color: '#D4AF37' }}>{myStats.approvedThisWeek}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Согласовано за неделю</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--iris-bg-hover)' }}>
                <div className="text-xl font-bold" style={{ color: '#FF6B6B' }}>{myStats.pendingReview}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>На проверке</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--iris-bg-hover)' }}>
                <div className="flex items-center gap-1">
                  <Flame size={16} style={{ color: '#FF6B6B' }} />
                  <span className="text-xl font-bold" style={{ color: '#FF6B6B' }}>{myStats.streakDays}</span>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Дней без просрочек</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--iris-bg-hover)' }}>
                <div className="flex items-center gap-1">
                  <Trophy size={16} style={{ color: '#D4AF37' }} />
                  <span className="text-xl font-bold" style={{ color: '#D4AF37' }}>#{myStats.rank}</span>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Место в рейтинге</div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-2 neon-yellow p-5" style={{ background: 'var(--card-bg)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Award size={18} style={{ color: '#D4AF37' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Топ согласовавших за неделю</h3>
            </div>
            <div className="space-y-2">
              {leaderboard.map((person, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg transition-colors" style={{ background: i === 0 ? 'rgba(212,175,55,0.1)' : 'transparent' }}>
                  <div className="w-6 text-center text-sm font-bold" style={{ color: i === 0 ? '#D4AF37' : i === 1 ? '#94A3B8' : i === 2 ? '#6B5B95' : 'var(--text-muted)' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--iris-accent-blue)', color: '#fff' }}>
                    {person.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{person.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{person.role}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#4F7A4C' }}>
                    <CheckCircle2 size={12} /> {person.approved}
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#FF6B6B' }}>
                    <Flame size={12} /> {person.streak}
                  </div>
                  <div className="hidden sm:flex gap-1">
                    {person.badges.map((badge, bi) => (
                      <span key={bi} className="text-[10px] px-1.5 py-0.5 rounded border" style={{ color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.08)' }}>{badge}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по коду или названию..." className="bg-transparent outline-none text-sm w-48 md:w-64" style={{ color: 'var(--text-primary)' }} />
        </div>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
          <option value="all">Все проекты</option>
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value as DocType | 'all')} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
          <option value="all">Все типы</option>
          {Object.entries(docTypeConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as DocStatus | 'all')} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
          <option value="all">Все статусы</option>
          {Object.entries(statusConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
        </select>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Найдено: {filtered.length}</span>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid #D4AF37' }}>
              <th className="text-left py-3 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Код</th>
              <th className="text-left py-3 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Документ</th>
              <th className="text-left py-3 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Тип</th>
              <th className="text-left py-3 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Проект</th>
              <th className="text-left py-3 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Статус</th>
              <th className="text-left py-3 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Ревизия</th>
              <th className="text-left py-3 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Автор / Проверяющий</th>
              <th className="text-left py-3 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Дата</th>
              <th className="text-left py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => (
              <tr
                key={doc.id}
                className="transition-colors"
                style={{ borderBottom: '1px solid var(--border-divider)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td className="py-3 pr-4 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{doc.code}</td>
                <td className="py-3 pr-4">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{doc.name}</div>
                  <div className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <FileText size={10} /> {doc.format.toUpperCase()} · {doc.size}
                  </div>
                </td>
                <td className="py-3 pr-4"><TypeBadge type={doc.type} /></td>
                <td className="py-3 pr-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{doc.project}</td>
                <td className="py-3 pr-4"><StatusBadge status={doc.status} /></td>
                <td className="py-3 pr-4">
                  <span className="text-xs font-mono px-2 py-0.5 rounded border" style={{ color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.08)' }}>
                    <Hash size={10} className="inline mr-1" />{doc.revision}
                  </span>
                </td>
                <td className="py-3 pr-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex items-center gap-1"><User size={10} /> {doc.author}</div>
                  {doc.reviewer && <div className="flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}><Eye size={10} /> {doc.reviewer}</div>}
                </td>
                <td className="py-3 pr-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <div className="flex items-center gap-1"><Calendar size={10} /> {doc.date}</div>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }} title="Просмотр"><Eye size={14} /></button>
                    <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }} title="Скачать"><Download size={14} /></button>
                    <button className="p-1.5 rounded-lg transition-colors" style={{ color: '#FF6B6B' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }} title="Удалить"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Документы не найдены. Измените фильтры или загрузите новые.</p>
        </div>
      )}
    </div>
  );
}
