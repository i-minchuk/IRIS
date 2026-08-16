import { create } from 'zustand';
import { toast } from 'sonner';
import type { AuditLogEntry, AuditFilter, AuditAction, AuditSeverity } from '@/types/audit';
import { getAuditLogs } from '@/features/admin/api/auditApi';

interface AuditState {
  entries: AuditLogEntry[];
  filter: AuditFilter;
  isLoading: boolean;
  error: string | null;

  fetchEntries: () => Promise<void>;
  setEntries: (entries: AuditLogEntry[]) => void;
  setFilter: (filter: AuditFilter) => void;
  getFilteredEntries: () => AuditLogEntry[];
  getEntriesByAction: (action: AuditAction) => AuditLogEntry[];
  getEntriesBySeverity: (severity: AuditSeverity) => AuditLogEntry[];
  getRecentEntries: (count: number) => AuditLogEntry[];
  getStats: () => { total: number; critical: number; warning: number; info: number };
}

export const useAuditStore = create<AuditState>((set, get) => ({
  entries: [],
  filter: {},
  isLoading: false,
  error: null,

  fetchEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await getAuditLogs();
      set({ entries, isLoading: false });
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      set({ isLoading: false, error: 'Не удалось загрузить журнал аудита' });
      toast.error('Не удалось загрузить журнал аудита');
    }
  },

  setEntries: (entries) => set({ entries }),
  setFilter: (filter) => set({ filter }),

  getFilteredEntries: () => {
    const { entries, filter } = get();
    return entries.filter(entry => {
      if (filter.dateFrom && entry.timestamp < filter.dateFrom) return false;
      if (filter.dateTo && entry.timestamp > filter.dateTo) return false;
      if (filter.userId && entry.user_id !== filter.userId) return false;
      if (filter.action && entry.action !== filter.action) return false;
      if (filter.severity && entry.severity !== filter.severity) return false;
      if (filter.search) {
        const search = filter.search.toLowerCase();
        const text = `${entry.user_name} ${entry.details} ${entry.action}`.toLowerCase();
        if (!text.includes(search)) return false;
      }
      return true;
    });
  },

  getEntriesByAction: (action) => get().entries.filter(e => e.action === action),
  getEntriesBySeverity: (severity) => get().entries.filter(e => e.severity === severity),
  getRecentEntries: (count) => get().entries.slice(0, count),

  getStats: () => {
    const entries = get().entries;
    return {
      total: entries.length,
      critical: entries.filter(e => e.severity === 'critical').length,
      warning: entries.filter(e => e.severity === 'warning').length,
      info: entries.filter(e => e.severity === 'info').length,
    };
  },
}));
