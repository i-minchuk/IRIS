import { create } from 'zustand';
import type { SupportTicket, Incident, KBArticle, TicketStatus, IncidentStatus } from '@/types/support';
import {
  getTickets,
  getIncidents,
  getKbArticles,
  updateTicket,
  updateIncident,
} from '@/features/admin/api/supportApi';

interface SupportState {
  tickets: SupportTicket[];
  incidents: Incident[];
  kbArticles: KBArticle[];
  selectedTicket: SupportTicket | null;
  selectedIncident: Incident | null;
  isLoading: boolean;
  error: string | null;

  fetchTickets: () => Promise<void>;
  fetchIncidents: () => Promise<void>;
  fetchKbArticles: () => Promise<void>;
  setTickets: (tickets: SupportTicket[]) => void;
  setIncidents: (incidents: Incident[]) => void;
  setKBArticles: (articles: KBArticle[]) => void;
  updateTicketStatus: (ticketId: number, status: TicketStatus) => Promise<void>;
  updateIncidentStatus: (incidentId: number, status: IncidentStatus) => Promise<void>;
  getTicketsByStatus: (status: TicketStatus) => SupportTicket[];
  getOpenTickets: () => SupportTicket[];
  getOpenIncidents: () => Incident[];
  getKBCategories: () => string[];
  getArticlesByCategory: (category: string) => KBArticle[];
  getSLACompliance: () => number;
}

export const useSupportStore = create<SupportState>((set, get) => ({
  tickets: [],
  incidents: [],
  kbArticles: [],
  selectedTicket: null,
  selectedIncident: null,
  isLoading: false,
  error: null,

  fetchTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const tickets = await getTickets();
      set({ tickets, isLoading: false });
    } catch (err) {
      console.error('Failed to load support tickets:', err);
      set({ isLoading: false, error: 'Не удалось загрузить тикеты поддержки' });
    }
  },

  fetchIncidents: async () => {
    set({ isLoading: true, error: null });
    try {
      const incidents = await getIncidents();
      set({ incidents, isLoading: false });
    } catch (err) {
      console.error('Failed to load incidents:', err);
      set({ isLoading: false, error: 'Не удалось загрузить инциденты' });
    }
  },

  fetchKbArticles: async () => {
    set({ isLoading: true, error: null });
    try {
      const kbArticles = await getKbArticles();
      set({ kbArticles, isLoading: false });
    } catch (err) {
      console.error('Failed to load KB articles:', err);
      set({ isLoading: false, error: 'Не удалось загрузить базу знаний' });
    }
  },

  setTickets: (tickets) => set({ tickets }),
  setIncidents: (incidents) => set({ incidents }),
  setKBArticles: (articles) => set({ kbArticles: articles }),

  updateTicketStatus: async (ticketId, status) => {
    try {
      const updated = await updateTicket(ticketId, { status });
      set(state => ({
        tickets: state.tickets.map(t => (t.id === ticketId ? updated : t)),
        selectedTicket: state.selectedTicket?.id === ticketId ? updated : state.selectedTicket,
      }));
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      set({ error: 'Не удалось обновить статус тикета' });
    }
  },

  updateIncidentStatus: async (incidentId, status) => {
    try {
      const updated = await updateIncident(incidentId, { status });
      set(state => ({
        incidents: state.incidents.map(i => (i.id === incidentId ? updated : i)),
        selectedIncident: state.selectedIncident?.id === incidentId ? updated : state.selectedIncident,
      }));
    } catch (err) {
      console.error('Failed to update incident status:', err);
      set({ error: 'Не удалось обновить статус инцидента' });
    }
  },

  getTicketsByStatus: (status) => get().tickets.filter(t => t.status === status),
  getOpenTickets: () => get().tickets.filter(t => ['new', 'open', 'in_progress'].includes(t.status)),
  getOpenIncidents: () => get().incidents.filter(i => ['detected', 'investigating', 'mitigated'].includes(i.status)),
  getKBCategories: () => [...new Set(get().kbArticles.map(a => a.category))],
  getArticlesByCategory: (category) => get().kbArticles.filter(a => a.category === category),

  getSLACompliance: () => {
    const tickets = get().tickets.filter(t => t.resolved_at);
    if (tickets.length === 0) return 100;
    const compliant = tickets.filter(t => {
      const resolved = new Date(t.resolved_at!).getTime();
      const deadline = new Date(t.sla_deadline).getTime();
      return resolved <= deadline;
    }).length;
    return Math.round((compliant / tickets.length) * 100);
  },
}));
