import React, { useMemo, useState } from 'react';
import {
  FileText, FileCheck, AlertCircle, Clock, Printer,
  Eye, CheckCircle2, XCircle, Send,
  Calendar, ChevronDown, ChevronUp, Plus, Search as SearchIcon,
  Loader2,
} from 'lucide-react';
import { ProjectDocument, ProductionProject } from '../../types/production';
import { useAutoTimeTracker } from '@/features/time_tracking/hooks/useAutoTimeTracker';
import Modal from '@/components/ui/Modal';

interface Props {
  documents: ProjectDocument[];
  projects: ProductionProject[];
  onAddComment: (docId: string, author: string, text: string) => void;
}

const statusConfig: Record<ProjectDocument['status'], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:       { label: 'Черновик',         color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: <FileText size={12} /> },
  in_review:   { label: 'На согласовании',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: <Clock size={12} /> },
  approved:    { label: 'Согласован',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: <CheckCircle2 size={12} /> },
  sent:        { label: 'Отправлен',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: <Send size={12} /> },
  overdue:     { label: 'Просрочен',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: <AlertCircle size={12} /> },
  rejected:    { label: 'На переделке',     color: '#dc2626', bg: 'rgba(220,38,38,0.12)',   icon: <XCircle size={12} /> },
  in_production: { label: 'В производство работ', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', icon: <FileCheck size={12} /> },
};

const typeLabels: Record<ProjectDocument['type'], string> = {
  rd: 'РД',
  kd: 'КД',
  spec: 'Спецификация',
  drawing: 'Чертёж',
  test_program: 'Программа испытаний',
  protocol: 'Протокол',
  other: 'Прочее',
};

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU');
}

function daysDiff(planned: string, actual?: string) {
  if (!actual) return null;
  const p = new Date(planned).getTime();
  const a = new Date(actual).getTime();
  const diff = Math.ceil((a - p) / (1000 * 60 * 60 * 24));
  return diff;
}

export const DocumentTracker: React.FC<Props> = ({ documents, projects, onAddComment }) => {
  const { autoStart } = useAutoTimeTracker();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<ProjectDocument['status'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<ProjectDocument | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const byProject = useMemo(() => {
    const grouped: Record<string, ProjectDocument[]> = {};
    documents.forEach(d => {
      if (!grouped[d.projectId]) grouped[d.projectId] = [];
      grouped[d.projectId].push(d);
    });
    return grouped;
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      if (filter !== 'all' && d.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.number.toLowerCase().includes(q) ||
          d.responsible.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, filter, search]);

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrint = (doc: ProjectDocument) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>${doc.number} — ${doc.name}</title></head>
        <body>
          <h1>${doc.number}</h1>
          <h2>${doc.name}</h2>
          <p>Статус: ${statusConfig[doc.status].label}</p>
          <p>Ответственный: ${doc.responsible}</p>
          <p>Плановая готовность: ${formatDate(doc.plannedReady)}</p>
          <p style="margin-top:40px;color:#999;">Документ подготовлен в ДокПоток IRIS</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleOpen = async (doc: ProjectDocument) => {
    // Auto-start timer for this document
    const numericDocId = Number.parseInt(doc.id, 10) || Number(doc.id.replace(/\D/g, '')) || undefined;
    const numericProjectId = Number.parseInt(doc.projectId, 10) || Number(doc.projectId.replace(/\D/g, '')) || undefined;
    await autoStart({
      documentId: numericDocId,
      projectId: numericProjectId,
      documentName: doc.name,
      projectName: projects.find(p => p.id === doc.projectId)?.name,
    });

    setModalLoading(true);
    setModalError(null);
    try {
      // Simulate async load for modal content (could fetch fresh data here)
      await new Promise(resolve => setTimeout(resolve, 300));
      setSelectedDoc(doc);
    } catch (err: any) {
      setModalError(err?.message || 'Не удалось загрузить детали документа');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedDoc(null);
    setModalError(null);
  };

  const handleAddComment = (docId: string) => {
    const text = commentText[docId]?.trim();
    if (!text) return;
    onAddComment(docId, 'Администратор', text);
    setCommentText(prev => ({ ...prev, [docId]: '' }));
  };

  const overdueDocs = documents.filter(d => d.status === 'overdue');

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>📄 ДОКУМЕНТЫ ПО ПРОЕКТАМ</h2>

      {/* Alerts */}
      {overdueDocs.length > 0 && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--iris-accent-coral) 12%, var(--iris-bg-surface))', border: '1px solid var(--iris-accent-coral)' }}>
          <div className="text-sm font-bold mb-2" style={{ color: 'var(--iris-accent-coral)' }}>
            ⚠️ ПРОСРОЧЕННЫЕ ДОКУМЕНТЫ ({overdueDocs.length})
          </div>
          <div className="space-y-1">
            {overdueDocs.map(d => {
              const p = projects.find(pr => pr.id === d.projectId);
              return (
                <div key={d.id} className="flex items-center gap-3 text-xs">
                  <span className="font-bold" style={{ color: 'var(--iris-accent-coral)' }}>{d.number}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{d.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{p?.name}</span>
                  <span className="ml-auto" style={{ color: 'var(--iris-accent-coral)' }}>Просрочено!</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-subtle)' }}>
          <SearchIcon size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по номеру, названию или ответственному..."
            className="bg-transparent outline-none text-sm w-48 md:w-72"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'draft', 'in_review', 'approved', 'in_production', 'rejected', 'overdue'] as const).map((s) => {
            const isActive = filter === s;
            const cfg = s === 'all' ? { label: 'Все', color: '#64748b' } : statusConfig[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="text-sm px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer"
                style={{
                  background: isActive ? cfg.color : 'var(--iris-bg-surface)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: isActive ? `1px solid ${cfg.color}` : '1px solid var(--iris-border-subtle)',
                }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents by project */}
      <div className="space-y-5">
        {projects.map(project => {
          const docs = filteredDocs.filter(d => d.projectId === project.id);
          if (docs.length === 0) return null;
          const approved = (byProject[project.id] || []).filter(d => d.status === 'approved').length;
          const total = (byProject[project.id] || []).length;

          return (
            <div key={project.id} className="rounded-lg p-4" style={{ backgroundColor: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-subtle)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</span>
                  <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>({project.code})</span>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--iris-bg-subtle)', color: 'var(--text-primary)' }}>
                  Согласовано: {approved}/{total}
                </span>
              </div>

              <div className="space-y-2">
                {docs.map(doc => {
                  const cfg = statusConfig[doc.status];
                  const isExpanded = expanded.has(doc.id);
                  const diff = daysDiff(doc.plannedReady, doc.actualReady);
                  const hasOpenRemarks = doc.remarks?.some(r => r.status === 'open');

                  return (
                    <div key={doc.id} className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--iris-bg-app)', border: '1px solid var(--iris-border-subtle)' }}>
                      {/* Main row */}
                      <div
                        className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 cursor-pointer transition-colors"
                        onClick={() => toggleExpanded(doc.id)}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-app)'; }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>{doc.number}</span>
                          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{typeLabels[doc.type]} — {doc.name}</span>
                          {hasOpenRemarks && (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                              <AlertCircle size={10} /> Замечания
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs shrink-0">
                          <span style={{ color: 'var(--text-secondary)' }}>{doc.responsible}</span>
                          <span className="flex items-center gap-1" style={{ color: diff === null ? 'var(--text-muted)' : diff > 0 ? 'var(--iris-accent-coral)' : diff < 0 ? 'var(--iris-accent-green)' : 'var(--text-secondary)' }}>
                            <Calendar size={12} />
                            {formatDate(doc.plannedReady)}
                            {diff !== null && diff > 0 && ` (+${diff} дн.)`}
                            {diff !== null && diff < 0 && ` (${diff} дн.)`}
                          </span>
                          {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-3" style={{ borderTop: '1px solid var(--iris-border-subtle)' }}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                            <div>
                              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Согласование</div>
                              <div className="space-y-1">
                                {doc.approvers?.map((a, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs">
                                    <span style={{ color: 'var(--text-secondary)' }}>{a.name} <span style={{ color: 'var(--text-muted)' }}>({a.role})</span></span>
                                    <span style={{
                                      color: a.status === 'approved' ? '#22c55e' : a.status === 'rejected' ? '#ef4444' : '#f59e0b',
                                    }}>
                                      {a.status === 'approved' ? '✓' : a.status === 'rejected' ? '✕' : '…'}
                                    </span>
                                  </div>
                                ))}
                                {doc.currentApprover && (
                                  <div className="text-xs mt-1" style={{ color: 'var(--iris-accent-amber)' }}>
                                    На согласовании у: <strong>{doc.currentApprover}</strong>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Сроки</div>
                              <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <div>План: {formatDate(doc.plannedReady)}</div>
                                <div>Факт: {formatDate(doc.actualReady) || '—'}</div>
                                <div>Отклонение: {diff === null ? '—' : diff === 0 ? 'в срок' : diff > 0 ? `+${diff} дн. (позже)` : `${diff} дн. (раньше)`}</div>
                              </div>
                            </div>

                            <div>
                              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Действия</div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpen(doc); }}
                                  className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors"
                                  style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}
                                >
                                  <Eye size={12} /> Открыть
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePrint(doc); }}
                                  className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors"
                                  style={{ background: 'var(--iris-bg-subtle)', color: 'var(--text-secondary)' }}
                                >
                                  <Printer size={12} /> Печать
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Remarks */}
                          {doc.remarks && doc.remarks.length > 0 && (
                            <div>
                              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Замечания</div>
                              <div className="space-y-2">
                                {doc.remarks.map(r => (
                                  <div key={r.id} className="p-2 rounded" style={{ background: r.status === 'open' ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)', border: '1px solid var(--iris-border-subtle)' }}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{r.author} <span style={{ color: 'var(--text-muted)' }}>({r.role})</span></span>
                                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: r.status === 'open' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', color: r.status === 'open' ? '#ef4444' : '#22c55e' }}>
                                        {r.status === 'open' ? 'Открыто' : 'Устранено'}
                                      </span>
                                    </div>
                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.text}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Comments */}
                          <div>
                            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Комментарии команды</div>
                            <div className="space-y-2">
                              {doc.comments && doc.comments.length > 0 ? (
                                doc.comments.map(c => (
                                  <div key={c.id} className="p-2 rounded text-xs" style={{ background: 'var(--iris-bg-subtle)', color: 'var(--text-secondary)' }}>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.author}</span>
                                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString('ru-RU')}</span>
                                    <div className="mt-0.5">{c.text}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Комментариев пока нет</div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <input
                                  value={commentText[doc.id] || ''}
                                  onChange={(e) => setCommentText(prev => ({ ...prev, [doc.id]: e.target.value }))}
                                  placeholder="Добавить комментарий для команды..."
                                  className="flex-1 text-xs px-2 py-1.5 rounded outline-none"
                                  style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-subtle)', color: 'var(--text-primary)' }}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(doc.id); }}
                                />
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAddComment(doc.id); }}
                                  className="inline-flex items-center gap-1 text-sm px-2 py-1.5 rounded transition-colors"
                                  style={{ background: '#2563eb', color: '#fff' }}
                                >
                                  <Plus size={12} /> Добавить
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Detail Modal */}
      <Modal
        isOpen={selectedDoc !== null}
        onClose={handleCloseModal}
        title={`📄 ${selectedDoc?.number || 'Документ'}`}
        size="lg"
      >
        {modalLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--iris-accent-blue)' }} />
            <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Загрузка...</span>
          </div>
        ) : modalError ? (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {modalError}
          </div>
        ) : selectedDoc ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{selectedDoc.name}</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{typeLabels[selectedDoc.type]}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Статус</span>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: statusConfig[selectedDoc.status].bg,
                      color: statusConfig[selectedDoc.status].color,
                      border: `1px solid ${statusConfig[selectedDoc.status].color}30`
                    }}>
                    {statusConfig[selectedDoc.status].icon} {statusConfig[selectedDoc.status].label}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ответственный</span>
                <div className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{selectedDoc.responsible}</div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Плановая готовность</span>
                <div className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{formatDate(selectedDoc.plannedReady)}</div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Фактическая готовность</span>
                <div className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{formatDate(selectedDoc.actualReady) || '—'}</div>
              </div>
              {selectedDoc.currentApprover && (
                <div className="col-span-2">
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>На согласовании у</span>
                  <div className="mt-1 text-sm" style={{ color: 'var(--iris-accent-amber)' }}>{selectedDoc.currentApprover}</div>
                </div>
              )}
            </div>

            {selectedDoc.remarks && selectedDoc.remarks.length > 0 && (
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Замечания</span>
                <div className="mt-2 space-y-2">
                  {selectedDoc.remarks.map(r => (
                    <div key={r.id} className="p-2 rounded text-xs" style={{
                      background: r.status === 'open' ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
                      border: '1px solid var(--iris-border-subtle)'
                    }}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.author}</span>
                        <span className="px-1.5 py-0.5 rounded-full" style={{
                          background: r.status === 'open' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                          color: r.status === 'open' ? '#ef4444' : '#22c55e'
                        }}>
                          {r.status === 'open' ? 'Открыто' : 'Устранено'}
                        </span>
                      </div>
                      <div className="mt-1" style={{ color: 'var(--text-secondary)' }}>{r.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDoc.approvers && selectedDoc.approvers.length > 0 && (
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Цепочка согласования</span>
                <div className="mt-2 space-y-1">
                  {selectedDoc.approvers.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--text-secondary)' }}>{a.name} <span style={{ color: 'var(--text-muted)' }}>({a.role})</span></span>
                      <span style={{
                        color: a.status === 'approved' ? '#22c55e' : a.status === 'rejected' ? '#ef4444' : '#f59e0b',
                      }}>
                        {a.status === 'approved' ? '✓' : a.status === 'rejected' ? '✕' : '…'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
