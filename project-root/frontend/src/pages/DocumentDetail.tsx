import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { ApprovalChain } from '@/components/documents/ApprovalChain';
import { useRemarksStore } from '@/stores/remarksStore';
import { DocumentAnalysisPanel } from '@/features/ai/components/DocumentAnalysisPanel';
import { AIChatPanel } from '@/features/ai/components/AIChatPanel';
import { RequirementsPanel } from '@/features/ai/components/RequirementsPanel';
import { FileText, MessageSquare, History, Users, ArrowLeft, Sparkles, Wrench, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Tab = 'info' | 'files' | 'approval' | 'remarks' | 'history' | 'ai-analysis' | 'ai-requirements' | 'ai-chat';

const mockApprovers = [
  { id: 1, name: 'Алексей Петров', role: 'ГИП', status: 'approved' as const, date: '2026-05-28', comment: 'Согласовано без замечаний' },
  { id: 2, name: 'Мария Сидорова', role: 'Нормоконтролер', status: 'approved' as const, date: '2026-05-29', comment: 'Незначительные правки внесены' },
  { id: 3, name: 'Дмитрий Волков', role: 'Технический директор', status: 'pending' as const },
];

const mockHistory = [
  { date: '2026-06-01', user: 'Алексей Петров', action: 'Согласование', details: 'Документ утверждён' },
  { date: '2026-05-30', user: 'Мария Сидорова', action: 'Проверка', details: 'Замечания устранены' },
  { date: '2026-05-25', user: 'Иван Кузнецов', action: 'Создание', details: 'Документ создан' },
];

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const remarks = useRemarksStore(s => s.remarks);
  const documentRemarks = remarks.filter(r => r.document_id === Number(id));

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
            КМ-001-Rev.B — Комплект чертежей
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <DocumentStatusBadge status="approval" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Проект: Альфа</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Дисциплина: КМ</span>
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
                  <span style={{ color: 'var(--text-primary)' }}>КМ-001-Rev.B</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Название:</span>
                  <span style={{ color: 'var(--text-primary)' }}>Комплект чертежей металлоконструкций</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Тип:</span>
                  <span style={{ color: 'var(--text-primary)' }}>КМ</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Статус:</span>
                  <DocumentStatusBadge status="approval" />
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Автор:</span>
                  <span style={{ color: 'var(--text-primary)' }}>Иван Кузнецов</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Дедлайн:</span>
                  <span style={{ color: 'var(--text-primary)' }}>15.06.2026</span>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Проект</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Проект:</span>
                  <span style={{ color: 'var(--text-primary)' }}>Альфа</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Заказчик:</span>
                  <span style={{ color: 'var(--text-primary)' }}>ООО "СтройГаз"</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Стадия:</span>
                  <span style={{ color: 'var(--text-primary)' }}>РД</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'approval' && (
          <Card padding="md">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Цепочка согласования</h3>
            <ApprovalChain approvers={mockApprovers} />
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
            <div className="space-y-3">
              {mockHistory.map((h, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--brand-iris)' }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{h.action}</div>
                    <div className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>{h.details}</div>
                    <div className="text-base md:text-lg font-medium leading-relaxed mt-1 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {h.user} • {new Date(h.date).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'files' && (
          <Card padding="md">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Файлы</h3>
            <div className="space-y-2">
              {['КМ-001-Rev.B.pdf', 'КМ-001-Rev.B.dwg', 'КМ-001-Rev.B.xlsx'].map(file => (
                <div
                  key={file}
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: 'var(--bg-surface-2)' }}
                >
                  <FileText size={16} style={{ color: 'var(--brand-iris)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{file}</span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>2.4 MB</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
