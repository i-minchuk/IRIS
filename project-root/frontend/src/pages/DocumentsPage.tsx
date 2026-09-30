import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTabState } from '@/shared/hooks/useTabState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageTabs } from '@/shared/components/PageTabs';
import {
  FileText, Search, Upload, CheckCircle2, Clock,
  Eye, Download, Trophy, Flame, Award, Zap,
  FolderKanban, User, TrendingUp, BarChart3, Timer,
  ChevronRight, ChevronDown, MessageSquare, Send,
  CornerDownLeft, ArrowLeft, CheckCircle,
  Briefcase, UserCheck, X, FilePlus, FileSpreadsheet,
  AlertCircle, ArrowRight, FileCheck, Archive, Filter,
  GitBranch, Paperclip, Maximize2, Minimize2,
  Copy, Trash2, FolderInput, PenLine, ClipboardPaste, Scissors,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getSessions, type TimeSession } from '@/features/time_tracking/api/sessions';
import { useAutoTimeTracker } from '@/features/time_tracking/hooks/useAutoTimeTracker';
import apiClient from '@/shared/api/client';
import { getLeaderboard } from '@/features/gamification/api/gamification';
import { getRemarks, createRemark } from '@/features/remarks/api/remarks';
import { getDocuments, getDocument, uploadDocumentFile, downloadRevisionFile, approveDocument, getApprovalFeed, getActionTaskStatuses, setActionTaskStatus, updateDocument, copyDocument, deleteDocument, type ApprovalFeedItem, type DocumentItem, type ActionTaskStatus } from '@/features/documents/api/documents';
import ViewerContainer from '@/components/viewers/ViewerContainer';
import { getProjects, updateProject, deleteProject } from '@/features/projects/api/projects';
import { toast } from 'sonner';
import type { LeaderboardEntry } from '@/types';
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
  projectId: number;
  code: string;
  name: string;
  project: string;
  type: DocType;
  status: DocStatus;
  revision: string;
  author: string;
  reviewer: string;
  date: string;
  createdAt?: string | null;
  size: string;
  format: string;
  hasFile: boolean;
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

/* ── API data mapping ── */
const DOC_TYPE_MAP: Record<string, DocType> = {
  KJ: 'KJ', AR: 'AR', OVIK: 'OViK', EOM: 'EOM', KR: 'KR',
  'КЖ': 'KJ', 'АР': 'AR', 'ОВИК': 'OViK', 'ЭОМ': 'EOM',
};

function mapDocType(value?: string): DocType {
  return DOC_TYPE_MAP[(value || '').toUpperCase()] ?? 'other';
}

function mapDocStatus(value?: string): DocStatus {
  const v = (value || '').toLowerCase();
  if (v === 'draft' || v === 'approved' || v === 'confirmed' || v === 'archived') return v;
  if (v === 'review' || v === 'in_review' || v === 'on_review' || v === 'in_progress') return 'review';
  return 'draft';
}

function mapRemarkStatus(value: string): DocRemark['status'] {
  if (value === 'resolved') return 'resolved';
  if (value === 'closed' || value === 'rejected') return 'closed';
  return 'open';
}

function mapApiRemark(r: RemarkListItem): DocRemark {
  return {
    id: r.id,
    text: r.title,
    author: r.author_name || '—',
    date: r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : '—',
    status: mapRemarkStatus(r.status),
    assignee: r.assignee_name,
  };
}

function mapApiDocument(d: DocumentItem, projectName: string): Document {
  return {
    id: String(d.id),
    projectId: d.project_id,
    code: d.number || d.code || '—',
    name: d.name || d.title || '—',
    project: projectName,
    type: mapDocType(d.doc_type),
    status: mapDocStatus(d.status),
    revision: '—',
    author: '—',
    reviewer: '',
    date: d.created_at ? new Date(d.created_at).toLocaleDateString('ru-RU') : '—',
    createdAt: d.created_at || null,
    size: '—',
    format: '—',
    hasFile: d.has_file ?? false,
    remarks: [],
  };
}

function extractItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: T[] }).items;
  }
  return [];
}

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

/* ── Inline-редактор переименования (двойной клик) ── */
function InlineRename({
  initialValue,
  onSave,
  onCancel,
  className = '',
  style,
}: {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [text, setText] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onSave(text.trim());
  };

  return (
    <input
      ref={inputRef}
      value={text}
      className={`bg-transparent outline-none min-w-0 ${className}`}
      style={{ color: 'var(--text-primary)', ...style }}
      onChange={e => setText(e.target.value)}
      onClick={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
      onKeyDown={e => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') { doneRef.current = true; onCancel(); }
      }}
      onBlur={commit}
    />
  );
}



/* ── Пункт контекстного меню (правый клик) ── */
function ContextMenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors"
      style={{ color: danger ? '#F87171' : 'var(--text-primary)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════
   REGISTRY VIEW — VS Code three-panel layout
   ═══════════════════════════════════════════ */
function RegistryView() {
  const { autoStart } = useAutoTimeTracker();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [newRemarkText, setNewRemarkText] = useState('');
  const [newRemarkAction, setNewRemarkAction] = useState<RemarkAction>('revise');
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [docs, setDocs] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allProjects, setAllProjects] = useState<{ id: number; name: string; status?: string }[]>([]);

  // ── Предпросмотр файла выбранного документа ──
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewCacheRef = useRef<Map<number, { url: string; name: string }>>(new Map());

  // ── Полноэкранный режим предпросмотра ──
  const previewBoxRef = useRef<HTMLDivElement | null>(null);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const modalBoxRef = useRef<HTMLDivElement | null>(null);
  const [modalFullscreen, setModalFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setPreviewFullscreen(document.fullscreenElement === previewBoxRef.current);
      setModalFullscreen(document.fullscreenElement === modalBoxRef.current);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const togglePreviewFullscreen = () => {
    if (document.fullscreenElement === previewBoxRef.current) {
      void document.exitFullscreen();
    } else {
      void previewBoxRef.current?.requestFullscreen().catch(() => {
        toast.error('Не удалось развернуть предпросмотр на весь экран');
      });
    }
  };

  const toggleModalFullscreen = () => {
    if (document.fullscreenElement === modalBoxRef.current) {
      void document.exitFullscreen();
    } else {
      void modalBoxRef.current?.requestFullscreen().catch(() => {
        toast.error('Не удалось развернуть просмотр на весь экран');
      });
    }
  };

  // ── Модальное окно быстрого просмотра файла (по клику на скрепку) ──
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFile, setModalFile] = useState<{ url: string; name: string } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const openFilePreview = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    const numericId = Number.parseInt(doc.id, 10);
    if (!numericId) return;
    setModalOpen(true);
    setModalLoading(true);
    setModalFile(null);
    try {
      const file = await loadPreview(doc.id);
      if (file) {
        setModalFile(file);
      } else {
        toast.error('У документа нет загруженных файлов');
        setModalOpen(false);
      }
    } catch {
      toast.error('Не удалось загрузить файл');
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  // Закрытие модального окна по Escape
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      // В полноэкранном режиме Esc сначала сворачивает экран (обрабатывает браузер)
      if (e.key === 'Escape' && !document.fullscreenElement) setModalOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  // ── Ресайз колонок реестра (проекты / документы / замечания) ──
  const DEFAULT_LEFT_W = 220;
  const DEFAULT_RIGHT_W = 300;
  const LEFT_MIN = 160, LEFT_MAX = 480;
  const RIGHT_MIN = 240, RIGHT_MAX = 640;
  const [leftW, setLeftW] = useState(() => {
    const v = Number(localStorage.getItem('iris.registry.left_w'));
    return v >= LEFT_MIN && v <= LEFT_MAX ? v : DEFAULT_LEFT_W;
  });
  const [rightW, setRightW] = useState(() => {
    const v = Number(localStorage.getItem('iris.registry.right_w'));
    return v >= RIGHT_MIN && v <= RIGHT_MAX ? v : DEFAULT_RIGHT_W;
  });
  const [isLg, setIsLg] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const gridRef = useRef<HTMLDivElement>(null);
  const widthsRef = useRef({ left: leftW, right: rightW });
  widthsRef.current = { left: leftW, right: rightW };

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const fn = () => setIsLg(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const startResize = (side: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const onMove = (ev: MouseEvent) => {
      if (side === 'left') {
        setLeftW(Math.min(LEFT_MAX, Math.max(LEFT_MIN, Math.round(ev.clientX - rect.left))));
      } else {
        setRightW(Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, Math.round(rect.right - ev.clientX))));
      }
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      localStorage.setItem('iris.registry.left_w', String(widthsRef.current.left));
      localStorage.setItem('iris.registry.right_w', String(widthsRef.current.right));
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const resetWidths = (side: 'left' | 'right') => () => {
    if (side === 'left') {
      setLeftW(DEFAULT_LEFT_W);
      localStorage.removeItem('iris.registry.left_w');
    } else {
      setRightW(DEFAULT_RIGHT_W);
      localStorage.removeItem('iris.registry.right_w');
    }
  };

  const loadData = useCallback(async () => {
    setDocsLoading(true);
    try {
      const [apiDocs, projectsData, leaderboard] = await Promise.all([
        getDocuments().catch(() => [] as DocumentItem[]),
        getProjects().catch(() => [] as { id: number; name: string; status?: string }[]),
        getLeaderboard().catch(() => [] as LeaderboardEntry[]),
      ]);
      const projectsList = extractItems<{ id: number; name: string; status?: string }>(projectsData);
      const projectNamesMap = new Map(projectsList.map(p => [p.id, p.name]));
      setAllProjects(projectsList);
      setDocs(extractItems<DocumentItem>(apiDocs).map(d => mapApiDocument(d, projectNamesMap.get(d.project_id) || `Проект #${d.project_id}`)));
      setEmployees(extractItems<LeaderboardEntry>(leaderboard).map((l, i) => ({
        id: String(l.user_id),
        name: l.full_name,
        role: l.level_title,
        initials: getInitials(l.full_name),
        color: PALETTE[i % PALETTE.length],
      })));
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const projects = useMemo(() => {
    const map = new Map<string, Document[]>();
    // Все проекты «в работе» (active) показываем в колонке, даже без документов
    allProjects
      .filter(p => !p.status || p.status === 'active')
      .forEach(p => { if (!map.has(p.name)) map.set(p.name, []); });
    docs.forEach(d => {
      if (!map.has(d.project)) map.set(d.project, []);
      map.get(d.project)!.push(d);
    });
    return map;
  }, [docs, allProjects]);

  const projectNames = Array.from(projects.keys());

  // Поиск применяется только по клику «Найти» или Enter — см. runSearch
  const filteredDocs = useMemo(() => {
    if (!appliedQuery) return docs;
    const q = appliedQuery.toLowerCase();
    return docs.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.project.toLowerCase().includes(q)
    );
  }, [appliedQuery, docs]);

  const runSearch = () => setAppliedQuery(searchQuery.trim());

  const selectedDoc = useMemo(() =>
    docs.find(d => d.id === selectedDocId) || null,
  [selectedDocId, docs]);

  // ── Загрузка файла последней ревизии для предпросмотра ──
  const loadPreview = async (docId: string): Promise<{ url: string; name: string } | null> => {
    const numericId = Number.parseInt(docId, 10);
    if (!numericId) return null;
    const detail = await getDocument(numericId);
    const withFile = [...(detail.revisions ?? [])].reverse().find((r) => r.file_path);
    if (!withFile) return null;
    const cached = previewCacheRef.current.get(withFile.id);
    if (cached) return cached;
    const { filename, blob } = await downloadRevisionFile(numericId, withFile.id);
    const url = URL.createObjectURL(blob);
    const file = { url, name: filename };
    previewCacheRef.current.set(withFile.id, file);
    return file;
  };

  useEffect(() => {
    if (!selectedDocId) {
      setPreviewFile(null);
      return;
    }
    let cancelled = false;
    setPreviewFile(null);
    setPreviewLoading(true);
    loadPreview(selectedDocId)
      .then((file) => { if (!cancelled) setPreviewFile(file); })
      .catch(() => { if (!cancelled) setPreviewFile(null); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocId]);

  // Отзыв blob-URL при размонтировании
  useEffect(() => () => {
    previewCacheRef.current.forEach((f) => URL.revokeObjectURL(f.url));
    previewCacheRef.current.clear();
  }, []);

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

  // ── Переименование по двойному клику: проекты и документы ──
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  const startProjectRename = (project: string) => {
    // Разворачиваем проект, чтобы при двойном клике (два click) он остался раскрытым
    setExpandedProjects(prev => new Set(prev).add(project));
    setEditingProject(project);
  };

  const handleRenameProject = async (oldName: string, newName: string) => {
    setEditingProject(null);
    if (!newName || newName === oldName) return;
    const proj = allProjects.find(p => p.name === oldName);
    if (!proj) {
      toast.error('Проект не найден');
      return;
    }
    try {
      await updateProject(proj.id, { name: newName });
      toast.success('Проект переименован');
      await loadData();
    } catch {
      // ошибку показал интерцептор
    }
  };

  const handleRenameDoc = async (doc: Document, newName: string) => {
    setEditingDocId(null);
    if (!newName || newName === doc.name) return;
    const numericId = Number.parseInt(doc.id, 10);
    if (!numericId) return;
    try {
      await updateDocument(numericId, { name: newName });
      toast.success('Документ переименован');
      setDocs(prev => prev.map(d => (d.id === doc.id ? { ...d, name: newName } : d)));
    } catch {
      // ошибку показал интерцептор
    }
  };

  // В центральном списке одиночный клик открывает просмотр и размонтирует
  // список — чтобы отличить его от двойного клика, открытие откладываем.
  // Дерево слева не размонтируется, там клик остаётся мгновенным.
  const clickTimerRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
  }, []);

  const handleDocClickDelayed = (doc: Document) => {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      void handleDocClick(doc);
    }, 250);
  };

  const handleDocDoubleClick = (doc: Document) => {
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    setEditingDocId(doc.id);
  };

  // ── Контекстное меню (правый клик) ──
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    kind: 'project' | 'document' | 'background';
    projectName: string;
    doc?: Document;
  } | null>(null);

  const closeContextMenu = () => setContextMenu(null);

  const openContextMenu = (
    e: React.MouseEvent,
    kind: 'project' | 'document' | 'background',
    projectName: string,
    doc?: Document,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, kind, projectName, doc });
    // Выделяем объект под курсором
    setSelectedProject(projectName);
    if (doc) setSelectedDocId(doc.id);
  };

  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [contextMenu]);

  // ── Буфер обмена документами (копировать/вырезать → вставить в проект) ──
  // Хранится в localStorage, чтобы переживать перезагрузку страницы.
  // В режиме «вырезать» исходный документ исключается из работы после вставки.
  const CLIPBOARD_KEY = 'iris_clipboard_doc';
  type ClipboardEntry = Document & { isCut?: boolean };
  const [clipboardDoc, setClipboardDocState] = useState<ClipboardEntry | null>(() => {
    try {
      const raw = localStorage.getItem(CLIPBOARD_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw) as Partial<ClipboardEntry> | null;
      if (d && typeof d.id === 'string' && typeof d.code === 'string') {
        return d as ClipboardEntry;
      }
      return null;
    } catch {
      return null;
    }
  });

  const writeClipboard = (doc: ClipboardEntry | null) => {
    setClipboardDocState(doc);
    try {
      if (doc) {
        localStorage.setItem(
          CLIPBOARD_KEY,
          JSON.stringify({ id: doc.id, code: doc.code, name: doc.name, project: doc.project, isCut: !!doc.isCut }),
        );
      } else {
        localStorage.removeItem(CLIPBOARD_KEY);
      }
    } catch {
      // localStorage недоступен — буфер останется только в памяти
    }
  };

  const handleCopyDoc = (doc: Document) => {
    closeContextMenu();
    writeClipboard({ ...doc, isCut: false });
    toast.success(`Скопировано: «${doc.code}». Вставьте в нужный проект через правый клик или Ctrl+V.`);
  };

  // Стиль «вырезанного» документа: полупрозрачность, как в проводнике Windows
  const cutDocStyle = (doc: Document): React.CSSProperties | undefined =>
    clipboardDoc?.isCut && clipboardDoc.id === doc.id ? { opacity: 0.45 } : undefined;

  const handleCutDoc = (doc: Document) => {
    closeContextMenu();
    writeClipboard({ ...doc, isCut: true });
    toast.success(`Вырезано: «${doc.code}». Вставьте в нужный проект — исходный документ будет исключён из работы.`);
  };

  const handlePasteDoc = async (targetProjectName: string) => {
    closeContextMenu();
    if (!clipboardDoc) return;
    const numericId = Number.parseInt(clipboardDoc.id, 10);
    const targetProj = allProjects.find(p => p.name === targetProjectName);
    if (!numericId || !targetProj) return;
    if (clipboardDoc.isCut && clipboardDoc.project === targetProjectName) {
      writeClipboard(null);
      toast.info('Документ уже находится в этом проекте — вырезание отменено');
      return;
    }
    try {
      // Копируем документ, затем переносим копию в целевой проект
      const copy = await copyDocument(numericId);
      if (copy?.id) {
        await updateDocument(copy.id, { project_id: targetProj.id });
      }
      if (clipboardDoc.isCut) {
        // Вырезание: исключаем исходный документ из работы (восстановим через архив при необходимости)
        await deleteDocument(numericId);
        writeClipboard(null);
        toast.success(`Документ перемещён в «${targetProjectName}»`);
      } else {
        toast.success(`Документ вставлен в «${targetProjectName}»`);
      }
      if (selectedDocId === clipboardDoc.id) setSelectedDocId(null);
      await loadData();
    } catch {
      // ошибку показал интерцептор
    }
  };

  // Горячие клавиши: Ctrl+C — скопировать выбранный документ, Ctrl+V — вставить в выбранный проект
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.key.toLowerCase() === 'c' && selectedDoc) {
        e.preventDefault();
        writeClipboard({ ...selectedDoc, isCut: false });
        toast.success(`Скопировано: «${selectedDoc.code}». Вставьте через правый клик по проекту или Ctrl+V.`);
      }
      if (e.key.toLowerCase() === 'v' && clipboardDoc && selectedProject) {
        e.preventDefault();
        void handlePasteDoc(selectedProject);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoc, selectedProject, clipboardDoc, allProjects]);


  // ── Диалог исключения документа из работы ──
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteDoc = (doc: Document) => {
    closeContextMenu();
    setDeleteDoc(doc);
    setDeleteReason('');
  };

  const handleConfirmDeleteDoc = async () => {
    if (!deleteDoc) return;
    const numericId = Number.parseInt(deleteDoc.id, 10);
    if (!numericId) return;
    setDeleteLoading(true);
    try {
      await deleteDocument(numericId, deleteReason.trim() || undefined);
      toast.success('Документ исключён из работы');
      if (selectedDocId === deleteDoc.id) setSelectedDocId(null);
      setDeleteDoc(null);
      setDeleteReason('');
      await loadData();
    } catch {
      // ошибку показал интерцептор
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteProject = async (projectName: string) => {
    closeContextMenu();
    const proj = allProjects.find(p => p.name === projectName);
    if (!proj) {
      toast.error('Проект не найден');
      return;
    }
    if (!window.confirm(`Удалить проект «${projectName}»? Действие необратимо.`)) return;
    try {
      await deleteProject(proj.id);
      toast.success('Проект удалён');
      if (selectedProject === projectName) setSelectedProject(null);
      await loadData();
    } catch {
      // ошибку показал интерцептор
    }
  };

  // ── Перемещение документа в другой проект ──
  const [moveDoc, setMoveDoc] = useState<Document | null>(null);
  const [moveTarget, setMoveTarget] = useState('');
  const [moveLoading, setMoveLoading] = useState(false);

  const moveTargets = useMemo(
    () => allProjects.filter(p => p.name !== moveDoc?.project),
    [allProjects, moveDoc],
  );

  const handleMoveDoc = async () => {
    if (!moveDoc || !moveTarget) return;
    const numericId = Number.parseInt(moveDoc.id, 10);
    const targetProj = allProjects.find(p => p.name === moveTarget);
    if (!numericId || !targetProj) return;
    setMoveLoading(true);
    try {
      await updateDocument(numericId, { project_id: targetProj.id });
      toast.success(`Документ перемещён в «${moveTarget}»`);
      setMoveDoc(null);
      setMoveTarget('');
      await loadData();
    } catch {
      // ошибку показал интерцептор
    } finally {
      setMoveLoading(false);
    }
  };

  const handleDocClick = async (doc: Document) => {
    setSelectedDocId(doc.id);
    setSelectedProject(doc.project);
    const numericId = Number.parseInt(doc.id, 10) || undefined;
    await autoStart({ documentId: numericId, documentName: `${doc.code} — ${doc.name}` });
    if (numericId) {
      try {
        const res = await getRemarks({ document_id: numericId, page: 1, page_size: 100 });
        const remarks = res.items.map(mapApiRemark);
        setDocs(prev => prev.map(d => (d.id === doc.id ? { ...d, remarks } : d)));
      } catch {
        setDocs(prev => prev.map(d => (d.id === doc.id ? { ...d, remarks: [] } : d)));
      }
    }
  };

  const handlePanelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedDoc) return;
    const numericId = Number.parseInt(selectedDoc.id, 10);
    if (!numericId) {
      toast.error('Не удалось определить документ');
      return;
    }
    try {
      await uploadDocumentFile(numericId, file);
      toast.success(`Файл «${file.name}» загружен`);
      previewCacheRef.current.clear();
      setPreviewLoading(true);
      loadPreview(selectedDoc.id)
        .then((f) => setPreviewFile(f))
        .catch(() => setPreviewFile(null))
        .finally(() => setPreviewLoading(false));
    } catch {
      toast.error('Не удалось загрузить файл');
    }
  };

  const handlePanelOpen = () => {
    if (selectedDoc) navigate(`/documents/${selectedDoc.id}`);
  };

  const handlePanelDownload = async () => {
    if (!selectedDoc) return;
    const numericId = Number.parseInt(selectedDoc.id, 10);
    if (!numericId) return;
    try {
      const detail = await getDocument(numericId);
      const withFile = [...(detail.revisions ?? [])].reverse().find((r) => r.file_path);
      if (!withFile) {
        toast.error('У документа нет загруженных файлов');
        return;
      }
      const { filename, blob } = await downloadRevisionFile(numericId, withFile.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Не удалось скачать файл');
    }
  };

  const handleAddRemark = async () => {
    if (!selectedDoc) return;
    const numericId = Number.parseInt(selectedDoc.id, 10);
    if (!numericId) return;

    // «Согласовать» — запускает цепочку согласования документа
    if (newRemarkAction === 'approve') {
      try {
        const result = await approveDocument(numericId);
        setDocs(prev => prev.map(d => (d.id === selectedDoc.id ? { ...d, status: result.status as Document['status'] } : d)));
        if (result.approved) {
          toast.success(`Документ утверждён — все согласующие подтвердили (${result.approvals.length})`);
        } else if (result.next_approver) {
          toast.success(`Согласовано. Следующий согласующий: ${result.next_approver.user_name}`);
        } else {
          toast.success('Согласовано. Ожидаются остальные согласующие');
        }
      } catch {
        return; // ошибка (дубль, не в списке и т.п.) — toast показал интерцептор
      }
    }

    if (!newRemarkText.trim()) {
      setNewRemarkText('');
      setSelectedAssignee('');
      setDelegateOpen(false);
      return;
    }

    try {
      await createRemark({
        document_id: numericId,
        project_id: selectedDoc.projectId,
        source: 'manual',
        priority: 'medium',
        category: 'other',
        title: newRemarkText.trim(),
        description: newRemarkText.trim(),
        assignee_id: newRemarkAction === 'delegate' && selectedAssignee ? Number(selectedAssignee) : undefined,
      });
      const res = await getRemarks({ document_id: numericId, page: 1, page_size: 100 });
      const remarks = res.items.map(mapApiRemark);
      setDocs(prev => prev.map(d => (d.id === selectedDoc.id ? { ...d, remarks } : d)));
    } catch {
      // ошибка создания замечания — список остаётся без изменений
    }
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
            onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
            placeholder="Поиск по коду, названию или проекту..."
            className="bg-transparent text-xs outline-none w-full"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <button
          onClick={runSearch}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          style={{ background: TAB_COLOR, color: '#ffffff' }}
        >
          <Search size={13} /> Найти
        </button>
      </div>

      {/* Three-panel grid — responsive, ресайз колонок перетаскиванием разделителей */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 lg:grid-flow-col gap-0 rounded-xl overflow-hidden"
        style={{
          border: '1px solid var(--border-default)',
          background: 'var(--card-bg)',
          ...(isLg
            ? { gridTemplateColumns: `${leftW}px 5px minmax(0, 1fr) 5px ${rightW}px`, height: 'calc(100vh - 310px)' }
            : { minHeight: 'calc(100vh - 310px)' }),
        }}
      >

        {/* ═══ LEFT: PROJECTS ═══ */}
        <div className="flex flex-col min-w-0" style={{ background: 'var(--bg-surface-2)' }}>
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
                    onDoubleClick={() => startProjectRename(project)}
                    onContextMenu={(e) => openContextMenu(e, 'project', project)}
                    title="Двойной клик — переименовать, правый клик — меню"
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
                    {editingProject === project ? (
                      <InlineRename
                        className="flex-1 truncate"
                        initialValue={project}
                        onSave={(v) => void handleRenameProject(project, v)}
                        onCancel={() => setEditingProject(null)}
                      />
                    ) : (
                      <span className="flex-1 truncate">{project}</span>
                    )}
                    <span className="text-xs px-1 py-0 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>{docs.length}</span>
                  </button>
                  {isExpanded && (
                    <div>
                      {docs.map(doc => {
                        const isDocSelected = selectedDocId === doc.id;
                        const matchSearch = !appliedQuery || doc.name.toLowerCase().includes(appliedQuery.toLowerCase()) || doc.code.toLowerCase().includes(appliedQuery.toLowerCase());
                        if (!matchSearch) return null;
                        return (
                          <button
                            key={doc.id}
                            onClick={() => handleDocClick(doc)}
                            onDoubleClick={() => setEditingDocId(doc.id)}
                            onContextMenu={(e) => openContextMenu(e, 'document', doc.project, doc)}
                            title="Двойной клик — переименовать, правый клик — меню"
                            className="w-full flex items-center gap-1.5 pl-7 pr-2 py-1 text-left transition-colors"
                            style={{
                              color: isDocSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                              background: isDocSelected ? 'var(--bg-surface-3)' : 'transparent',
                              ...cutDocStyle(doc),
                            }}
                            onMouseEnter={e => { if (!isDocSelected) e.currentTarget.style.background = 'var(--bg-surface-3)'; }}
                            onMouseLeave={e => { if (!isDocSelected) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <FileIcon type={doc.type} />
                            {editingDocId === doc.id ? (
                              <InlineRename
                                className="text-sm truncate flex-1 font-mono"
                                initialValue={doc.name}
                                onSave={(v) => void handleRenameDoc(doc, v)}
                                onCancel={() => setEditingDocId(null)}
                              />
                            ) : (
                              <span className="text-sm truncate flex-1 font-mono">{doc.code}</span>
                            )}
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

        {/* Разделитель проекты/документы */}
        <div
          onMouseDown={startResize('left')}
          onDoubleClick={resetWidths('left')}
          className="hidden lg:block shrink-0 cursor-col-resize"
          style={{ background: 'var(--border-default)' }}
          title="Потяните, чтобы изменить ширину. Двойной клик — сброс"
        />

        {/* ═══ CENTER: DOCUMENT VIEWER ═══ */}
        <div className="flex flex-col min-w-0 min-h-0">
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

          <div className="flex-1 min-h-0 overflow-y-auto">
            {!selectedDoc ? (
              /* Document list for selected project */
              <div
                className="p-3 space-y-1"
                onContextMenu={(e) => {
                  // ПКМ по пустому месту списка — вставка в выбранный проект без открытия карточки
                  if (!clipboardDoc || !selectedProject) return;
                  openContextMenu(e, 'background', selectedProject);
                }}
              >
                {docsForProject.length === 0 && (
                  <div className="text-center py-8 text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {docsLoading ? 'Загрузка документов…' : 'Документы не найдены.'}
                  </div>
                )}
                {docsForProject.map(doc => (
                  <div
                    key={doc.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleDocClickDelayed(doc)}
                    onDoubleClick={() => handleDocDoubleClick(doc)}
                    onContextMenu={(e) => openContextMenu(e, 'document', doc.project, doc)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDocClick(doc); }}
                    className="w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors cursor-pointer"
                    style={{ background: 'transparent', border: '1px solid transparent', ...cutDocStyle(doc) }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                  >
                    <FileIcon type={doc.type} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium font-mono truncate" style={{ color: 'var(--text-primary)' }}>{doc.code}</div>
                      {editingDocId === doc.id ? (
                        <InlineRename
                          className="text-sm truncate w-full"
                          initialValue={doc.name}
                          onSave={(v) => void handleRenameDoc(doc, v)}
                          onCancel={() => setEditingDocId(null)}
                        />
                      ) : (
                        <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{doc.name}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <TypeBadge type={doc.type} />
                      <StatusBadge status={doc.status} />
                      {doc.hasFile ? (
                        <button
                          type="button"
                          title="Файл прикреплён — открыть предпросмотр"
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium transition-transform hover:scale-105"
                          style={{ color: '#4F7A4C', background: 'rgba(79,122,76,0.15)', borderColor: 'rgba(79,122,76,0.4)' }}
                          onClick={(e) => { void openFilePreview(doc, e); }}
                        >
                          <Paperclip size={10} />
                          Файл
                        </button>
                      ) : (
                        <span
                          title="Файл не загружен"
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium"
                          style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}
                        >
                          <Paperclip size={10} />
                          Нет файла
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Document preview — compact */
              <div className="p-3 space-y-3 flex flex-col" style={{ height: '100%', minHeight: 500 }}>
                {/* Compact header */}
                <div className="flex items-center gap-2 p-2 rounded-lg shrink-0" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
                  <FileText size={16} style={{ color: docTypeConfig[selectedDoc.type].color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{selectedDoc.code}</h2>
                      <TypeBadge type={selectedDoc.type} />
                      <StatusBadge status={selectedDoc.status} />
                      {selectedDoc.hasFile ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium"
                          title="Файл прикреплён"
                          style={{ color: '#4F7A4C', background: 'rgba(79,122,76,0.15)', borderColor: 'rgba(79,122,76,0.4)' }}
                        >
                          <Paperclip size={10} />
                          Файл
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium"
                          title="Файл не загружен"
                          style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}
                        >
                          <Paperclip size={10} />
                          Нет файла
                        </span>
                      )}
                    </div>
                    <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{selectedDoc.name}</p>
                  </div>
                </div>

                {/* Compact meta — single row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm shrink-0">
                  <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Проект:</span> {selectedDoc.project}</span>
                  <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Ревизия:</span> {selectedDoc.revision}</span>
                  <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Автор:</span> {selectedDoc.author}</span>
                  {selectedDoc.reviewer && <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Проверяющий:</span> {selectedDoc.reviewer}</span>}
                  <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Дата:</span> {selectedDoc.date}</span>
                  <span style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>Размер:</span> {selectedDoc.size} · {selectedDoc.format.toUpperCase()}</span>
                </div>

                {/* Preview — real file viewer, растягивается до низа страницы */}
                <div
                  ref={previewBoxRef}
                  className="rounded-lg overflow-hidden flex flex-col flex-1"
                  style={{ border: '1px solid var(--border-default)', minHeight: 240, background: 'var(--bg-app)' }}
                >
                  <div
                    className="px-3 py-1.5 flex items-center gap-2 shrink-0"
                    style={{ background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-default)' }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Предпросмотр{previewFile ? ` — ${previewFile.name}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={togglePreviewFullscreen}
                      title={previewFullscreen ? 'Свернуть' : 'Развернуть на весь экран'}
                      className="ml-auto inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                      style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
                    >
                      {previewFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                      {previewFullscreen ? 'Свернуть' : 'На весь экран'}
                    </button>
                  </div>
                  <div className="flex-1 min-h-0" style={{ background: 'var(--bg-surface)' }}>
                    {previewLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div
                            className="w-8 h-8 border-2 border-t-2 rounded-full animate-spin mx-auto mb-2"
                            style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--accent-engineering)' }}
                          />
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Загрузка файла…</p>
                        </div>
                      </div>
                    ) : previewFile ? (
                      <div className="h-full flex flex-col">
                        <ViewerContainer fileUrl={previewFile.url} fileName={previewFile.name} hideDownload hideFileName />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <Upload size={24} className="mx-auto mb-1" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Файл документа не загружен.
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                            Загрузите файл кнопкой ниже — он появится здесь.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handlePanelOpen}
                    className="flex-1 text-xs py-1.5 rounded-md text-white text-center flex items-center justify-center gap-1.5"
                    style={{ background: TAB_COLOR }}
                  >
                    <Eye size={12} /> Открыть
                  </button>
                  <button
                    onClick={handlePanelDownload}
                    className="flex-1 text-xs py-1.5 rounded-md border text-center flex items-center justify-center gap-1.5 transition-colors"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}
                  >
                    <Download size={12} /> Скачать
                  </button>
                  <input
                    id="panel-doc-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.png,.jpg,.jpeg,.zip"
                    onChange={handlePanelUpload}
                  />
                  <label
                    htmlFor="panel-doc-upload"
                    className="flex-1 text-xs py-1.5 rounded-md border text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}
                  >
                    <Upload size={12} /> Загрузить файл
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Разделитель документы/замечания */}
        <div
          onMouseDown={startResize('right')}
          onDoubleClick={resetWidths('right')}
          className="hidden lg:block shrink-0 cursor-col-resize"
          style={{ background: 'var(--border-default)' }}
          title="Потяните, чтобы изменить ширину. Двойной клик — сброс"
        />

        {/* ═══ RIGHT: REMARKS ═══ */}
        <div className="flex flex-col min-w-0" style={{ background: 'var(--bg-surface-2)' }}>
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
                placeholder={newRemarkAction === 'approve' ? 'Комментарий к согласованию (необязательно)...' : 'Опишите замечание...'}
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
                          setSelectedAssignee(emp.id);
                          setDelegateOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors text-sm"
                        style={{
                          background: selectedAssignee === emp.id ? 'var(--bg-surface-3)' : 'transparent',
                          color: selectedAssignee === emp.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                        onMouseEnter={e => { if (selectedAssignee !== emp.id) e.currentTarget.style.background = 'var(--bg-surface-3)'; }}
                        onMouseLeave={e => { if (selectedAssignee !== emp.id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0" style={{ background: emp.color + '20', color: emp.color }}>
                          {emp.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{emp.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{emp.role}</div>
                        </div>
                        {selectedAssignee === emp.id && <CheckCircle size={10} style={{ color: '#4F7A4C' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddRemark}
                disabled={newRemarkAction === 'approve' ? false : !newRemarkText.trim()}
                className="w-full text-xs py-1.5 rounded-md text-white flex items-center justify-center gap-1.5 transition-opacity"
                style={{ background: TAB_COLOR, opacity: (newRemarkAction === 'approve' || newRemarkText.trim()) ? 1 : 0.5 }}
              >
                {newRemarkAction === 'approve' ? <CheckCircle size={12} /> : <Send size={12} />}
                {newRemarkAction === 'approve' ? 'Согласовать документ' : 'Отправить замечание'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно быстрого просмотра файла */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setModalOpen(false)}
        >
          <div
            ref={modalBoxRef}
            className="rounded-xl overflow-hidden flex flex-col w-full max-w-5xl"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', height: modalFullscreen ? '100%' : '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="px-4 py-2.5 flex items-center justify-between gap-3"
              style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-surface-2)' }}
            >
              <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }} title={modalFile?.name}>
                {modalLoading ? 'Загрузка файла…' : (modalFile?.name ?? 'Предпросмотр')}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={toggleModalFullscreen}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
                  title={modalFullscreen ? 'Свернуть' : 'Развернуть на весь экран'}
                >
                  {modalFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  {modalFullscreen ? 'Свернуть' : 'На весь экран'}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded shrink-0 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="Закрыть (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0" style={{ background: 'var(--bg-surface)' }}>
              {modalLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div
                      className="w-8 h-8 border-2 border-t-2 rounded-full animate-spin mx-auto mb-2"
                      style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--accent-engineering)' }}
                    />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Загрузка файла…</p>
                  </div>
                </div>
              ) : modalFile ? (
                <ViewerContainer fileUrl={modalFile.url} fileName={modalFile.name} />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Контекстное меню (правый клик) */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
            onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}
          />
          <div
            className="fixed z-50 min-w-[180px] rounded-lg py-1 shadow-xl"
            style={{
              top: Math.min(contextMenu.y, window.innerHeight - 180),
              left: Math.min(contextMenu.x, window.innerWidth - 200),
              background: 'var(--card-bg)',
              border: '1px solid var(--border-default)',
            }}
          >
            {contextMenu.kind === 'project' ? (
              <>
                <ContextMenuItem
                  icon={<PenLine size={13} />}
                  label="Переименовать"
                  onClick={() => {
                    closeContextMenu();
                    startProjectRename(contextMenu.projectName);
                  }}
                />
                {clipboardDoc && (
                  <ContextMenuItem
                    icon={<ClipboardPaste size={13} />}
                    label="Вставить документ"
                    onClick={() => void handlePasteDoc(contextMenu.projectName)}
                  />
                )}
                <ContextMenuItem
                  icon={<Trash2 size={13} />}
                  label="Удалить"
                  danger
                  onClick={() => void handleDeleteProject(contextMenu.projectName)}
                />
              </>
            ) : contextMenu.doc ? (
              <>
                <ContextMenuItem
                  icon={<PenLine size={13} />}
                  label="Переименовать"
                  onClick={() => {
                    closeContextMenu();
                    setEditingDocId(contextMenu.doc!.id);
                  }}
                />
                <ContextMenuItem
                  icon={<Copy size={13} />}
                  label="Копировать"
                  onClick={() => void handleCopyDoc(contextMenu.doc!)}
                />
                <ContextMenuItem
                  icon={<Scissors size={13} />}
                  label="Вырезать"
                  onClick={() => void handleCutDoc(contextMenu.doc!)}
                />
                <ContextMenuItem
                  icon={<FolderInput size={13} />}
                  label="Переместить в проект…"
                  onClick={() => {
                    closeContextMenu();
                    setMoveDoc(contextMenu.doc!);
                    setMoveTarget('');
                  }}
                />
                <ContextMenuItem
                  icon={<Trash2 size={13} />}
                  label="Исключить из работы"
                  danger
                  onClick={() => void handleDeleteDoc(contextMenu.doc!)}
                />
              </>
            ) : contextMenu.kind === 'background' ? (
              clipboardDoc && (
                <ContextMenuItem
                  icon={<ClipboardPaste size={13} />}
                  label={`Вставить «${clipboardDoc.code}» в «${contextMenu.projectName}»`}
                  onClick={() => void handlePasteDoc(contextMenu.projectName)}
                />
              )
            ) : null}
          </div>
        </>
      )}

      {/* Модальное окно перемещения документа в другой проект */}
      {moveDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMoveDoc(null)}
        >
          <div
            className="rounded-xl p-4 w-full max-w-sm space-y-3"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Переместить документ
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              «{moveDoc.code} — {moveDoc.name}» будет перемещён из проекта «{moveDoc.project}».
              Привязка к этапу, комплекту и разделу будет сброшена.
            </p>
            {moveTargets.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Других проектов нет — сначала создайте проект.
              </p>
            ) : (
              <select
                value={moveTarget}
                onChange={e => setMoveTarget(e.target.value)}
                className="w-full text-sm rounded-md px-2 py-1.5"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                autoFocus
              >
                <option value="">— Выберите проект —</option>
                {moveTargets.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => { setMoveDoc(null); setMoveTarget(''); }}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}
              >
                Отмена
              </button>
              <button
                onClick={() => void handleMoveDoc()}
                disabled={!moveTarget || moveLoading || moveTargets.length === 0}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-white transition-opacity"
                style={{ background: TAB_COLOR, opacity: (!moveTarget || moveLoading || moveTargets.length === 0) ? 0.5 : 1 }}
              >
                {moveLoading ? 'Перемещение…' : 'Переместить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Диалоговое окно исключения документа из работы */}
      {deleteDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setDeleteDoc(null)}
        >
          <div
            className="rounded-xl p-4 w-full max-w-sm space-y-3"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-2.5">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}
              >
                <Trash2 size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Исключить документ из работы?
                </h3>
                <p className="text-xs font-mono mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }} title={`${deleteDoc.code} — ${deleteDoc.name}`}>
                  {deleteDoc.code} — {deleteDoc.name}
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Документ будет подсвечен чёрной заливкой как удалённый и скрыт из основных списков.
              Его можно будет вернуть через архив.
            </p>
            <input
              type="text"
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              placeholder="Причина исключения (необязательно)"
              className="w-full text-sm rounded-md px-2 py-1.5"
              style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') void handleConfirmDeleteDoc(); }}
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setDeleteDoc(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}
              >
                Отмена
              </button>
              <button
                onClick={() => void handleConfirmDeleteDoc()}
                disabled={deleteLoading}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-white transition-opacity"
                style={{ background: '#DC2626', opacity: deleteLoading ? 0.6 : 1 }}
              >
                {deleteLoading ? 'Исключение…' : 'Исключить из работы'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [remarks, setRemarks] = useState<RemarkListItem[]>([]);
  const [approvalFeed, setApprovalFeed] = useState<ApprovalFeedItem[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [allProjects, setAllProjects] = useState<{ id: number; name: string; status?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'new' | 'in_progress' | 'done'>('all');
  const [taskStatuses, setTaskStatuses] = useState<Record<string, 'new' | 'in_progress' | 'done'>>({});
  const [remarkSearch, setRemarkSearch] = useState('');
  const [remarkFilter, setRemarkFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    if (loaded) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getRemarks({ page: 1, page_size: 50 }).catch(() => null),
      getApprovalFeed().catch(() => [] as ApprovalFeedItem[]),
      getDocuments().catch(() => [] as DocumentItem[]),
      getProjects().catch(() => [] as { id: number; name: string; status?: string }[]),
      getActionTaskStatuses().catch(() => ({}) as Record<string, ActionTaskStatus>),
    ]).then(([remarksData, feedData, docsData, projectsData, taskStatusesData]) => {
      if (cancelled) return;
      if (remarksData?.items?.length) setRemarks(remarksData.items);
      if (feedData?.length) setApprovalFeed(feedData);
      setTaskStatuses(taskStatusesData);
      const docsList = Array.isArray(docsData)
        ? docsData
        : (docsData as any)?.items ?? [];
      const projectsList = extractItems<{ id: number; name: string; status?: string }>(projectsData);
      const projectNames = new Map(projectsList.map(p => [p.id, p.name]));
      setAllProjects(projectsList);
      setDocs(docsList.map((d: DocumentItem) => mapApiDocument(d, projectNames.get(d.project_id) || `Проект #${d.project_id}`)));
      setLoaded(true);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [loaded]);

  const filteredRemarks = remarks.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(remarkSearch.toLowerCase());
    const matchStatus = remarkFilter === 'all' || r.status === remarkFilter;
    return matchSearch && matchStatus;
  });

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'done': return 'Выполнена';
      case 'in_progress': return 'В работе';
      case 'new': return 'Новая';
      default: return status;
    }
  };

  const getTaskStatusStyle = (status: string) => {
    switch (status) {
      case 'done': return { color: '#4F7A4C', bg: 'rgba(79,122,76,0.15)', border: 'rgba(79,122,76,0.4)' };
      case 'in_progress': return { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)' };
      case 'new': return { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)' };
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

  const getRemarkPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Низкий';
      case 'medium': return 'Средний';
      case 'high':
      case 'critical': return 'Высокий';
      default: return priority;
    }
  };

  const getTaskPriorityLabel = (priority: string) => {
    const p = priority.toLowerCase();
    switch (p) {
      case 'low': return 'Низкий';
      case 'normal':
      case 'medium': return 'Средний';
      case 'high': return 'Высокий';
      case 'critical': return 'Критический';
      default: return priority;
    }
  };

  const updateTaskStatus = (id: string, status: ActionTaskStatus) => {
    setTaskStatuses(prev => ({ ...prev, [id]: status }));
    setActionTaskStatus(id, status).catch(() => {
      toast.error('Не удалось сохранить статус задачи');
    });
  };

  type ActionTaskType = 'create_document' | 'approve' | 'fix_remark' | 'attach_file';
  interface ActionTask {
    id: string;
    type: ActionTaskType;
    title: string;
    project?: string;
    document?: string;
    documentId?: number;
    projectId?: number;
    status: 'new' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
  }

  const getActionTaskMeta = (type: ActionTaskType) => {
    switch (type) {
      case 'create_document': return { label: 'Создать документ', icon: <FilePlus size={16} />, color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)' };
      case 'approve': return { label: 'Согласовать', icon: <FileCheck size={16} />, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' };
      case 'fix_remark': return { label: 'Исправить замечание', icon: <AlertCircle size={16} />, color: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' };
      case 'attach_file': return { label: 'Прикрепить файл', icon: <Paperclip size={16} />, color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)' };
    }
  };

  const actionTasks = useMemo<ActionTask[]>(() => {
    const items: ActionTask[] = [];
    // Создать документ — активные проекты без документов
    const activeProjects = allProjects.filter(p => !p.status || p.status === 'active');
    const projectDocCounts = new Map<number, number>();
    docs.forEach(d => {
      if (d.projectId) projectDocCounts.set(d.projectId, (projectDocCounts.get(d.projectId) || 0) + 1);
    });
    activeProjects.forEach(p => {
      if (!projectDocCounts.get(p.id)) {
        items.push({ id: `create-doc-${p.id}`, type: 'create_document', title: 'Создать документ', project: p.name, projectId: p.id, status: 'new', priority: 'medium' });
      }
    });
    // Действия по документам
    docs.forEach(d => {
      if (d.status === 'review') {
        items.push({ id: `approve-${d.id}`, type: 'approve', title: 'Согласовать документ', project: d.project, document: `${d.code} — ${d.name}`, documentId: Number(d.id), status: 'new', priority: 'high' });
      }
      if (d.status === 'draft' && !d.hasFile) {
        items.push({ id: `attach-${d.id}`, type: 'attach_file', title: 'Прикрепить файл к документу', project: d.project, document: `${d.code} — ${d.name}`, documentId: Number(d.id), status: 'new', priority: 'medium' });
      }
    });
    // Исправить замечание
    remarks.filter(r => r.status === 'new' || r.status === 'in_progress').forEach(r => {
      const linkedDoc = docs.find(d => Number(d.id) === r.document_id);
      items.push({
        id: `fix-remark-${r.id}`,
        type: 'fix_remark',
        title: 'Исправить замечание',
        project: r.project_name || linkedDoc?.project || (r.project_id ? `Проект #${r.project_id}` : '—'),
        document: r.document_name || linkedDoc?.code || (r.document_id ? `Документ #${r.document_id}` : '—'),
        documentId: r.document_id,
        status: 'new',
        priority: r.priority === 'critical' || r.priority === 'high' ? 'high' : r.priority === 'medium' ? 'medium' : 'low',
      });
    });
    // Применяем пользовательские статусы
    items.forEach(task => {
      if (taskStatuses[task.id]) {
        task.status = taskStatuses[task.id];
      }
    });
    return items;
  }, [docs, remarks, allProjects, taskStatuses]);

  const filteredActionTasks = useMemo(() => actionTasks.filter(t => {
    const q = taskSearch.toLowerCase();
    const matchSearch = t.title.toLowerCase().includes(q) || (t.project?.toLowerCase().includes(q) ?? false) || (t.document?.toLowerCase().includes(q) ?? false);
    const matchStatus = taskFilter === 'all' || t.status === taskFilter;
    return matchSearch && matchStatus;
  }), [actionTasks, taskSearch, taskFilter]);

  const openRemarksDocIds = useMemo(
    () => new Set(
      remarks
        .filter(r => (r.status === 'new' || r.status === 'in_progress') && r.document_id != null)
        .map(r => String(r.document_id))
    ),
    [remarks],
  );

  const processCards = [
    { icon: <FileText size={20} />, count: docs.length, label: 'Всего', color: '#64748B', onClick: () => { setTab('tasks'); } },
    { icon: <Upload size={20} />, count: docs.filter(d => d.status === 'draft').length, label: 'Черновик', color: '#3B82F6', onClick: () => { setTab('tasks'); } },
    { icon: <Search size={20} />, count: docs.filter(d => openRemarksDocIds.has(d.id)).length, label: 'Проверка', color: '#8B5CF6', onClick: () => { setTab('remarks'); setRemarkFilter('all'); } },
    { icon: <FileCheck size={20} />, count: docs.filter(d => d.status === 'review').length, label: 'Согласование', color: '#F59E0B', onClick: () => { setTab('remarks'); } },
    { icon: <Award size={20} />, count: docs.filter(d => d.status === 'approved' || d.status === 'confirmed').length, label: 'Утверждено', color: '#22C55E', onClick: () => { setTab('tasks'); } },
    { icon: <Archive size={20} />, count: docs.filter(d => d.status === 'archived').length, label: 'Архив', color: '#6B7280', onClick: () => { setTab('tasks'); } },
  ];

  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach(d => {
      const label =
        d.status === 'draft' ? 'Черновики' :
        d.status === 'review' ? 'На согласовании' :
        d.status === 'approved' || d.status === 'confirmed' ? 'Утверждено' :
        d.status === 'archived' ? 'В архиве' :
        'Прочие';
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [docs]);

  const templateBarData = useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach(d => {
      const label = docTypeConfig[d.type]?.label || 'Прочее';
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [docs]);

  const monthlyLineData = useMemo(() => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const counts: Record<string, number> = {};
    months.forEach(m => counts[m] = 0);
    docs.forEach(d => {
      const date = d.createdAt ? new Date(d.createdAt) : null;
      if (date && !Number.isNaN(date.getTime())) {
        const m = months[date.getMonth()];
        counts[m] = (counts[m] || 0) + 1;
      }
    });
    if (Object.values(counts).every(v => v === 0)) {
      return months.map(m => ({ month: m, count: 0 }));
    }
    return months.map(m => ({ month: m, count: counts[m] || 0 }));
  }, [docs]);

  const chartTextColor = 'var(--text-secondary, #8892A8)';
  const chartGridColor = 'var(--border-divider, rgba(255,255,255,0.06))';

  return (
    <div className="space-y-5">
      {/* Лента согласований */}
      <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <GitBranch size={14} style={{ color: TAB_COLOR }} /> Лента согласований
        </h3>
        {approvalFeed.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Согласований пока не было</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {approvalFeed.slice(0, 10).map((item, idx) => (
              <div key={`${item.document_id}-${item.user_id}-${idx}`} className="flex items-center gap-3 py-2">
                <CheckCircle size={14} style={{ color: '#4F7A4C' }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.user_name || `Пользователь #${item.user_id}`}</span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}> согласовал(а) </span>
                  <Link to={`/documents/${item.document_id}`} className="text-sm font-medium hover:underline" style={{ color: TAB_COLOR }}>
                    {item.document_code || `Документ #${item.document_id}`}
                  </Link>
                  {item.document_status === 'approved' && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ color: '#4F7A4C', background: 'rgba(79,122,76,0.12)' }}>утверждён</span>
                  )}
                </div>
                <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {item.approved_at ? new Date(item.approved_at).toLocaleString('ru-RU') : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

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
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Динамика документов</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyLineData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="month" tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}`, 'Документы']} />
                <Line type="monotone" dataKey="count" name="Документы" stroke={LINE_COLORS[0]} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: 'var(--card-bg)' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {[
          { key: 'tasks' as const, label: 'Задачи', icon: <FileCheck size={16} />, count: filteredActionTasks.length, color: TASKS_TAB_COLOR },
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
              {(['all', 'new', 'in_progress', 'done'] as const).map(s => (
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
            <span className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Найдено: {filteredActionTasks.length}</span>
          </div>

          <div className="space-y-2">
            {filteredActionTasks.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck size={48} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Действий не требуется. Все текущие задачи выполнены.</p>
              </div>
            ) : (
              filteredActionTasks.map((task) => {
                const meta = getActionTaskMeta(task.type);
                const target = task.documentId
                  ? (task.type === 'fix_remark' ? `/documents/${task.documentId}?tab=remarks` : `/documents/${task.documentId}`)
                  : (task.projectId ? `/documents/create?projectId=${task.projectId}` : '/documents');
                const priorityClass = task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
                const linkedDoc = task.documentId != null ? docs.find(d => Number(d.id) === task.documentId) : undefined;
                return (
                  <Link
                    key={task.id}
                    to={target}
                    className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-[var(--bg-surface-2)]"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-default)' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                        {meta.icon}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {task.project && (
                            <span className="inline-flex items-center gap-1" title="Проект">
                              <FolderKanban size={12} style={{ color: 'var(--text-muted)' }} /> {task.project}
                            </span>
                          )}
                          {task.document && (
                            <span className="inline-flex items-center gap-1" title="Документ">
                              <FileText size={12} style={{ color: 'var(--text-muted)' }} /> {task.document}
                              {linkedDoc?.hasFile && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[10px] px-1 py-px rounded-full border font-medium"
                                  title="Файл прикреплён"
                                  style={{ color: '#4F7A4C', background: 'rgba(79,122,76,0.15)', borderColor: 'rgba(79,122,76,0.4)' }}
                                >
                                  <Paperclip size={9} />
                                  Файл
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                      <span className="text-xs px-1.5 py-0.5 rounded border font-medium" style={{ color: meta.color, borderColor: meta.border, background: meta.bg }}>{meta.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityClass}`}>{getTaskPriorityLabel(task.priority)}</span>
                      {task.status === 'new' && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateTaskStatus(task.id, 'in_progress'); }}
                          className="text-xs px-2 py-0.5 rounded border font-medium transition-colors hover:opacity-80"
                          style={{ color: '#3B82F6', borderColor: 'rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.15)' }}
                        >
                          В работу
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateTaskStatus(task.id, 'done'); }}
                            className="text-xs px-2 py-0.5 rounded border font-medium transition-colors hover:opacity-80"
                            style={{ color: '#4F7A4C', borderColor: 'rgba(79,122,76,0.4)', background: 'rgba(79,122,76,0.15)' }}
                          >
                            Выполнено
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateTaskStatus(task.id, 'new'); }}
                            className="text-xs px-2 py-0.5 rounded border font-medium transition-colors hover:opacity-80"
                            style={{ color: 'var(--text-muted)', borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}
                          >
                            Вернуть
                          </button>
                        </>
                      )}
                      {task.status === 'done' && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateTaskStatus(task.id, 'in_progress'); }}
                          className="text-xs px-2 py-0.5 rounded border font-medium transition-colors hover:opacity-80"
                          style={{ color: 'var(--text-muted)', borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}
                        >
                          Вернуть в работу
                        </button>
                      )}
                    </div>
                  </Link>
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
              filteredRemarks.map((remark) => {
                const linkedDoc = docs.find(d => Number(d.id) === remark.document_id);
                const projectName = remark.project_name || linkedDoc?.project || (remark.project_id ? `Проект #${remark.project_id}` : '—');
                const documentName = remark.document_name || linkedDoc?.code || (remark.document_id ? `Документ #${remark.document_id}` : '—');
                const remarkTarget = remark.document_id ? `/documents/${remark.document_id}?tab=remarks` : '#';
                return (
                  <Link
                    key={remark.id}
                    to={remarkTarget}
                    className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-[var(--bg-surface-2)]"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-default)' }}
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{remark.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span className="inline-flex items-center gap-1" title="Проект">
                          <FolderKanban size={12} style={{ color: 'var(--text-muted)' }} /> {projectName}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Документ">
                          <FileText size={12} style={{ color: 'var(--text-muted)' }} /> {documentName}
                          {linkedDoc?.hasFile && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[10px] px-1 py-px rounded-full border font-medium"
                              title="Файл прикреплён"
                              style={{ color: '#4F7A4C', background: 'rgba(79,122,76,0.15)', borderColor: 'rgba(79,122,76,0.4)' }}
                            >
                              <Paperclip size={9} />
                              Файл
                            </span>
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Приоритет">
                          <AlertCircle size={12} style={{ color: 'var(--text-muted)' }} /> Приоритет: {getRemarkPriorityLabel(remark.priority)}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Автор">
                          <User size={12} style={{ color: 'var(--text-muted)' }} /> {remark.author_name}
                        </span>
                        <span className="inline-flex items-center gap-1 ml-auto" title="Дата">
                          <Clock size={12} style={{ color: 'var(--text-muted)' }} /> {remark.created_at ? new Date(remark.created_at).toLocaleString('ru-RU') : '—'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium self-start sm:self-auto ${getRemarkStatusColor(remark.status)}`}>{getRemarkStatusLabel(remark.status)}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   EMPLOYEES VIEW — Gamification + Workload
   ═══════════════════════════════════════════ */
const PALETTE = ['#2563EB', '#4F7A4C', '#6B5B95', '#D4AF37', '#3B82F6', '#FF6B6B', '#94A3B8'];

function getInitials(fullName: string): string {
  return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function mapWorkloadData(apiWorkload: any, leaderboard: LeaderboardEntry[]): EmployeeWorkload[] {
  if (!apiWorkload?.team || !Array.isArray(apiWorkload.team)) return [];
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
  const [workloads, setWorkloads] = useState<EmployeeWorkload[]>([]);
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
  const avgLoad = workloads.length ? Math.round(workloads.reduce((sum, e) => sum + e.busyDays, 0) / workloads.length) : 0;

  return (
    <div className="space-y-4">
      {/* KPI header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Всего в работе', value: String(totalDocs), sub: 'документов', color: TAB_COLOR, icon: <FileText size={14} /> },
          { label: 'Средняя загрузка', value: `${avgLoad} дн.`, sub: 'на сотрудника', color: '#D4AF37', icon: <Clock size={14} /> },
          { label: 'Лучшая серия', value: `${workloads.length ? Math.max(...workloads.map(e => e.streak)) : 0} дн.`, sub: 'без просрочек', color: '#FF6B6B', icon: <Flame size={14} /> },
          { label: 'Ср. эффективность', value: `${workloads.length ? Math.round(workloads.reduce((s, e) => s + e.efficiency, 0) / workloads.length) : 0}%`, sub: 'по команде', color: '#6B5B95', icon: <TrendingUp size={14} /> },
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
              <FilePlus size={13} /> Создать документ
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

      <div className="mb-4">
      </div>

      <PageTabs tabs={DOC_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'registry' && <RegistryView />}
      {activeTab === 'workflow' && <WorkflowView />}
      {activeTab === 'employees' && <EmployeesView />}
    </div>
  );
}
