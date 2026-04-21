import { Link } from 'react-router-dom';
import { CircleX, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div
        className="w-full max-w-2xl rounded-3xl border px-8 py-10 text-center shadow-lg"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--bg-surface-2)' }}
        >
          <CircleX size={34} style={{ color: 'var(--text-tertiary)' }} />
        </div>

        <div
          className="mt-6 text-sm font-semibold uppercase tracking-[0.3em]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          404
        </div>

        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          Страница не найдена
        </h1>

        <p
          className="mx-auto mt-4 max-w-xl text-base leading-7"
          style={{ color: 'var(--text-secondary)' }}
        >
          Возможно, ссылка устарела, страница была перемещена или адрес введён с ошибкой.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/dashboard">
            <Button
              size="sm"
              style={{
                background:
                  'linear-gradient(180deg, color-mix(in srgb, var(--brand-iris) 88%, white 12%), var(--brand-iris))',
                color: 'var(--text-inverse)',
              }}
            >
              На главную
            </Button>
          </Link>

          <Link to="/documents">
            <Button variant="outline" size="sm">
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={16} />
                К документам
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}