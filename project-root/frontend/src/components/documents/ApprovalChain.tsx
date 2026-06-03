import { CheckCircle2, User } from 'lucide-react';

interface Approver {
  id: number;
  name: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'delegated';
  date?: string;
  comment?: string;
}

interface ApprovalChainProps {
  approvers: Approver[];
}

export function ApprovalChain({ approvers }: ApprovalChainProps) {
  return (
    <div className="space-y-3">
      {approvers.map((approver, index) => (
        <div key={approver.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: approver.status === 'approved'
                  ? 'color-mix(in srgb, var(--success) 15%, var(--bg-surface))'
                  : approver.status === 'rejected'
                  ? 'color-mix(in srgb, var(--error) 15%, var(--bg-surface))'
                  : 'var(--bg-surface-2)',
                border: `2px solid ${
                  approver.status === 'approved' ? 'var(--success)' :
                  approver.status === 'rejected' ? 'var(--error)' :
                  'var(--border-default)'
                }`,
              }}
            >
              {approver.status === 'approved' ? (
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
              ) : (
                <User size={14} style={{ color: 'var(--text-tertiary)' }} />
              )}
            </div>
            {index < approvers.length - 1 && (
              <div className="w-0.5 h-6 mt-1" style={{ backgroundColor: 'var(--border-default)' }} />
            )}
          </div>

          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {approver.name}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}
              >
                {approver.role}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-xs"
                style={{
                  color: approver.status === 'approved' ? 'var(--success)' :
                         approver.status === 'rejected' ? 'var(--error)' :
                         'var(--text-tertiary)',
                }}
              >
                {approver.status === 'approved' ? 'Согласовано' :
                 approver.status === 'rejected' ? 'Отклонено' :
                 approver.status === 'delegated' ? 'Делегировано' :
                 'Ожидает'}
              </span>
              {approver.date && (
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(approver.date).toLocaleDateString('ru-RU')}
                </span>
              )}
            </div>
            {approver.comment && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {approver.comment}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
