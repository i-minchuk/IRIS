import { create } from 'zustand';
import type { SupportTicket, Incident, KBArticle, TicketStatus, IncidentStatus } from '@/types/support';
import { tickets as mockTickets, incidents as mockIncidents, kbArticles as mockKBArticles } from '@/stores/mocks/support';

interface SupportState {
  tickets: SupportTicket[];
  incidents: Incident[];
  kbArticles: KBArticle[];
  selectedTicket: SupportTicket | null;
  selectedIncident: Incident | null;

  setTickets: (tickets: SupportTicket[]) => void;
  setIncidents: (incidents: Incident[]) => void;
  setKBArticles: (articles: KBArticle[]) => void;
  updateTicketStatus: (ticketId: number, status: TicketStatus) => void;
  updateIncidentStatus: (incidentId: number, status: IncidentStatus) => void;
  getTicketsByStatus: (status: TicketStatus) => SupportTicket[];
  getOpenTickets: () => SupportTicket[];
  getOpenIncidents: () => Incident[];
  getKBCategories: () => string[];
  getArticlesByCategory: (category: string) => KBArticle[];
  getSLACompliance: () => number;
}

export const useSupportStore = create<SupportState>((set, get) => ({
  tickets: mockTickets,
  incidents: mockIncidents,
  kbArticles: mockKBArticles,
  selectedTicket: null,
  selectedIncident: null,

  setTickets: (tickets) => set({ tickets }),
  setIncidents: (incidents) => set({ incidents }),
  setKBArticles: (articles) => set({ kbArticles: articles }),

  updateTicketStatus: (ticketId, status) => {
    set(state => ({
      tickets: state.tickets.map(t =>
        t.id === ticketId ? { ...t, status, updated_at: new Date().toISOString() } : t
      ),
    }));
  },

  updateIncidentStatus: (incidentId, status) => {
    set(state => ({
      incidents: state.incidents.map(i =>
        i.id === incidentId ? { ...i, status } : i
      ),
    }));
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
