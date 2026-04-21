import { Trophy, Star } from 'lucide-react';
import { Card, Button } from './ui';

export default function DailyQuestWidget() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--accent-approvals)' }}>
            <Trophy size={16} />
            Ежедневный квест
          </div>

          <h3 className="mt-3 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Закрыть 3 задачи без просрочки
          </h3>

          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
            Выполни план дня и получи дополнительные очки в инженерном рейтинге.
          </p>
        </div>

        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            backgroundColor: 'var(--accent-approvals-light)',
            color: 'var(--accent-approvals)',
          }}
        >
          <Star size={18} />
        </div>
      </div>

      <div className="mt-4">
        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--bg-surface-2)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: '66%',
              background: 'linear-gradient(90deg, var(--primary), var(--accent-engineering))',
            }}
          />
        </div>
        <div className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Выполнено 2 из 3 шагов
        </div>
      </div>

      <div className="mt-4">
        <Button variant="outline" size="sm" className="w-full">
          Открыть задачи
        </Button>
      </div>
    </Card>
  );
}