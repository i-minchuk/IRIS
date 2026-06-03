import type { ChecklistItem } from '@/types/release';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface ReleaseChecklistProps {
  items: ChecklistItem[];
  onToggle: (itemId: string) => void;
  readOnly?: boolean;
}

export function ReleaseChecklist({ items, onToggle, readOnly }: ReleaseChecklistProps) {
  const categories = [...new Set(items.map(i => i.category))];

  const categoryLabels: Record<string, string> = {
    code_review: 'Code Review',
    testing: 'Тестирование',
    security: 'Безопасность',
    documentation: 'Документация',
    deployment: 'Развёртывание',
  };

  return (
    <div className="space-y-4">
      {categories.map(category => {
        const categoryItems = items.filter(i => i.category === category);
        return (
          <div key={category}>
            <h4 className="text-sm font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
              {categoryLabels[category] || category}
            </h4>
            <div className="space-y-1">
              {categoryItems.map(item => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${!readOnly ? 'cursor-pointer hover:opacity-80' : ''}`}
                  style={{ backgroundColor: item.completed ? 'color-mix(in srgb, var(--success) 5%, var(--bg-surface))' : 'var(--bg-surface)' }}
                  onClick={() => !readOnly && onToggle(item.id)}
                >
                  <div className="mt-0.5">
                    {item.completed ? (
                      <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                    ) : (
                      <Circle size={16} style={{ color: 'var(--text-tertiary)' }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${item.completed ? 'line-through opacity-60' : ''}`} style={{ color: 'var(--text-primary)' }}>
                        {item.text}
                      </span>
                      {item.required && (
                        <span className="text-xs" style={{ color: 'var(--error)' }} title="Обязательный пункт">
                          <AlertCircle size={12} />
                        </span>
                      )}
                    </div>
                    {item.assignee && (
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        @{item.assignee}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
