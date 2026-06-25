import { useState, useMemo, useEffect } from 'react';
import { useTabState } from '@/shared/hooks/useTabState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageTabs } from '@/shared/components/PageTabs';
import {
  FileText, Search, Upload, CheckCircle2, Clock,
  Eye, Download, Trophy, Flame, Award, Zap, Minus, Plus,
  FolderKanban, User, TrendingUp, BarChart3, Timer,
  ChevronRight, ChevronDown, MessageSquare, Send,
  CornerDownLeft, ArrowLeft, CheckCircle,
  Briefcase, UserCheck, X, FilePlus, FileSpreadsheet,
  Circle, AlertCircle, ArrowRight, FileCheck, Archive, Filter,
  GitBranch,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSessions, type TimeSession } from '@/features/time_tracking/api/sessions';
import { useAutoTimeTracker } from '@/features/time_tracking/hooks/useAutoTimeTracker';
import apiClient from '@/shared/api/client';
import { getLeaderboard } from '@/features/gamification/api/gamification';
import { getTasks } from '@/features/tasks/api/tasks';
import { getRemarks } from '@/features/remarks/api/remarks';
import type { LeaderboardEntry } from '@/types';
import type { Task } from '@/types';
import type { RemarkListItem } from '@/types/remarks';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';

/* ── Types ── */
type DocType = 'KJ' | 'AR' | 'OViK' | 'EOM' | 'KR' | 'other';
type DocStatus = 'draft' | 'review' | 'approved' | 'confirmed' | 'archived';
type TabKey = 'registry' | 'workflow' | 'employees';
type RemarkAction = 'revise' | 'approve' | 'delegate';

interface Employee {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}

interface DocRemark {
  id: string;
  text: string;
  author: string;
  date: string;
  status: 'open' | 'resolved' | 'closed';
  assignee?: string;
  action?: RemarkAction;
}

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
  remarks: DocRemark[];
}

const TAB_COLOR = '#4F7A4C';
const WORKFLOW_TAB_COLOR = '#D4AF37';
const TASKS_TAB_COLOR = '#3B82F6';

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

const actionConfig: Record<RemarkAction, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  revise:   { label: 'На доработку', color: '#D4AF37', bg: 'rgba(212,175,55,0.15)',  border: 'rgba(212,175,55,0.4)',  icon: <CornerDownLeft size={12} /> },
  approve:  { label: 'Согласовать',  color: '#4F7A4C', bg: 'rgba(79,122,76,0.15)',  border: 'rgba(79,122,76,0.4)',  icon: <CheckCircle size={12} /> },
  delegate: { label: 'Поручение',    color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', icon: <Briefcase size={12} /> },
};

/* ── Mock data ── */
const docsData: Document[] = [
  { id: 'd1', code: 'КЖ-01-001', name: 'Сборочный чертёж корпуса', project: 'ЖК «Северный»', type: 'KJ', status: 'approved', revision: 'Rev.1', author: 'Иванов А.С.', reviewer: 'Петров В.К.', date: '09.05.2026', size: '2.4 MB', format: 'dwg',
    remarks: [
      { id: 'r1', text: 'В узле примыкания балки к колонне указана арматура Ø12, но по расчёту требуется Ø16. Необходимо пересмотреть узел.', author: 'Петров В.К.', date: '09.05.2026', status: 'open', assignee: 'Иванов А.С.', action: 'revise' },
    ] },
  { id: 'd2', code: 'АР-03-015', name: 'Планировочное решение этажа', project: 'ТЦ «Меридиан»', type: 'AR', status: 'confirmed', revision: 'Rev.0', author: 'Сидорова Е.М.', reviewer: 'Козлов Д.А.', date: '08.05.2026', size: '5.1 MB', format: 'pdf',
    remarks: [
      { id: 'r2', text: 'На плане отсутствует отметка уровня пола 2 этажа. Требуется добавить отметку ±0.000 и все привязки.', author: 'Козлов Д.А.', date: '08.05.2026', status: 'open', assignee: 'Сидорова Е.М.', action: 'revise' },
    ] },
  { id: 'd3', code: 'ОВиК-02-008', name: 'Схема вентиляции подвала', project: 'Склад А-12', type: 'OViK', status: 'review', revision: 'Rev.2', author: 'Новикова И.П.', reviewer: 'Иванов А.С.', date: '07.05.2026', size: '1.8 MB', format: 'pdf',
    remarks: [
      { id: 'r3', text: 'Требуется уточнить производительность вентилятора в подвале. Сейчас указано 1000 м³/ч, по расчёту нужно 1500 м³/ч.', author: 'Иванов А.С.', date: '07.05.2026', status: 'resolved', assignee: 'Новикова И.П.', action: 'approve' },
    ] },
  { id: 'd4', code: 'ЭОМ-05-003', name: 'Однолинейная схема ТЭЦ-5', project: 'ТЭЦ-5', type: 'EOM', status: 'draft', revision: 'Rev.0', author: 'Козлов Д.А.', reviewer: '', date: '06.05.2026', size: '3.2 MB', format: 'dwg',
    remarks: [
      { id: 'r4', text: 'В спецификации указан кабель ВВГнг 4×16, но по нагрузке требуется ВВГнг 4×25.', author: 'Сидорова Е.М.', date: '06.05.2026', status: 'open', assignee: 'Козлов Д.А.', action: 'revise' },
    ] },
  { id: 'd5', code: 'КР-01-002', name: 'Расчёт железобетонных конструкций', project: 'ТЭЦ-5', type: 'KR', status: 'approved', revision: 'Rev.A', author: 'Петров В.К.', reviewer: 'Сидорова Е.М.', date: '05.05.2026', size: '8.7 MB', format: 'docx', remarks: [] },
  { id: 'd6', code: 'КЖ-02-004', name: 'Узел примыкания балки', project: 'ЖК «Северный»', type: 'KJ', status: 'review', revision: 'Rev.0', author: 'Иванов А.С.', reviewer: 'Петров В.К.', date: '04.05.2026', size: '1.1 MB', format: 'dwg',
    remarks: [
      { id: 'r5', text: 'Не хватает деталировки узла. Требуется добавить сечения А-А и Б-Б.', author: 'Петров В.К.', date: '04.05.2026', status: 'open', assignee: 'Иванов А.С.', action: 'revise' },
    ] },
  { id: 'd7', code: 'АР-04-001', name: 'Фасадный решение', project: 'Офис «Гамма»', type: 'AR', status: 'draft', revision: 'Rev.0', author: 'Сидорова Е.М.', reviewer: '', date: '03.05.2026', size: '4.5 MB', format: 'pdf', remarks: [] },
  { id: 'd8', code: 'ОВиК-03-002', name: 'Тепловой пункт', project: 'ТЦ «Меридиан»', type: 'OViK', status: 'confirmed', revision: 'Rev.1', author: 'Новикова И.П.', reviewer: 'Козлов Д.А.', date: '02.05.2026', size: '2.9 MB', format: 'pdf', remarks: [] },
];

/* ── Gamification data ── */
interface EmployeeWorkload {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  currentDoc: { code: string; name: string; project: string; daysLeft: number } | null;
  queue: { code: string; name: string; project: string }[];
  busyDays: number;
  approvedThisWeek: number;
  streak: number;
  level: number;
  xp: number;
  xpToNext: number;
  badges: string[];
  efficiency: number;
}

const employeeWorkloads: EmployeeWorkload[] = [
  {
    id: 'e1', name: 'Иванов А.С.', role: 'ГИП', initials: 'ИА', color: '#2563EB',
    currentDoc: { code: 'КЖ-02-004', name: 'Узел примыкания балки', project: 'ЖК «Северный»', daysLeft: 2 },
    queue: [
      { code: 'АР-04-001', name: 'Фасадный решение', project: 'Офис «Гамма»' },
    ],
    busyDays: 5, approvedThisWeek: 7, streak: 7, level: 12, xp: 840, xpToNext: 1000,
    badges: ['Главный по согласованиям', 'Марафонец'], efficiency: 92,
  },
  {
    id: 'e2', name: 'Петров В.К.', role: 'Инженер КЖ', initials: 'ПВ', color: '#4F7A4C',
    currentDoc: { code: 'КР-01-002', name: 'Расчёт железобетонных конструкций', project: 'ТЭЦ-5', daysLeft: 1 },
    queue: [
      { code: 'КЖ-01-001', name: 'Сборочный чертёж корпуса', project: 'ЖК «Северный»' },
      { code: 'КЖ-03-005', name: 'Армирование плиты перекрытия', project: 'ТЦ «Меридиан»' },
    ],
    busyDays: 8, approvedThisWeek: 12, streak: 5, level: 10, xp: 720, xpToNext: 900,
    badges: ['Мастер КЖ', 'Скоростной'], efficiency: 88,
  },
  {
    id: 'e3', name: 'Сидорова Е.М.', role: 'Инженер ОВ', initials: 'СЕ', color: '#6B5B95',
    currentDoc: { code: 'ОВиК-03-002', name: 'Тепловой пункт', project: 'ТЦ «Меридиан»', daysLeft: 3 },
    queue: [
      { code: 'ОВиК-04-006', name: 'Схема воздуховодов', project: 'Офис «Гамма»' },
    ],
    busyDays: 6, approvedThisWeek: 9, streak: 3, level: 9, xp: 650, xpToNext: 800,
    badges: ['Архивариус', 'Перфекционист'], efficiency: 85,
  },
  {
    id: 'e4', name: 'Козлов Д.А.', role: 'Инженер ЭОМ', initials: 'КД', color: '#D4AF37',
    currentDoc: { code: 'ЭОМ-05-003', name: 'Однолинейная схема ТЭЦ-5', project: 'ТЭЦ-5', daysLeft: 4 },
    queue: [],
    busyDays: 4, approvedThisWeek: 5, streak: 2, level: 7, xp: 480, xpToNext: 600,
    badges: ['Электрик'], efficiency: 78,
  },
  {
    id: 'e5', name: 'Новикова И.П.', role: 'Тендерный спец.', initials: 'НИ', color: '#3B82F6',
    currentDoc: null,
    queue: [
      { code: 'ТН-01-001', name: 'Техническое задание', project: 'Склад А-12' },
    ],
    busyDays: 2, approvedThisWeek: 4, streak: 2, level: 5, xp: 320, xpToNext: 500,
    badges: ['Новичок', 'Усердный'], efficiency: 72,
  },
];

const employees: Employee[] = employeeWorkloads.map(e => ({ id: e.id, name: e.name, role: e.role, initials: e.initials, color: e.color }));

/* ── Helpers ── */
function TypeBadge({ type }: { type: DocType }) {
  const cfg = docTypeConfig[type];
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>{cfg.label}</span>;
}

function StatusBadge({ status }: { status: DocStatus }) {
  const cfg = statusConfig[status];
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>{cfg.icon}{cfg.label}</span>;
}

function FileIcon({ type }: { type: DocType }) {
  const cfg = docTypeConfig[type];
  return <FileText size={14} style={{ color: cfg.color }} />;
}



/* ═══════════════════════════════════════════
   REGISTRY VIEW — VS Code three-panel layout
   ═══════════════════════════════════════════ */
function RegistryView() {
  const { autoStart } = useAutoTimeTracker();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>('ЖК «Северный»');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['ЖК «Северный»']));
  const [newRemarkText, setNewRemarkText] = useState('');
  const [newRemarkAction, setNewRemarkAction] = useState<RemarkAction>('revise');
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  const projects = useMemo(() => {
    const map = new Map<string, Document[]>();
    docsData.forEach(d => {
      if (!map.has(d.project)) map.set(d.project, []);
      map.get(d.project)!.push(d);
    });
    return map;
  }, []);

  const projectNames = Array.from(projects.keys());

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docsData;
    const q = searchQuery.toLowerCase();
    return docsData.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.project.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const selectedDoc = useMemo(() =>
    docsData.find(d => d.id === selectedDocId) || null,
  [selectedDocId]);

  const docsForProject = useMemo(() => {
    if (!selectedProject) return filteredDocs;
    return filteredDocs.filter(d => d.project === selectedProject);
  }, [selectedProject, filteredDocs]);

  const toggleProject = (project: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(project)) next.delete(project);
      else next.add(project);
      return next;
    });
    setSelectedProject(project);
  };

  const handleDocClick = async (doc: Document) => {
    setSelectedDocId(doc.id);
    setSelectedProject(doc.project);
    const numericId = Number.parseInt(doc.id, 10) || Number(doc.id.replace(/\D/g, '')) || undefined;
    await autoStart({ documentId: numericId, documentName: `${doc.code} — ${doc.name}` });
  };

  const handleAddRemark = () => {
    if (!newRemarkText.trim() || !selectedDoc) return;
    const remark: DocRemark = {
      id: `new-${Date.now()}`,
      text: newRemarkText.trim(),
      author: 'Администратор',
      date: new Date().toLocaleDateString('ru-RU'),
      status: 'open',
      action: newRemarkAction,
      assignee: newRemarkAction === 'delegate' ? (selectedAssignee || undefined) : undefined,
    };
    selectedDoc.remarks.push(remark);
    setNewRemarkText('');
    setSelectedAssignee('');
    setDelegateOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md flex-1 min-w-[200px] max-w-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по коду, названию или проекту..."
            className="bg-transparent text-xs outline-none w-full"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <button
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          style={{ background: TAB_COLOR, color: '#ffffff' }}
        >
          <Upload size={13} /> Загрузить
        </button>
      </div>

      {/* Three-panel grid — responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-0 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)', background: 'var(--card-bg)', minHeight: 'calc(100vh - 240px)' }}>

        {/* ═══ LEFT: PROJECTS ═══ */}
        <div className="flex flex-col" style={{ borderRight: '1px solid var(--border-default)', background: 'var(--bg-surface-2)' }}>
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-default)' }}>
            <span>Проекты</span>
            <span className="text-xs font-normal">{projectNames.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {projectNames.map(project => {
              const isExpanded = expandedProjects.has(project);
              const docs = projects.get(project) || [];
              const isSelected = selectedProject === project;


              return (
                <div key={project}>
                  <button
                    onClick={() => toggleProject(project)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left text-xs transition-colors"
                    style={{
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: isSelected ? 'var(--bg-surface-3)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-surface-3)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {isExpanded ? <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
                    <FolderKanban size={13} style={{ color: isSelected ? TAB_COLOR : 'var(--text-muted)' }} />
                    <span className="flex-1 truncate">{project}</span>
                    <span className="text-xs px-1 py-0 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>{docs.length}</span>
                  </button>
                  {isExpanded && (
                    <div>
                      {docs.map(doc => {
                        const isDocSelected = selectedDocId === doc.id;
                        const matchSearch = !searchQuery.trim() || doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.code.toLowerCase().includes(searchQuery.toLowerCase());
                        if (!matchSearch) return null;
                        return (
                          <button
                            key={doc.id}
                            onClick={() => handleDocClick(doc)}
                            className="w-full flex items-center gap-1.5 pl-7 pr-2 py-1 text-left transition-colors"
                            style={{
                              color: isDocSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                              background: isDocSelected ? 'var(--bg-surface-3)' : 'transparent',
                            }}
                            onMouseEnter={e => { if (!isDocSelected) e.currentTarget.style.background = 'var(--bg-surface-3)'; }}
                            onMouseLeave={e => { if (!isDocSelected) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <FileIcon type={doc.type} />
                            <span className="text-sm truncate flex-1 font-mono">{doc.code}</span>
                            {doc.remarks.length > 0 && (
                              <span className="text-xs px-1 rounded-full" style={{ background: 'rgba(255,107,107,0.2)', color: '#FF6B6B' }}>{doc.remarks.length}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ CENTER: DOCUMENT VIEWER ═══ */}
        <div className="flex flex-col" style={{ borderRight: '1px solid var(--border-default)' }}>
          {/* Center header */}
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-default)' }}>
            <span>{selectedDoc ? 'Просмотр документа' : 'Документы проекта'}</span>
            {selectedDoc && (
              <button
                onClick={() => setSelectedDocId(null)}
                className="flex items-center gap-1 text-xs font-normal transition-colors hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ArrowLeft size={10} /> Назад к списку
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!selectedDoc ? (
              /* Document list for selected project */
              <div className="p-3 space-y-1">
                {docsForProject.length === 0 && (
                  <div className="text-center py-8 text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Документы не найдены.
                  </div>
                )}
                {docsForProject.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocClick(doc)}
                    className="w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors"
                    style={{ background: 'transparent', border: '1px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                  >
                    <FileIcon type={doc.type} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium font-mono truncate" style={{ color: 'var(--text-primary)' }}>{doc.code}</div>
                      <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{doc.name}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <TypeBadge type={doc.type} />
                      <StatusBadge status={doc.status} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Document preview — compact */
              <div className="p-3 space-y-3">
                {/* Compact header */}
                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
                  <FileText size={16} style={{ color: docTypeConfig[selectedDoc.type].color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{selectedDoc.code}</h2>
                      <TypeBadge type={selectedDoc.type} />
                      <StatusBadge status={selectedDoc.status} />
                    </div>
                    <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{selectedDoc.name}</p>
                  </div>
                </div>

                {/* Compact meta — single row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Проект:</span> {selectedDoc.project}</span>
                  <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Ревизия:</span> {selectedDoc.revision}</span>
                  <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Автор:</span> {selectedDoc.author}</span>
                  {selectedDoc.reviewer && <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Проверяющий:</span> {selectedDoc.reviewer}</span>}
                  <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Дата:</span> {selectedDoc.date}</span>
                  <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Размер:</span> {selectedDoc.size} · {selectedDoc.format.toUpperCase()}</span>
                </div>

                {/* Preview placeholder */}
                <div className="rounded-lg p-3" style={{ background: 'var(--bg-surface-2)', border: '1px dashed var(--border-default)' }}>
                  <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Предпросмотр</div>
                  <div className="h-24 flex items-center justify-center rounded" style={{ background: 'var(--bg-surface)' }}>
                    <div className="text-center">
                      <FileText size={24} className="mx-auto mb-1" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Просмотр документа {selectedDoc.format.toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 text-xs py-1.5 rounded-md text-white text-center flex items-center justify-center gap-1.5" style={{ background: TAB_COLOR }}>
                    <Eye size={12} /> Открыть
                  </button>
                  <button className="flex-1 text-base md:text-lg font-medium leading-relaxed mt-1 py-1.5 rounded-md border text-center flex items-center justify-center gap-1.5 transition-colors" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}>
                    <Download size={12} /> Скачать
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: REMARKS ═══ */}
        <div className="flex flex-col" style={{ background: 'var(--bg-surface-2)' }}>
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-default)' }}>
            <span className="flex items-center gap-1.5">
              <MessageSquare size={10} />
              Замечания
            </span>
            {selectedDoc && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                {selectedDoc.remarks.length}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!selectedDoc ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageSquare size={24} className="mb-2" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                <p className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Выберите документ, чтобы увидеть замечания</p>
              </div>
            ) : selectedDoc.remarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <CheckCircle2 size={24} className="mb-2" style={{ color: '#4F7A4C', opacity: 0.5 }} />
                <p className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Замечаний нет</p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {selectedDoc.remarks.map(remark => {
                  const actionCfg = remark.action ? actionConfig[remark.action] : null;
                  return (
                    <div key={remark.id} className="p-2.5 rounded-lg space-y-1.5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                          {remark.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{remark.author}</span>
                            <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{remark.date}</span>
                          </div>
                          {remark.assignee && (
                            <div className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                              <UserCheck size={9} /> Исполнитель: {remark.assignee}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-base md:text-lg font-medium leading-relaxed mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{remark.text}</p>
                      <div className="flex items-center justify-between pt-1">
                        {actionCfg && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border" style={{ color: actionCfg.color, background: actionCfg.bg, borderColor: actionCfg.border }}>
                            {actionCfg.icon} {actionCfg.label}
                          </span>
                        )}
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                          color: remark.status === 'open' ? '#FF6B6B' : remark.status === 'resolved' ? '#4F7A4C' : '#6B7280',
                          background: remark.status === 'open' ? 'rgba(255,107,107,0.1)' : remark.status === 'resolved' ? 'rgba(79,122,76,0.1)' : 'rgba(107,114,128,0.1)',
                        }}>
                          {remark.status === 'open' ? 'Открыто' : remark.status === 'resolved' ? 'Решено' : 'Закрыто'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* New remark form */}
          {selectedDoc && (
            <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--border-default)', background: 'var(--card-bg)' }}>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Новое замечание</div>
              <textarea
                value={newRemarkText}
                onChange={e => setNewRemarkText(e.target.value)}
                placeholder="Опишите замечание..."
                rows={2}
                className="w-full text-xs rounded-md p-2 outline-none resize-none"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
              />
              <div className="flex gap-1.5 relative" ref={(el) => {
                if (!el) return;
                const handleClickOutside = (e: MouseEvent) => {
                  if (!el.contains(e.target as Node)) setDelegateOpen(false);
                };
                if (delegateOpen) document.addEventListener('mousedown', handleClickOutside);
                return () => document.removeEventListener('mousedown', handleClickOutside);
              }}>
                {(Object.keys(actionConfig) as RemarkAction[]).map(action => {
                  const cfg = actionConfig[action];
                  const isActive = newRemarkAction === action;
                  return (
                    <button
                      key={action}
                      onClick={() => {
                        if (action === 'delegate') {
                          if (newRemarkAction === 'delegate' && delegateOpen) {
                            setDelegateOpen(false);
                          } else {
                            setNewRemarkAction(action);
                            setDelegateOpen(true);
                          }
                        } else {
                          setNewRemarkAction(action);
                          setDelegateOpen(false);
                          setSelectedAssignee('');
                        }
                      }}
                      className="flex-1 text-xs px-2 py-1 rounded-md border transition-colors flex items-center justify-center gap-1"
                      style={{
                        color: cfg.color,
                        background: isActive ? cfg.bg : 'transparent',
                        borderColor: isActive ? cfg.border : 'var(--border-default)',
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
                {/* Delegate dropdown */}
                {delegateOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg p-2 space-y-1 z-10" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}>
                    <div className="flex items-center justify-between px-1 pb-1" style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Назначить исполнителя</span>
                      <button onClick={() => { setDelegateOpen(false); }} className="p-0.5 rounded" style={{ color: 'var(--text-muted)' }}><X size={10} /></button>
                    </div>
                    {employees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => {
                          setSelectedAssignee(emp.name);
                          setDelegateOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors text-sm"
                        style={{
                          background: selectedAssignee === emp.name ? 'var(--bg-surface-3)' : 'transparent',
                          color: selectedAssignee === emp.name ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                        onMouseEnter={e => { if (selectedAssignee !== emp.name) e.currentTarget.style.background = 'var(--bg-surface-3)'; }}
                        onMouseLeave={e => { if (selectedAssignee !== emp.name) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0" style={{ background: emp.color + '20', color: emp.color }}>
                          {emp.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{emp.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{emp.role}</div>
                        </div>
                        {selectedAssignee === emp.name && <CheckCircle size={10} style={{ color: '#4F7A4C' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddRemark}
                disabled={!newRemarkText.trim()}
                className="w-full text-xs py-1.5 rounded-md text-white flex items-center justify-center gap-1.5 transition-opacity"
                style={{ background: TAB_COLOR, opacity: newRemarkText.trim() ? 1 : 0.5 }}
              >
                <Send size={12} /> Отправить замечание
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   WORKFLOW VIEW — Tasks + Charts
   ═══════════════════════════════════════════ */
const PIE_COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'];
const LINE_COLORS = ['#3B82F6', '#10B981', '#EF4444'];

function tooltipStyle() {
  return {
    backgroundColor: 'var(--iris-bg-tooltip, rgba(11,14,20,0.95))',
    border: '1px solid var(--iris-border-subtle, rgba(255,255,255,0.1))',
    borderRadius: '8px',
    color: 'var(--iris-text-inverse, #E2E8F0)',
    fontSize: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.50)',
  };
}

function WorkflowView() {
  const [tab, setTab] = useState<'tasks' | 'remarks'>('tasks');
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [remarks, setRemarks] = useState<RemarkListItem[]>(mockRemarks);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'NEW' | 'IN_PROGRESS' | 'DONE'>('all');
  const [remarkSearch, setRemarkSearch] = useState('');
  const [remarkFilter, setRemarkFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    if (loaded) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getTasks().catch(() => null),
      getRemarks({ page: 1, page_size: 50 }).catch(() => null),
    ]).then(([tasksData, remarksData]) => {
      if (cancelled) return;
      if (tasksData?.length) setTasks(tasksData);
      if (remarksData?.items?.length) setRemarks(remarksData.items);
      setLoaded(true);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [loaded]);

  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase());
    const matchStatus = taskFilter === 'all' || t.status === taskFilter;
    return matchSearch && matchStatus;
  });

  const filteredRemarks = remarks.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(remarkSearch.toLowerCase());
    const matchStatus = remarkFilter === 'all' || r.status === remarkFilter;
    return matchSearch && matchStatus;
  });

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'IN_PROGRESS': return <Circle size={16} className="text-blue-500" />;
      case 'NEW': return <Circle size={16} className="text-gray-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'DONE': return 'Выполнена';
      case 'IN_PROGRESS': return 'В работе';
      case 'NEW': return 'Новая';
      default: return status;
    }
  };

  const getTaskStatusStyle = (status: string) => {
    switch (status) {
      case 'DONE': return { color: '#4F7A4C', bg: 'rgba(79,122,76,0.15)', border: 'rgba(79,122,76,0.4)' };
      case 'IN_PROGRESS': return { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)' };
      case 'NEW': return { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)' };
      default: return { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)' };
    }
  };

  const getRemarkStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'new': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRemarkStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved': return 'Устранено';
      case 'in_progress': return 'В работе';
      case 'new': return 'Новое';
      default: return status;
    }
  };

  const processCards = [
    { icon: <Upload size={20} />, count: tasks.filter(t => t.status === 'NEW').length, label: 'Загрузка', color: '#3B82F6', onClick: () => { setTab('tasks'); setTaskFilter('NEW'); } },
    { icon: <Search size={20} />, count: tasks.filter(t => t.status === 'IN_PROGRESS').length, label: 'Проверка', color: '#8B5CF6', onClick: () => { setTab('tasks'); setTaskFilter('IN_PROGRESS'); } },
    { icon: <FileCheck size={20} />, count: remarks.filter(r => r.status === 'in_progress').length, label: 'Согласование', color: '#F59E0B', onClick: () => { setTab('remarks'); setRemarkFilter('in_progress'); } },
    { icon: <Archive size={20} />, count: tasks.filter(t => t.status === 'DONE').length, label: 'Архив', color: '#6B7280', onClick: () => { setTab('tasks'); setTaskFilter('DONE'); } },
  ];

  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      const label = t.status === 'NEW' ? 'Новые' : t.status === 'IN_PROGRESS' ? 'В работе' : t.status === 'DONE' ? 'Выполнены' : t.status;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const templateBarData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      const template = t.title.split(':')[0] || 'Без шаблона';
      counts[template] = (counts[template] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const monthlyLineData = useMemo(() => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const counts: Record<string, number> = {};
    months.forEach(m => counts[m] = 0);
    tasks.forEach(t => {
      const date = t.due_date ? new Date(t.due_date) : null;
      if (date) {
        const m = months[date.getMonth()];
        counts[m] = (counts[m] || 0) + 1;
      }
    });
    if (Object.values(counts).every(v => v === 0)) {
      counts['Май'] = 2;
      counts['Июн'] = 3;
      counts['Июл'] = 1;
    }
    return months.map(m => ({ month: m, count: counts[m] || 0 }));
  }, [tasks]);

  const chartTextColor = 'var(--text-secondary, #8892A8)';
  const chartGridColor = 'var(--border-divider, rgba(255,255,255,0.06))';

  return (
    <div className="space-y-5">
      {/* Process cards */}
      <div className="flex flex-wrap items-center gap-3">
        {processCards.map((card, idx) => (
          <div key={card.label} className="flex items-center gap-3">
            <button
              type="button"
              onClick={card.onClick}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white transition-all hover:brightness-110 hover:shadow-lg cursor-pointer"
              style={{ backgroundColor: card.color }}
            >
              {card.icon}
              <div>
                <div className="text-lg font-bold">{card.count}</div>
                <div className="text-xs opacity-90">{card.label}</div>
              </div>
            </button>
            {idx < processCards.length - 1 && (
              <ArrowRight size={20} className="text-[#94a3b8]" />
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Распределение по статусам</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: chartTextColor, strokeOpacity: 0.4 }}
                >
                  {statusPieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} fillOpacity={0.85} stroke="var(--card-bg)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} formatter={(value, _name, props: any) => [`${value}`, props?.payload?.name ?? '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>По шаблонам</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={templateBarData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 10 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}`, 'Количество']} />
                <Bar dataKey="value" name="Количество" radius={[4, 4, 0, 0]}>
                  {templateBarData.map((_entry, index) => (
                    <Cell key={`bar-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Динамика запусков</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyLineData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="month" tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}`, 'Запуски']} />
                <Line type="monotone" dataKey="count" name="Запуски" stroke={LINE_COLORS[0]} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: 'var(--card-bg)' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {[
          { key: 'tasks' as const, label: 'Задачи', icon: <FileCheck size={16} />, count: filteredTasks.length, color: TASKS_TAB_COLOR },
          { key: 'remarks' as const, label: 'Замечания', icon: <AlertCircle size={16} />, count: filteredRemarks.length, color: WORKFLOW_TAB_COLOR },
        ].map(t => {
          const isSubActive = tab === t.key;
          const subColor = t.color;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
              style={{
                color: isSubActive ? subColor : 'var(--text-secondary)',
                backgroundColor: isSubActive ? `${subColor}26` : 'var(--bg-surface-2)',
                border: isSubActive ? `2px solid ${subColor}` : '2px solid transparent',
                boxShadow: isSubActive ? `0 0 8px ${subColor}40` : 'none',
              }}
            >
              {t.icon} {t.label} ({t.count})
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent" style={{ borderColor: WORKFLOW_TAB_COLOR }} />
          <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Загрузка...</span>
        </div>
      )}

      {/* ── TASKS TAB ── */}
      {!loading && tab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input value={taskSearch} onChange={e => setTaskSearch(e.target.value)} placeholder="Поиск по задаче..." className="bg-transparent outline-none text-sm w-48 md:w-72" style={{ color: 'var(--text-primary)' }} />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              {(['all', 'NEW', 'IN_PROGRESS', 'DONE'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setTaskFilter(s)}
                  className="text-xs px-2.5 py-1 rounded-md border transition-colors"
                  style={{
                    color: taskFilter === s ? getTaskStatusStyle(s).color : 'var(--text-secondary)',
                    borderColor: taskFilter === s ? getTaskStatusStyle(s).border : 'var(--border-default)',
                    background: taskFilter === s ? getTaskStatusStyle(s).bg : 'transparent',
                  }}
                >
                  {s === 'all' ? 'Все' : getTaskStatusLabel(s)}
                </button>
              ))}
            </div>
            <span className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Найдено: {filteredTasks.length}</span>
          </div>

          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck size={48} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Задачи не найдены. Измените фильтры или создайте новую.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const st = getTaskStatusStyle(task.status);
                return (
                  <div key={task.id} className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                      {getTaskStatusIcon(task.status)}
                      <div>
                        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-1.5 py-0.5 rounded border font-medium" style={{ color: st.color, borderColor: st.border, background: st.bg }}>{getTaskStatusLabel(task.status)}</span>
                          <span className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Срок: {task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : '—'}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium self-start sm:self-auto ${
                      task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                      task.priority === 'NORMAL' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{task.priority}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── REMARKS TAB ── */}
      {!loading && tab === 'remarks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input value={remarkSearch} onChange={e => setRemarkSearch(e.target.value)} placeholder="Поиск по замечанию..." className="bg-transparent outline-none text-sm w-48 md:w-72" style={{ color: 'var(--text-primary)' }} />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              {(['all', 'new', 'in_progress', 'resolved'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setRemarkFilter(s)}
                  className="text-xs px-2.5 py-1 rounded-md border transition-colors"
                  style={{
                    color: remarkFilter === s ? WORKFLOW_TAB_COLOR : 'var(--text-secondary)',
                    borderColor: remarkFilter === s ? 'rgba(212,175,55,0.4)' : 'var(--border-default)',
                    background: remarkFilter === s ? 'rgba(212,175,55,0.1)' : 'transparent',
                  }}
                >
                  {s === 'all' ? 'Все' : getRemarkStatusLabel(s)}
                </button>
              ))}
            </div>
            <span className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Найдено: {filteredRemarks.length}</span>
          </div>

          <div className="space-y-2">
            {filteredRemarks.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle size={48} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Замечания не найдены. Измените фильтры или создайте новое.</p>
              </div>
            ) : (
              filteredRemarks.map((remark) => (
                <div key={remark.id} className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-default)' }}>
                  <div>
                    <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{remark.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                      <span>{remark.project_name}</span>
                      <span>·</span>
                      <span>{remark.document_name}</span>
                      <span>·</span>
                      <span>Приоритет: {remark.priority}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium self-start sm:self-auto ${getRemarkStatusColor(remark.status)}`}>{getRemarkStatusLabel(remark.status)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mock fallback data for workflow ── */
const mockTasks: Task[] = [
  { id: 1, title: 'Согласовать КЖ-01-001 ЖК «Северный»', status: 'NEW', priority: 'HIGH', due_date: '2026-05-25', project_id: 1, assignee_id: 2, creator_id: 1, document_id: null, type: null, description: null, started_at: null, completed_at: null, planned_start: null, planned_finish: null, planned_hours: 0, actual_hours: 0, percent_complete: 0, engineer: null, is_critical: false, es: null, ef: null, ls: null, lf: null, slack: null },
  { id: 2, title: 'Проверить АР-03-015 ТЦ «Меридиан»', status: 'IN_PROGRESS', priority: 'NORMAL', due_date: '2026-05-28', project_id: 2, assignee_id: 3, creator_id: 1, document_id: null, type: null, description: null, started_at: null, completed_at: null, planned_start: null, planned_finish: null, planned_hours: 0, actual_hours: 0, percent_complete: 0, engineer: null, is_critical: false, es: null, ef: null, ls: null, lf: null, slack: null },
  { id: 3, title: 'Утвердить ОВиК-02-008 Склад А-12', status: 'DONE', priority: 'LOW', due_date: '2026-05-20', project_id: 3, assignee_id: 4, creator_id: 2, document_id: null, type: null, description: null, started_at: null, completed_at: null, planned_start: null, planned_finish: null, planned_hours: 0, actual_hours: 0, percent_complete: 100, engineer: null, is_critical: false, es: null, ef: null, ls: null, lf: null, slack: null },
  { id: 4, title: 'Согласовать ЭОМ-05-003 ТЭЦ-5', status: 'NEW', priority: 'HIGH', due_date: '2026-05-30', project_id: 4, assignee_id: 2, creator_id: 3, document_id: null, type: null, description: null, started_at: null, completed_at: null, planned_start: null, planned_finish: null, planned_hours: 0, actual_hours: 0, percent_complete: 0, engineer: null, is_critical: false, es: null, ef: null, ls: null, lf: null, slack: null },
  { id: 5, title: 'Проверить КР-01-002 ТЭЦ-5 (расчёт)', status: 'IN_PROGRESS', priority: 'NORMAL', due_date: '2026-06-05', project_id: 4, assignee_id: 5, creator_id: 1, document_id: null, type: null, description: null, started_at: null, completed_at: null, planned_start: null, planned_finish: null, planned_hours: 0, actual_hours: 0, percent_complete: 0, engineer: null, is_critical: false, es: null, ef: null, ls: null, lf: null, slack: null },
  { id: 6, title: 'Утвердить АР-04-001 Офис «Гамма»', status: 'DONE', priority: 'LOW', due_date: '2026-05-18', project_id: 5, assignee_id: 3, creator_id: 2, document_id: null, type: null, description: null, started_at: null, completed_at: null, planned_start: null, planned_finish: null, planned_hours: 0, actual_hours: 0, percent_complete: 100, engineer: null, is_critical: false, es: null, ef: null, ls: null, lf: null, slack: null },
];

const mockRemarks: RemarkListItem[] = [
  { id: 'r1', title: 'Несоответствие арматуры в КЖ-01-001', status: 'new', priority: 'high', category: 'design_error', author_id: 1, author_name: 'Иванов А.С.', created_at: '2026-05-22', updated_at: '2026-05-22', project_name: 'ЖК «Северный»', document_name: 'КЖ-01-001', assignee_name: 'Петров В.К.' },
  { id: 'r2', title: 'Уточнение вентфасада ТЦ «Меридиан»', status: 'in_progress', priority: 'medium', category: 'discrepancy', author_id: 2, author_name: 'Сидорова Е.М.', created_at: '2026-05-21', updated_at: '2026-05-21', project_name: 'ТЦ «Меридиан»', document_name: 'АР-03-015', assignee_name: 'Козлов Д.А.' },
  { id: 'r3', title: 'Замечания по гидроизоляции подвала', status: 'resolved', priority: 'high', category: 'norm_violation', author_id: 3, author_name: 'Новикова И.П.', created_at: '2026-05-20', updated_at: '2026-05-20', project_name: 'ЖК «Северный»', document_name: 'КР-01-002', assignee_name: 'Петров В.К.' },
  { id: 'r4', title: 'Корректировка однолинейной схемы', status: 'new', priority: 'low', category: 'incompleteness', author_id: 4, author_name: 'Козлов Д.А.', created_at: '2026-05-23', updated_at: '2026-05-23', project_name: 'ТЭЦ-5', document_name: 'ЭОМ-05-003', assignee_name: 'Иванов А.С.' },
  { id: 'r5', title: 'Узел балка-колонна: уточнить защитный слой', status: 'in_progress', priority: 'medium', category: 'design_error', author_id: 5, author_name: 'Петров В.К.', created_at: '2026-05-19', updated_at: '2026-05-19', project_name: 'ЖК «Южный парк»', document_name: 'КЖ-02-004', assignee_name: 'Сидорова Е.М.' },
];

/* ═══════════════════════════════════════════
   EMPLOYEES VIEW — Gamification + Workload
   ═══════════════════════════════════════════ */
const PALETTE = ['#2563EB', '#4F7A4C', '#6B5B95', '#D4AF37', '#3B82F6', '#FF6B6B', '#94A3B8'];

function getInitials(fullName: string): string {
  return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function mapWorkloadData(apiWorkload: any, leaderboard: LeaderboardEntry[]): EmployeeWorkload[] {
  if (!apiWorkload?.team || !Array.isArray(apiWorkload.team)) return employeeWorkloads;
  return apiWorkload.team.map((member: any, idx: number): EmployeeWorkload => {
    const lb = leaderboard.find(l => l.user_id === member.id);
    const weeklyHours = member.weekly_load?.reduce((s: number, w: any) => s + (w.hours || 0), 0) || 0;
    const busyDays = Math.round(weeklyHours / 8) || member.active_projects || 1;
    const level = lb?.level || 1;
    return {
      id: String(member.id),
      name: member.full_name || '—',
      role: member.role || '—',
      initials: getInitials(member.full_name || ''),
      color: PALETTE[idx % PALETTE.length],
      currentDoc: null,
      queue: [],
      busyDays,
      approvedThisWeek: 0,
      streak: 0,
      level,
      xp: lb?.score || 0,
      xpToNext: level * 100,
      badges: [],
      efficiency: Math.round(member.efficiency || 0),
    };
  });
}

function EmployeesView() {
  const [workloads, setWorkloads] = useState<EmployeeWorkload[]>(employeeWorkloads);
  const [loading, setLoading] = useState(true);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [delegateModalOpen, setDelegateModalOpen] = useState(false);
  const [fromEmpId, setFromEmpId] = useState('');
  const [toEmpId, setToEmpId] = useState('');
  const [taskToMove, setTaskToMove] = useState<{ code: string; name: string; project: string } | null>(null);
  const [timeSessions, setTimeSessions] = useState<Record<string, TimeSession[]>>({});
  const [timeLoading, setTimeLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiClient.get('/resources/workload').then(r => r.data).catch(() => null),
      getLeaderboard().catch(() => [] as LeaderboardEntry[]),
    ]).then(([workloadData, leaderboard]) => {
      if (cancelled) return;
      const mapped = mapWorkloadData(workloadData, leaderboard);
      setWorkloads(mapped);
      setLoading(false);
      setTimeLoading(true);
      Promise.all(
        mapped.map(emp =>
          getSessions({ user_id: parseInt(emp.id) || 0 })
            .then(data => ({ id: emp.id, sessions: data.items }))
            .catch(() => ({ id: emp.id, sessions: [] as TimeSession[] }))
        )
      ).then(results => {
        if (cancelled) return;
        const map: Record<string, TimeSession[]> = {};
        results.forEach(r => { map[r.id] = r.sessions; });
        setTimeSessions(map);
        setTimeLoading(false);
      });
    });
    return () => { cancelled = true; };
  }, []);

  const handleLoad = (empId: string) => {
    setWorkloads(prev => prev.map(e => {
      if (e.id !== empId) return e;
      const newDoc = { code: `ДОК-${Math.floor(Math.random() * 900) + 100}`, name: 'Новое задание', project: 'Внутренний' };
      return { ...e, queue: [...e.queue, newDoc], busyDays: e.busyDays + 2, xp: e.xp + 15 };
    }));
  };

  const handleUnload = (empId: string) => {
    setWorkloads(prev => prev.map(e => {
      if (e.id !== empId || e.queue.length === 0) return e;
      const newQueue = e.queue.slice(0, -1);
      return { ...e, queue: newQueue, busyDays: Math.max(0, e.busyDays - 2), xp: Math.max(0, e.xp - 5) };
    }));
  };

  const openDelegate = (fromId: string, task: { code: string; name: string; project: string }) => {
    setFromEmpId(fromId);
    setTaskToMove(task);
    setToEmpId('');
    setDelegateModalOpen(true);
  };

  const handleDelegate = () => {
    if (!taskToMove || !toEmpId || toEmpId === fromEmpId) return;
    setWorkloads(prev => prev.map(e => {
      if (e.id === fromEmpId) {
        const newQueue = e.queue.filter(q => q.code !== taskToMove.code);
        return { ...e, queue: newQueue, busyDays: Math.max(0, e.busyDays - 2) };
      }
      if (e.id === toEmpId) {
        return { ...e, queue: [...e.queue, taskToMove], busyDays: e.busyDays + 2, xp: e.xp + 10 };
      }
      return e;
    }));
    setDelegateModalOpen(false);
    setTaskToMove(null);
  };

  const sortedByEfficiency = [...workloads].sort((a, b) => b.efficiency - a.efficiency);
  const totalDocs = workloads.reduce((sum, e) => sum + (e.currentDoc ? 1 : 0) + e.queue.length, 0);
  const avgLoad = Math.round(workloads.reduce((sum, e) => sum + e.busyDays, 0) / workloads.length);

  return (
    <div className="space-y-4">
      {/* KPI header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Всего в работе', value: String(totalDocs), sub: 'документов', color: TAB_COLOR, icon: <FileText size={14} /> },
          { label: 'Средняя загрузка', value: `${avgLoad} дн.`, sub: 'на сотрудника', color: '#D4AF37', icon: <Clock size={14} /> },
          { label: 'Лучшая серия', value: `${Math.max(...workloads.map(e => e.streak))} дн.`, sub: 'без просрочек', color: '#FF6B6B', icon: <Flame size={14} /> },
          { label: 'Ср. эффективность', value: `${Math.round(workloads.reduce((s, e) => s + e.efficiency, 0) / workloads.length)}%`, sub: 'по команде', color: '#6B5B95', icon: <TrendingUp size={14} /> },
        ].map((item, i) => (
          <div key={i} className="p-3 rounded-lg flex flex-col gap-1" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center justify-between">
              <span className="text-base md:text-lg font-medium leading-relaxed mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
              <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: item.color + '15', color: item.color }}>
                {item.icon}
              </span>
            </div>
            <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid: Workload cards + Compact leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* LEFT: Employee workload cards */}
        <div className="space-y-3">
          {loading && (
            <div className="text-base md:text-lg font-medium leading-relaxed mt-1 p-4 rounded-lg text-center" style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)' }}>
              Загрузка данных сотрудников…
            </div>
          )}
          {!loading && workloads.length === 0 && (
            <div className="text-base md:text-lg font-medium leading-relaxed mt-1 p-4 rounded-lg text-center" style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)' }}>
              Нет данных о сотрудниках.
            </div>
          )}
          {workloads.map(emp => {
            const isSelected = selectedEmpId === emp.id;
            const loadPercent = Math.min(100, (emp.busyDays / 10) * 100);
            const loadColor = loadPercent > 80 ? '#FF6B6B' : loadPercent > 50 ? '#D4AF37' : '#4F7A4C';

            return (
              <div
                key={emp.id}
                className="rounded-xl p-3 transition-all cursor-pointer"
                style={{
                  background: 'var(--card-bg)',
                  border: isSelected ? `2px solid ${TAB_COLOR}` : '1px solid var(--border-default)',
                }}
                onClick={() => setSelectedEmpId(isSelected ? null : emp.id)}
              >
                {/* Header row */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: emp.color + '20', color: emp.color }}>
                    {emp.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{emp.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: TAB_COLOR + '15', color: TAB_COLOR }}>Lv.{emp.level}</span>
                    </div>
                    <div className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>{emp.role}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Load bar */}
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${loadPercent}%`, background: loadColor }} />
                    </div>
                    <span className="text-xs font-medium w-8 text-right" style={{ color: loadColor }}>{emp.busyDays}д</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                    {/* Time tracking */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Timer size={10} /> Активность
                      </div>
                      {timeLoading ? (
                        <div className="text-base md:text-lg font-medium leading-relaxed mt-1 p-2 rounded-lg text-center" style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)' }}>Загрузка...</div>
                      ) : (
                        (() => {
                          const sessions = timeSessions[emp.id] || [];
                          const totalActive = sessions.reduce((sum, s) => sum + (s.active_time || 0), 0);
                          const avgEff = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.efficiency_score || 0), 0) / sessions.length) : 0;
                          const currentSession = sessions.find(s => !s.ended_at);
                          const hours = Math.floor(totalActive / 3600);
                          const mins = Math.floor((totalActive % 3600) / 60);
                          return (
                            <div className="p-2 rounded-lg space-y-1.5" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
                              <div className="flex items-center justify-between text-xs">
                                <span style={{ color: 'var(--text-secondary)' }}>Время в работе:</span>
                                <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{hours}ч {mins}м</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span style={{ color: 'var(--text-secondary)' }}>Эффективность:</span>
                                <span className="font-medium" style={{ color: avgEff >= 80 ? '#4F7A4C' : avgEff >= 50 ? '#D4AF37' : '#FF6B6B' }}>{avgEff}%</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span style={{ color: 'var(--text-secondary)' }}>Сессий:</span>
                                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{sessions.length}</span>
                              </div>
                              {currentSession && (
                                <div className="text-xs px-2 py-1 rounded-full text-center" style={{ background: 'rgba(79,122,76,0.15)', color: '#4F7A4C' }}>
                                  <Timer size={9} className="inline mr-1" /> Сейчас в работе
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {/* Current document */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Текущий документ</div>
                      {emp.currentDoc ? (
                        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
                          <FileText size={14} style={{ color: TAB_COLOR }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{emp.currentDoc.code}</div>
                            <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{emp.currentDoc.name}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{emp.currentDoc.project}</div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: emp.currentDoc.daysLeft <= 1 ? 'rgba(255,107,107,0.15)' : 'rgba(212,175,55,0.15)', color: emp.currentDoc.daysLeft <= 1 ? '#FF6B6B' : '#D4AF37' }}>
                            {emp.currentDoc.daysLeft} дн.
                          </span>
                        </div>
                      ) : (
                        <div className="text-base md:text-lg font-medium leading-relaxed mt-1 p-2 rounded-lg text-center" style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)' }}>Свободен</div>
                      )}
                    </div>

                    {/* Queue */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Очередь ({emp.queue.length})</div>
                      <div className="space-y-1">
                        {emp.queue.map((task, qi) => (
                          <div key={qi} className="flex items-center gap-2 p-1.5 rounded-md text-sm" style={{ background: 'var(--bg-surface-2)' }}>
                            <span className="font-mono shrink-0" style={{ color: 'var(--text-secondary)' }}>{task.code}</span>
                            <span className="flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{task.name}</span>
                            <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{task.project}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); openDelegate(emp.id, task); }}
                              className="text-xs px-1.5 py-0.5 rounded border shrink-0 transition-colors"
                              style={{ color: TAB_COLOR, borderColor: TAB_COLOR + '40', background: TAB_COLOR + '10' }}
                            >
                              Делегировать
                            </button>
                          </div>
                        ))}
                        {emp.queue.length === 0 && (
                          <div className="text-base md:text-lg font-medium leading-relaxed mt-1 text-center py-1" style={{ color: 'var(--text-secondary)' }}>Очередь пуста</div>
                        )}
                      </div>
                    </div>

                    {/* XP bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: 'var(--text-muted)' }}>Опыт</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{emp.xp} / {emp.xpToNext} XP</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
                        <div className="h-full rounded-full" style={{ width: `${(emp.xp / emp.xpToNext) * 100}%`, background: TAB_COLOR }} />
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1">
                      {emp.badges.map((badge, bi) => (
                        <span key={bi} className="text-xs px-2 py-0.5 rounded-full border" style={{ color: TAB_COLOR, borderColor: TAB_COLOR + '30', background: TAB_COLOR + '10' }}>
                          <Zap size={9} className="inline mr-0.5" /> {badge}
                        </span>
                      ))}
                    </div>

                    {/* Manager controls */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLoad(emp.id); }}
                        className="flex-1 text-sm py-1.5 rounded-md text-white flex items-center justify-center gap-1 transition-opacity hover:opacity-90"
                        style={{ background: TAB_COLOR }}
                      >
                        <Plus size={12} /> Загрузить
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUnload(emp.id); }}
                        disabled={emp.queue.length === 0}
                        className="flex-1 text-sm py-1.5 rounded-md border flex items-center justify-center gap-1 transition-colors"
                        style={{ color: emp.queue.length ? 'var(--text-secondary)' : 'var(--text-muted)', borderColor: 'var(--border-default)', background: emp.queue.length ? 'var(--bg-surface-2)' : 'transparent', opacity: emp.queue.length ? 1 : 0.5 }}
                      >
                        <Minus size={12} /> Разгрузить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Compact leaderboard */}
        <div className="space-y-3">
          <div className="rounded-xl p-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={14} style={{ color: TAB_COLOR }} />
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Топ недели</h3>
            </div>
            <div className="space-y-2">
              {sortedByEfficiency.map((emp, i) => (
                <div key={emp.id} className="flex items-center gap-2 p-2 rounded-lg transition-colors" style={{ background: i === 0 ? TAB_COLOR + '08' : 'transparent' }}>
                  <div className="w-5 text-center text-base md:text-lg font-medium leading-relaxed mt-1 font-bold" style={{ color: i === 0 ? TAB_COLOR : i === 1 ? '#94A3B8' : i === 2 ? '#6B5B95' : 'var(--text-secondary)' }}>
                    {i + 1}
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: emp.color + '20', color: emp.color }}>
                    {emp.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{emp.name}</div>
                    <div className="flex items-center gap-1">
                      <div className="w-10 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
                        <div className="h-full rounded-full" style={{ width: `${emp.efficiency}%`, background: i === 0 ? TAB_COLOR : 'var(--text-muted)' }} />
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{emp.efficiency}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold" style={{ color: TAB_COLOR }}>{emp.approvedThisWeek}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>согл.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Efficiency chart mini */}
          <div className="rounded-xl p-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} style={{ color: TAB_COLOR }} />
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Загрузка команды</h3>
            </div>
            <div className="space-y-2">
              {workloads.map(emp => {
                const pct = Math.min(100, (emp.busyDays / 10) * 100);
                return (
                  <div key={emp.id} className="flex items-center gap-2">
                    <span className="text-xs w-16 truncate shrink-0" style={{ color: 'var(--text-secondary)' }}>{emp.initials}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 80 ? '#FF6B6B' : pct > 50 ? '#D4AF37' : TAB_COLOR }} />
                    </div>
                    <span className="text-xs w-6 text-right shrink-0" style={{ color: 'var(--text-muted)' }}>{emp.busyDays}д</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Delegate modal */}
      {delegateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setDelegateModalOpen(false)}>
          <div className="rounded-xl p-4 w-80 space-y-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Делегировать задачу</h3>
              <button onClick={() => setDelegateModalOpen(false)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
            </div>
            {taskToMove && (
              <div className="p-2 rounded-lg text-xs" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
                <div className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{taskToMove.code}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{taskToMove.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{taskToMove.project}</div>
              </div>
            )}
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Выбрать исполнителя</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {workloads.filter(e => e.id !== fromEmpId).map(emp => (
                <button
                  key={emp.id}
                  onClick={() => setToEmpId(emp.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors"
                  style={{
                    background: toEmpId === emp.id ? TAB_COLOR + '15' : 'var(--bg-surface-2)',
                    border: toEmpId === emp.id ? `1px solid ${TAB_COLOR}40` : '1px solid transparent',
                  }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0" style={{ background: emp.color + '20', color: emp.color }}>
                    {emp.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{emp.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{emp.role} · {emp.busyDays}д занят</div>
                  </div>
                  {toEmpId === emp.id && <CheckCircle size={12} style={{ color: TAB_COLOR }} />}
                </button>
              ))}
            </div>
            <button
              onClick={handleDelegate}
              disabled={!toEmpId}
              className="w-full text-xs py-2 rounded-md text-white flex items-center justify-center gap-1.5 transition-opacity"
              style={{ background: TAB_COLOR, opacity: toEmpId ? 1 : 0.5 }}
            >
              <Briefcase size={12} /> Передать задачу
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const DOC_TABS = [
  { key: 'registry' as const, label: 'Реестр документов', icon: <FileText size={16} />, color: TAB_COLOR },
  { key: 'workflow' as const, label: 'Документооборот', icon: <GitBranch size={16} />, color: TAB_COLOR },
  { key: 'employees' as const, label: 'Сотрудники', icon: <User size={16} />, color: TAB_COLOR },
];

/* ── Main Page ── */
export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useTabState<TabKey>('iris_documents_tab', 'registry');

  return (
    <div className="space-y-5 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <PageHeader
        title="Документы и согласования"
        subtitle="Управление проектной документацией, ревизиями и задачами согласования"
        actions={
          <>
            <Link
              to="/documents/new"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors"
              style={{ background: TAB_COLOR, color: '#ffffff' }}
            >
              <FilePlus size={13} /> Создать
            </Link>
            <Link
              to="/documents/import"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', background: 'var(--bg-surface-2)' }}
            >
              <FileSpreadsheet size={13} /> Импорт Excel
            </Link>
          </>
        }
      />

      <PageTabs tabs={DOC_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'registry' && <RegistryView />}
      {activeTab === 'workflow' && <WorkflowView />}
      {activeTab === 'employees' && <EmployeesView />}
    </div>
  );
}
