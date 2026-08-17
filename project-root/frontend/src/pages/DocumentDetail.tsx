import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { useRemarksStore } from '@/stores/remarksStore';
import { DocumentAnalysisPanel } from '@/features/ai/components/DocumentAnalysisPanel';
import { AIChatPanel } from '@/features/ai/components/AIChatPanel';
import { RequirementsPanel } from '@/features/ai/components/RequirementsPanel';
import { FileText, MessageSquare, History, Users, ArrowLeft, Sparkles, Wrench, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDocument, type DocumentDetail } from '@/features/documents/api/documents';
import { getProject } from '@/features/projects/api/projects';
import type { DocumentStatus } from '@/lib/documentStatusMachine';

type Tab = 'info' | 'files' | 'approval' | 'remarks' | 'history' | 'ai-analysis' | 'ai-requirements' | 'ai-chat';

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

interface ProjectInfo {
  name: string;
  customer_name?: string;
  stage?: string;
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const remarks = useRemarksStore(s => s.remarks);
  const documentRemarks = remarks.filter(r => r.document_id === Number(id));

  useEffect(() => {
    const numericId = Number(id);
    if (!numericId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
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

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Основное', icon: <FileText size={14} /> },
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
          <div className="h-[600px]">
            <AIChatPanel documentId={id} />
          </div>
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

        {activeTab === 'approval' && (
          <Card padding="md">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Цепочка согласования</h3>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Нет данных о цепочке согласования</p>
          </Card>
        )}

        {activeTab === 'remarks' && (
          <Card padding="md">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Замечания</h3>
            {documentRemarks.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Нет замечаний</p>
            ) : (
              <div className="space-y-3">
                {documentRemarks.map(r => (
                  <div key={r.id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={r.priority === 'critical' ? 'error' : r.priority === 'high' ? 'warning' : 'info'}>
                        {r.priority}
                      </Badge>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{r.author_name}</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.title}</p>
                  </div>
                ))}
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
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Файлы</h3>
            {files.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Нет загруженных файлов</p>
            ) : (
              <div className="space-y-2">
                {files.map(rev => (
                  <div
                    key={rev.id}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: 'var(--bg-surface-2)' }}
                  >
                    <FileText size={16} style={{ color: 'var(--brand-iris)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{rev.file_path!.split('/').pop()}</span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>Ревизия {rev.number}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
