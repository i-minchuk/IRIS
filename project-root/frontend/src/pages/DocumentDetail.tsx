import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';

import { DocumentAnalysisPanel } from '@/features/ai/components/DocumentAnalysisPanel';
import { AIChatPanel } from '@/features/ai/components/AIChatPanel';
import { RequirementsPanel } from '@/features/ai/components/RequirementsPanel';
import { FileText, MessageSquare, History, Users, ArrowLeft, Sparkles, Wrench, Bot, Upload, PencilLine, Maximize2, Minimize2, Clock, CheckCircle, Paperclip } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDocument, downloadRevisionFile, uploadDocumentFile, updateDocument, approveDocument, getApprovalFeed, type ApprovalRecord, type DocumentDetail, type Revision } from '@/features/documents/api/documents';
import { getRemarks, updateRemark } from '@/features/remarks/api/remarks';
import type { RemarkListItem } from '@/types/remarks';
import { getUsers } from '@/features/users/api/users';
import { useAuthStore } from '@/features/auth/store/authStore';
import { DocumentEditor } from '@/features/documents/components/DocumentEditor';
import type { User } from '@/types';
import ViewerContainer from '@/components/viewers/ViewerContainer';
import { toast } from 'sonner';
import { getProject } from '@/features/projects/api/projects';
import type { DocumentStatus } from '@/lib/documentStatusMachine';

type Tab = 'info' | 'editor' | 'files' | 'approval' | 'remarks' | 'history' | 'ai-analysis' | 'ai-requirements' | 'ai-chat';

const DOC_STATUSES: DocumentStatus[] = [
  'draft', 'in_review', 'review_ok', 'approval', 'approved', 'release', 'archived', 'cancelled',
];

function mapStatus(value?: string): DocumentStatus {
  const v = (value || '').toLowerCase();
  if ((DOC_STATUSES as string[]).includes(v)) return v as DocumentStatus;
  if (v === 'review' || v === 'in_progress' || v === 'on_review') return 'in_review';
  if (v === 'confirmed') return 'approved';
  return 'draft';
}

function getRemarkStatusLabel(status: string) {
  switch (status) {
    case 'new': return 'Новое';
    case 'in_progress': return 'В работе';
    case 'resolved': return 'Устранено';
    case 'rejected': return 'Отклонено';
    case 'closed': return 'Закрыто';
    case 'deferred': return 'Отложено';
    default: return status;
  }
}

function getRemarkStatusColor(status: string) {
  switch (status) {
    case 'new': return { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)' };
    case 'in_progress': return { color: '#D4AF37', bg: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.4)' };
    case 'resolved': return { color: '#4F7A4C', bg: 'rgba(79,122,76,0.15)', border: 'rgba(79,122,76,0.4)' };
    case 'rejected': return { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' };
    case 'closed': return { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.4)' };
    default: return { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)' };
  }
}

function getRemarkPriorityLabel(priority: string) {
  switch (priority) {
    case 'low': return 'Низкий';
    case 'medium': return 'Средний';
    case 'high': return 'Высокий';
    case 'critical': return 'Критический';
    default: return priority;
  }
}

function getRemarkPriorityColor(priority: string) {
  switch (priority) {
    case 'critical': return { color: '#DC2626', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.4)' };
    case 'high': return { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' };
    case 'medium': return { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)' };
    case 'low': return { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.4)' };
    default: return { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)' };
  }
}

function revisionFileName(rev: Revision): string {
  const stored = rev.file_path ? rev.file_path.split(/[\\/]/).pop() : '';
  const original =
    rev.changes_summary && rev.changes_summary.includes('File uploaded:')
      ? rev.changes_summary.split('File uploaded:')[1].trim()
      : '';
  return original || stored || 'файл';
}

interface ProjectInfo {
  name: string;
  customer_name?: string;
  stage?: string;
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab | null) ?? 'info';
  const [activeTab, setActiveTab] = useState<Tab>(
    ['info', 'editor', 'files', 'approval', 'remarks', 'history', 'ai-analysis', 'ai-requirements', 'ai-chat'].includes(initialTab)
      ? initialTab
      : 'info'
  );
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [documentRemarks, setDocumentRemarks] = useState<RemarkListItem[]>([]);
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [documentApprovals, setDocumentApprovals] = useState<ApprovalRecord[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  const handleResolveRemark = async (remarkId: string) => {
    try {
      await updateRemark(remarkId, { status: 'resolved' });
      setDocumentRemarks(prev =>
        prev.map(r => (r.id === remarkId ? { ...r, status: 'resolved' as const } : r))
      );
      toast.success('Замечание отмечено как устранённое');
    } catch {
      toast.error('Не удалось обновить статус замечания');
    }
  };

  useEffect(() => {
    getUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    const numericId = Number(id);
    if (!numericId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setRemarksLoading(true);
    setApprovalsLoading(true);
    getRemarks({ document_id: numericId, page: 1, page_size: 100 })
      .then(res => { if (!cancelled) setDocumentRemarks(res.items); })
      .catch(() => { if (!cancelled) setDocumentRemarks([]); })
      .finally(() => { if (!cancelled) setRemarksLoading(false); });
    getApprovalFeed()
      .then(feed => {
        if (!cancelled) {
          const records = feed
            .filter(item => item.document_id === numericId)
            .map(item => ({ user_id: item.user_id, user_name: item.user_name, approved_at: item.approved_at }));
          setDocumentApprovals(records);
        }
      })
      .catch(() => { if (!cancelled) setDocumentApprovals([]); })
      .finally(() => { if (!cancelled) setApprovalsLoading(false); });
    getDocument(numericId)
      .then(async (data) => {
        if (cancelled) return;
        setDoc(data);
        if (data.project_id) {
          const proj = await getProject(data.project_id).catch(() => null);
          if (!cancelled && proj) {
            setProject({ name: proj.name, customer_name: proj.customer_name, stage: proj.stage });
          }
        }
      })
      .catch(() => {
        if (!cancelled) setDoc(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const revisions = doc?.revisions ?? [];
  const files = revisions.filter(r => r.file_path);
  const assigneeNames = (doc?.assignee_ids ?? [])
    .map((uid) => users.find((u) => u.id === uid)?.full_name || `#${uid}`);

  // ── Предпросмотр файла ревизии ──
  const [selectedRevId, setSelectedRevId] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewCacheRef = useRef<Map<number, { url: string; name: string }>>(new Map());
  const activeRev = files.find(r => r.id === selectedRevId) ?? files[files.length - 1] ?? null;

  // ── Полноэкранный режим предпросмотра ──
  const previewBoxRef = useRef<HTMLDivElement | null>(null);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setPreviewFullscreen(document.fullscreenElement === previewBoxRef.current);
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

  useEffect(() => {
    const numericId = Number(id);
    if (!activeRev || !numericId) {
      setPreviewFile(null);
      return;
    }
    const cached = previewCacheRef.current.get(activeRev.id);
    if (cached) {
      setPreviewFile(cached);
      return;
    }
    let cancelled = false;
    setPreviewFile(null);
    setPreviewLoading(true);
    downloadRevisionFile(numericId, activeRev.id)
      .then(({ filename, blob }) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        const file = { url, name: filename };
        previewCacheRef.current.set(activeRev.id, file);
        setPreviewFile(file);
      })
      .catch(() => {
        if (!cancelled) setPreviewFile(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, activeRev]);

  // Отзыв blob-URL при размонтировании
  useEffect(() => () => {
    previewCacheRef.current.forEach(f => URL.revokeObjectURL(f.url));
    previewCacheRef.current.clear();
  }, []);

  // ── Редактируемый предпросмотр (TipTap, content.body) ──
  const [editorContent, setEditorContent] = useState('<p></p>');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [editorRev, setEditorRev] = useState(0); // для пересоздания редактора при откате
  const [historyOpen, setHistoryOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    const body = (doc?.content as { body?: string } | null)?.body;
    contentRef.current = { ...(doc?.content ?? {}) };
    setEditorContent(body && body.trim() ? body : '<p></p>');
    setSaveStatus('saved');
  }, [doc?.id]);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const MAX_HISTORY = 20;
  const currentUserName = useAuthStore((s) => s.user)?.full_name || 'Неизвестный';

  const buildContent = (body: string): Record<string, unknown> => {
    const cur = contentRef.current;
    const prevBody = (cur.body as string) || '<p></p>';
    let history = Array.isArray(cur.body_history) ? [...(cur.body_history as { body: string; at: string; by?: string }[])] : [];
    if (prevBody !== body) {
      history = [{ body: prevBody, at: new Date().toISOString(), by: currentUserName }, ...history].slice(0, MAX_HISTORY);
    }
    const next = { ...cur, body, body_history: history };
    contentRef.current = next;
    return next;
  };

  const handleEditorChange = (html: string) => {
    const numericId = Number(id);
    if (!numericId) return;
    setEditorContent(html);
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await updateDocument(numericId, { content: buildContent(html) });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('unsaved');
        toast.error('Не удалось сохранить изменения');
      }
    }, 1200);
  };

  const bodyHistory = Array.isArray(contentRef.current.body_history)
    ? (contentRef.current.body_history as { body: string; at: string; by?: string }[])
    : [];
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const restoreVersion = async (entry: { body: string; at: string; by?: string }) => {
    const numericId = Number(id);
    if (!numericId) return;
    try {
      const next = buildContent(entry.body);
      await updateDocument(numericId, { content: next });
      setEditorContent(entry.body);
      setEditorRev((r) => r + 1); // пересоздать редактор с восстановленным текстом
      setSaveStatus('saved');
      toast.success('Версия восстановлена');
    } catch {
      toast.error('Не удалось восстановить версию');
    }
  };

  // ── Загрузка нового файла (новая ревизия) ──
  const [uploading, setUploading] = useState(false);
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const numericId = Number(id);
    if (!file || !numericId) return;
    setUploading(true);
    try {
      await uploadDocumentFile(numericId, file);
      toast.success(`Файл «${file.name}» загружен`);
      const detail = await getDocument(numericId);
      setDoc(detail);
      setSelectedRevId(null); // активным станет последний загруженный файл
    } catch {
      toast.error('Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Основное', icon: <FileText size={14} /> },
    { key: 'editor', label: 'Редактор', icon: <PencilLine size={14} /> },
    { key: 'files', label: 'Файлы', icon: <FileText size={14} /> },
    { key: 'approval', label: 'Согласование', icon: <Users size={14} /> },
    { key: 'remarks', label: `Замечания (${documentRemarks.length})`, icon: <MessageSquare size={14} /> },
    { key: 'history', label: 'История', icon: <History size={14} /> },
    { key: 'ai-analysis', label: 'AI Анализ', icon: <Sparkles size={14} /> },
    { key: 'ai-requirements', label: 'Требования', icon: <Wrench size={14} /> },
    { key: 'ai-chat', label: 'AI Чат', icon: <Bot size={14} /> },
  ];

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/documents')} leftIcon={<ArrowLeft size={14} />}>
          Назад
        </Button>
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>
            {loading ? 'Загрузка…' : doc ? `${doc.number || doc.code || '—'} — ${doc.name || doc.title || '—'}` : 'Документ не найден'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {doc && <DocumentStatusBadge status={mapStatus(doc.status)} />}
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Проект: {project?.name || (doc ? `Проект #${doc.project_id}` : '—')}</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Дисциплина: {doc?.discipline || doc?.doc_type || '—'}</span>
            {doc && (
              doc.has_file ? (
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium"
                  title="К документу прикреплён файл"
                  style={{ color: '#4F7A4C', background: 'rgba(79,122,76,0.15)', borderColor: 'rgba(79,122,76,0.4)' }}
                >
                  <Paperclip size={11} />
                  Файл
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium"
                  title="Файл не прикреплён"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}
                >
                  <Paperclip size={11} />
                  Нет файла
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border-default)' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2"
            style={{
              color: activeTab === tab.key ? 'var(--brand-iris)' : 'var(--text-secondary)',
              borderColor: activeTab === tab.key ? 'var(--brand-iris)' : 'transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card padding="md">
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Основная информация</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Шифр:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{doc?.number || doc?.code || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Название:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{doc?.name || doc?.title || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Тип:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{doc?.doc_type || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Статус:</span>
                  {doc ? <DocumentStatusBadge status={mapStatus(doc.status)} /> : <span style={{ color: 'var(--text-primary)' }}>—</span>}
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Автор:</span>
                  <span style={{ color: 'var(--text-primary)' }}>—</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: 'var(--text-secondary)' }}>Исполнитель(и):</span>
                  <span className="text-right" style={{ color: 'var(--text-primary)' }}>
                    {assigneeNames.length > 0 ? assigneeNames.join(', ') : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Создан:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{doc?.created_at ? new Date(doc.created_at).toLocaleDateString('ru-RU') : '—'}</span>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Проект</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Проект:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{project?.name || (doc ? `Проект #${doc.project_id}` : '—')}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Заказчик:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{project?.customer_name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Стадия:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{project?.stage || '—'}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'editor' && doc && (
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Редактируемый предпросмотр
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  Текст документа — изменения сохраняются автоматически
                </p>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {saveStatus === 'saved' && '💾 Сохранено'}
                {saveStatus === 'saving' && '⏳ Сохранение…'}
                {saveStatus === 'unsaved' && '● Не сохранено'}
              </span>
            </div>
            <div style={{ height: 'calc(100vh - 520px)', minHeight: 300 }}>
              <DocumentEditor
                key={editorRev}
                content={editorContent}
                onChange={handleEditorChange}
                documentId={String(id)}
                documentType={doc.doc_type}
              />
            </div>

            {/* История изменений текста */}
            <div className="mt-4 rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium"
                style={{ color: 'var(--text-primary)', background: 'var(--bg-surface-2)' }}
              >
                <span>История изменений ({bodyHistory.length})</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {historyOpen ? 'Свернуть' : 'Развернуть'}
                </span>
              </button>
              {historyOpen && (
                <div className="max-h-56 overflow-y-auto">
                  {bodyHistory.length === 0 ? (
                    <p className="px-3 py-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Истории пока нет — версии появятся после первых правок текста.
                    </p>
                  ) : (
                    bodyHistory.map((entry, idx) => (
                      <div
                        key={`${entry.at}-${idx}`}
                        className="flex items-center gap-3 px-3 py-2 text-sm"
                        style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border-default)' }}
                      >
                        <span className="shrink-0 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {new Date(entry.at).toLocaleString('ru-RU')}
                        </span>
                        <span
                          className="shrink-0 text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}
                          title="Автор правки"
                        >
                          {entry.by || 'Неизвестный'}
                        </span>
                        <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }} title={stripHtml(entry.body)}>
                          {stripHtml(entry.body) || '(пусто)'}
                        </span>
                        <button
                          type="button"
                          onClick={() => { void restoreVersion(entry); }}
                          className="shrink-0 text-xs px-2 py-1 rounded-md border transition-colors"
                          style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}
                        >
                          Восстановить
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'approval' && (() => {
          const contentApprovals = ((doc?.content as { approvals?: ApprovalRecord[] } | null)?.approvals) ?? [];
          const allApprovals = [...contentApprovals, ...documentApprovals];
          const approvedBy = new Map(allApprovals.map(a => [a.user_id, a]));
          const approverIds = (doc?.assignee_ids ?? []) as number[];
          const me = useAuthStore.getState().user;
          const myId = (me as { id?: number } | null)?.id;
          const alreadyApproved = myId != null && approvedBy.has(myId);
          const isApproved = doc?.status === 'approved';
          const canApprove = Boolean(doc && !isApproved && !alreadyApproved && (approverIds.length === 0 || (myId != null && approverIds.includes(myId)) || (me as { role?: string } | null)?.role === 'admin'));
          const nameOf = (uid: number) => users.find(u => u.id === uid)?.full_name || `#${uid}`;

          return (
            <Card padding="md">
              <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Цепочка согласования</h3>
              {approvalsLoading ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--brand-iris)' }} />
                  Загрузка согласований…
                </div>
              ) : !doc ? null : approverIds.length === 0 && allApprovals.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Согласующие не назначены. Назначьте исполнителей в разделе «Основное» — поле «Исполнитель(и)».</p>
              ) : (
                <div className="space-y-2">
                  {(approverIds.length > 0 ? approverIds : allApprovals.map(a => a.user_id)).map((uid, idx) => {
                    const rec = approvedBy.get(uid);
                    return (
                      <div key={uid} className="flex items-center gap-3 p-2.5 rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={
                            rec
                              ? { background: 'rgba(79,122,76,0.15)', color: '#4F7A4C' }
                              : { background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }
                          }
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{nameOf(uid)}</div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {rec
                              ? `Согласовано ${new Date(rec.approved_at).toLocaleString('ru-RU')}`
                              : 'Ожидает согласования'}
                          </div>
                        </div>
                        {rec ? <CheckCircle size={16} style={{ color: '#4F7A4C' }} /> : <Clock size={16} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                    );
                  })}
                </div>
              )}
              {isApproved && (
                <div className="mt-4 p-2.5 rounded-lg text-sm font-medium" style={{ background: 'rgba(79,122,76,0.12)', color: '#4F7A4C' }}>
                  Документ утверждён — все согласующие подтвердили.
                </div>
              )}
              {!isApproved && allApprovals.length > 0 && (
                <div className="mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Согласовано {allApprovals.length} из {approverIds.length > 0 ? approverIds.length : 1}
                </div>
              )}
              {canApprove && id && (
                <Button
                  className="mt-4"
                  leftIcon={<CheckCircle size={14} />}
                  onClick={async () => {
                    try {
                      const result = await approveDocument(Number(id));
                      const [updated, feed] = await Promise.all([
                        getDocument(Number(id)),
                        getApprovalFeed().catch(() => []),
                      ]);
                      setDoc(updated);
                      setDocumentApprovals(feed.filter(item => item.document_id === Number(id)).map(item => ({ user_id: item.user_id, user_name: item.user_name, approved_at: item.approved_at })));
                      if (result.approved) toast.success('Документ утверждён — все согласующие подтвердили');
                      else if (result.next_approver) toast.success(`Согласовано. Следующий согласующий: ${result.next_approver.user_name}`);
                    } catch { /* toast об ошибке показал интерцептор */ }
                  }}
                >
                  Согласовать документ
                </Button>
              )}
            </Card>
          );
        })()}

        {activeTab === 'remarks' && (
          <Card padding="md">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Замечания</h3>
            {remarksLoading ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--brand-iris)' }} />
                Загрузка замечаний…
              </div>
            ) : documentRemarks.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Нет замечаний</p>
            ) : (
              <div className="space-y-3">
                {documentRemarks.map(r => {
                  const statusCfg = getRemarkStatusColor(r.status);
                  const priorityCfg = getRemarkPriorityColor(r.priority);
                  return (
                    <div key={r.id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium" style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: statusCfg.border }}>
                          {getRemarkStatusLabel(r.status)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full border font-medium" style={{ color: priorityCfg.color, background: priorityCfg.bg, borderColor: priorityCfg.border }}>
                          {getRemarkPriorityLabel(r.priority)}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Автор: {r.author_name}</span>
                        {r.assignee_name && (
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>→ Исполнитель: {r.assignee_name}</span>
                        )}
                        <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>
                          {r.created_at ? `Создано: ${new Date(r.created_at).toLocaleString('ru-RU')}` : '—'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                        {r.status !== 'resolved' && r.status !== 'closed' && r.status !== 'rejected' && (
                          <button
                            onClick={() => handleResolveRemark(r.id)}
                            className="shrink-0 text-xs px-2 py-1 rounded border font-medium transition-colors hover:opacity-80"
                            style={{ color: '#4F7A4C', borderColor: 'rgba(79,122,76,0.4)', background: 'rgba(79,122,76,0.15)' }}
                          >
                            Согласовано
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'history' && (
          <Card padding="md">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>История изменений</h3>
            {revisions.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Нет истории изменений</p>
            ) : (
              <div className="space-y-3">
                {revisions.map((rev) => (
                  <div key={rev.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--brand-iris)' }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Ревизия {rev.number}</div>
                      <div className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>{rev.changes_summary || `Статус: ${rev.status}`}</div>
                      <div className="text-base md:text-lg font-medium leading-relaxed mt-1 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(rev.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'files' && (
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Файлы</h3>
              <input
                id="detail-doc-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.png,.jpg,.jpeg,.zip"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label
                htmlFor="detail-doc-upload"
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}
              >
                <Upload size={12} />
                {uploading ? 'Загрузка…' : 'Загрузить файл'}
              </label>
            </div>
            {files.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Нет загруженных файлов</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
                {/* Список файлов */}
                <div className="space-y-2">
                  {files.map(rev => {
                    const displayName = revisionFileName(rev);
                    const isActive = activeRev?.id === rev.id;
                    return (
                      <div
                        key={rev.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedRevId(rev.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedRevId(rev.id); }}
                        className="flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isActive ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
                          border: `1px solid ${isActive ? 'var(--brand-iris)' : 'var(--border-default)'}`,
                        }}
                      >
                        <FileText size={16} style={{ color: 'var(--brand-iris)' }} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }} title={displayName}>
                            {displayName}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Ревизия {rev.number}
                            {rev.created_at ? ` · ${new Date(rev.created_at).toLocaleDateString('ru-RU')}` : ''}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!id) return;
                            try {
                              const { filename, blob } = await downloadRevisionFile(Number(id), rev.id);
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = filename;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            } catch {
                              // toast об ошибке уже показан axios-интерцептором
                            }
                          }}
                        >
                          Скачать
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Предпросмотр выбранного файла */}
                <div
                  ref={previewBoxRef}
                  className="rounded-lg overflow-hidden flex flex-col min-w-0"
                  style={{ border: '1px solid var(--border-default)', background: 'var(--bg-app)' }}
                >
                  <div
                    className="px-3 py-1.5 flex items-center gap-2"
                    style={{ background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-default)' }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider truncate" style={{ color: 'var(--text-muted)' }}>
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
                  <div style={previewFullscreen ? { flex: '1 1 0%', minHeight: 0, background: 'var(--bg-surface)' } : { height: 'calc(100vh - 400px)', minHeight: 380, background: 'var(--bg-surface)' }}>
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
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Предпросмотр недоступен</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'ai-analysis' && id && (
          <Card padding="md">
            <DocumentAnalysisPanel documentId={id} />
          </Card>
        )}

        {activeTab === 'ai-requirements' && id && (
          <Card padding="md">
            <RequirementsPanel documentId={id} />
          </Card>
        )}

        {activeTab === 'ai-chat' && id && (
          <AIChatPanel documentId={id} />
        )}
      </div>
    </div>
  );
}
