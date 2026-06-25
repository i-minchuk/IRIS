import { useEffect, useState } from 'react';
import { Play, Square, Timer, FileText, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeTrackingStore } from '../store/useTimeTrackingStore';
import { startSession, stopSession } from '../api/sessions';
import { toast } from 'sonner';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface TimerWidgetProps {
  documentId?: number;
  projectId?: number;
  documentName?: string;
  projectName?: string;
  variant?: 'floating' | 'inline';
}

export default function TimerWidget({
  documentId: propDocumentId,
  projectId: propProjectId,
  documentName: propDocumentName,
  projectName: propProjectName,
  variant = 'floating',
}: TimerWidgetProps) {
  const {
    isRunning,
    sessionId,
    elapsedSeconds,
    editCount,
    documentId: storeDocumentId,
    projectId: storeProjectId,
    startTimer,
    stopTimer,
    tick,
    incrementEditCount,
  } = useTimeTrackingStore();

  const documentId = propDocumentId ?? (storeDocumentId || undefined);
  const projectId = propProjectId ?? (storeProjectId || undefined);
  const documentName = propDocumentName;
  const projectName = propProjectName;

  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Tick every second when running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Keyboard shortcut: Ctrl+Shift+T to toggle timer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        if (isRunning) {
          handleStop();
        } else {
          handleStart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning]);

  const handleStart = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const session = await startSession({ document_id: documentId, project_id: projectId });
      startTimer(session, documentId, projectId);
      toast.success('Таймер запущен');
    } catch {
      toast.error('Не удалось запустить таймер');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!sessionId || isLoading) return;
    setIsLoading(true);
    try {
      await stopSession(sessionId, {
        active_time: elapsedSeconds,
        edit_count: editCount,
      });
      stopTimer();
      toast.success(`Сессия завершена. Длительность: ${formatDuration(elapsedSeconds)}`);
    } catch {
      toast.error('Не удалось остановить таймер');
    } finally {
      setIsLoading(false);
    }
  };

  // Inline variant (for document/project pages)
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--iris-bg-elevated)] border border-[var(--iris-border)]">
        <Timer size={18} className={isRunning ? 'text-emerald-500 animate-pulse' : 'text-[var(--iris-text-muted)]'} />
        <span className="font-mono text-sm font-semibold text-[var(--iris-text-primary)]">
          {formatDuration(elapsedSeconds)}
        </span>
        <button
          onClick={isRunning ? handleStop : handleStart}
          disabled={isLoading}
          className={`p-1.5 rounded-md transition-colors ${
            isRunning
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
              : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
          } disabled:opacity-50`}
        >
          {isRunning ? <Square size={14} /> : <Play size={14} />}
        </button>
        {isRunning && editCount > 0 && (
          <span className="text-xs text-[var(--iris-text-muted)]">{editCount} правок</span>
        )}
      </div>
    );
  }

  // Floating variant (default)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div
          className={`rounded-xl border border-[var(--iris-border)] shadow-lg bg-[var(--iris-bg-card)] backdrop-blur-sm ${
            isExpanded ? 'w-72' : 'w-auto'
          }`}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              <Timer size={18} className={isRunning ? 'text-emerald-500' : 'text-[var(--iris-text-muted)]'} />
              <span className="font-mono text-sm font-semibold text-[var(--iris-text-primary)]">
                {formatDuration(elapsedSeconds)}
              </span>
              {isRunning && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isRunning) {
                  handleStop();
                } else {
                  handleStart();
                }
              }}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-colors ${
                isRunning
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
              } disabled:opacity-50`}
            >
              {isRunning ? <Square size={16} /> : <Play size={16} />}
            </button>
          </div>

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  {/* Context info */}
                  {(documentName || projectName || documentId || projectId) && (
                    <div className="space-y-1 text-xs text-[var(--iris-text-muted)]">
                      {(documentName || documentId) && (
                        <div className="flex items-center gap-1.5">
                          <FileText size={12} />
                          <span className="truncate">{documentName || `Документ #${documentId}`}</span>
                        </div>
                      )}
                      {(projectName || projectId) && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase size={12} />
                          <span className="truncate">{projectName || `Проект #${projectId}`}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  {isRunning && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="px-2 py-1.5 rounded-md bg-[var(--iris-bg-elevated)]">
                        <div className="text-[var(--iris-text-muted)]">Правок</div>
                        <div className="font-semibold text-[var(--iris-text-primary)]">{editCount}</div>
                      </div>
                      <div className="px-2 py-1.5 rounded-md bg-[var(--iris-bg-elevated)]">
                        <div className="text-[var(--iris-text-muted)]">Активное время</div>
                        <div className="font-semibold text-[var(--iris-text-primary)]">
                          {formatDuration(elapsedSeconds)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick actions */}
                  {isRunning && (
                    <button
                      onClick={incrementEditCount}
                      className="w-full px-3 py-1.5 text-xs rounded-md bg-[var(--iris-bg-elevated)] text-[var(--iris-text-secondary)] hover:bg-[var(--iris-bg-hover)] transition-colors"
                    >
                      +1 правка
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
