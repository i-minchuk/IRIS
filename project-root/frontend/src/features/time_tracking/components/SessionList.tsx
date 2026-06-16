import { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight, FileText, Briefcase, User } from 'lucide-react';
import { getSessions, type TimeSession } from '../api/sessions';
import { toast } from 'sonner';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}ч ${m}мин`;
  return `${m}мин`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function SessionList() {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadSessions = async (targetPage: number) => {
    setIsLoading(true);
    try {
      const data = await getSessions({ page: targetPage, page_size: pageSize });
      setSessions(data.items);
      setTotal(data.total);
      setPages(data.pages);
      setPage(data.page);
    } catch {
      toast.error('Не удалось загрузить сессии');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions(1);
  }, []);

  const handlePrev = () => {
    if (page > 1) loadSessions(page - 1);
  };

  const handleNext = () => {
    if (page < pages) loadSessions(page + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--iris-text-primary)]">Сессии</h3>
        <span className="text-sm text-[var(--iris-text-muted)]">Всего: {total}</span>
      </div>

      {isLoading && sessions.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-[var(--iris-text-muted)]">
          <div className="w-5 h-5 border-2 border-[var(--iris-border)] border-t-[var(--iris-accent)] rounded-full animate-spin mr-2" />
          Загрузка…
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-[var(--iris-text-muted)]">
          <Clock size={32} className="mx-auto mb-2 opacity-50" />
          <p>Нет записанных сессий</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--iris-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--iris-bg-elevated)] text-[var(--iris-text-muted)]">
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Начало</th>
                <th className="px-4 py-3 text-left font-medium">Окончание</th>
                <th className="px-4 py-3 text-left font-medium">Длительность</th>
                <th className="px-4 py-3 text-left font-medium">Активное время</th>
                <th className="px-4 py-3 text-left font-medium">Контекст</th>
                <th className="px-4 py-3 text-left font-medium">Эффективность</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--iris-border)]">
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className="hover:bg-[var(--iris-bg-hover)] transition-colors"
                >
                  <td className="px-4 py-3 text-[var(--iris-text-primary)]">#{session.id}</td>
                  <td className="px-4 py-3 text-[var(--iris-text-secondary)]">
                    {formatDate(session.started_at)}
                  </td>
                  <td className="px-4 py-3 text-[var(--iris-text-secondary)]">
                    {session.ended_at ? formatDate(session.ended_at) : (
                      <span className="inline-flex items-center gap-1 text-emerald-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Активна
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--iris-text-primary)] font-medium">
                    {formatDuration(session.total_duration)}
                  </td>
                  <td className="px-4 py-3 text-[var(--iris-text-secondary)]">
                    {formatDuration(session.active_time)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {session.document_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-xs">
                          <FileText size={10} />
                          Док #{session.document_id}
                        </span>
                      )}
                      {session.project_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 text-xs">
                          <Briefcase size={10} />
                          Проект #{session.project_id}
                        </span>
                      )}
                      {!session.document_id && !session.project_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--iris-bg-elevated)] text-[var(--iris-text-muted)] text-xs">
                          <User size={10} />
                          Общая
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {session.efficiency_score !== undefined && session.efficiency_score !== null ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          session.efficiency_score >= 80
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : session.efficiency_score >= 50
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {session.efficiency_score}%
                      </span>
                    ) : (
                      <span className="text-[var(--iris-text-muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={page <= 1 || isLoading}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-[var(--iris-text-secondary)] hover:bg-[var(--iris-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Назад
          </button>
          <span className="text-sm text-[var(--iris-text-muted)]">
            Страница {page} из {pages}
          </span>
          <button
            onClick={handleNext}
            disabled={page >= pages || isLoading}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-[var(--iris-text-secondary)] hover:bg-[var(--iris-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Вперёд
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
