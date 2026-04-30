// src/pages/ArchivePage/api/archiveApi.ts
/**
 * API клиент для Архива
 */

const API_BASE = '/api/v1';

interface Attachment {
  filename: string;
  url: string;
  type: string;
  size: number;
}

interface Certificate {
  number: string;
  issued_at: string;
  valid_until: string;
  url: string;
}

export interface ArchiveEntry {
  id: string;
  project_id: string;
  entry_type: string;
  source_table: string;
  source_id: string;
  title: string;
  description: string | null;
  content_snapshot: Record<string, any> | null;
  author_id: string | null;
  occurred_at: string;
  tags: string[];
  attachments: Attachment[];
  related_entry_ids: string[];
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArchiveMaterial {
  id: string;
  project_id: string;
  material_type: string;
  name: string;
  specification: string | null;
  manufacturer: string | null;
  quantity: number | null;
  unit: string | null;
  used_in_constructions: string[];
  certificates: Certificate[];
  attached_files: Attachment[];
  entry_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArchiveConstruction {
  id: string;
  project_id: string;
  name: string;
  construction_type: string;
  designation: string | null;
  location: string | null;
  materials_used: string[];
  documents_related: string[];
  status: string;
  installed_at: string | null;
  tested_at: string | null;
  accepted_at: string | null;
  photos: Attachment[];
  entry_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArchiveFilter {
  date_from?: string;
  date_to?: string;
  entry_types?: string[];
  authors?: string[];
  has_attachments?: boolean;
  is_pinned?: boolean;
  search_text?: string;
}

export interface ArchiveStatistics {
  total_entries: number;
  by_type: Record<string, number>;
  by_month: Record<string, number>;
  materials_count: number;
  constructions_count: number;
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  occurred_at: string;
  author_name: string | null;
  data: Record<string, any>;
}

export interface SearchFilters {
  entry_types?: string[];
  date_from?: string;
  date_to?: string;
  has_attachments?: boolean;
}

export const archiveApi = {
  // ==================== Entries ====================

  /** Список записей */
  async getEntries(
    projectId: string,
    filters: ArchiveFilter & { page?: number; limit?: number } = {}
  ): Promise<ArchiveEntry[]> {
    const params = new URLSearchParams({ project_id: projectId });
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.entry_types?.length) {
      filters.entry_types.forEach((t) => params.append('entry_types', t));
    }
    if (filters.has_attachments) params.append('has_attachments', 'true');
    if (filters.is_pinned !== undefined) params.append('is_pinned', filters.is_pinned.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const res = await fetch(`${API_BASE}/archive/entries?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch entries');
    return res.json();
  },

  /** Детали записи */
  async getEntry(entryId: string): Promise<ArchiveEntry> {
    const res = await fetch(`${API_BASE}/archive/entries/${entryId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch entry');
    return res.json();
  },

  /** Закрепить запись */
  async pinEntry(entryId: string): Promise<ArchiveEntry> {
    const res = await fetch(`${API_BASE}/archive/entries/${entryId}/pin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to pin entry');
    return res.json();
  },

  /** Открепить запись */
  async unpinEntry(entryId: string): Promise<ArchiveEntry> {
    const res = await fetch(`${API_BASE}/archive/entries/${entryId}/pin`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to unpin entry');
    return res.json();
  },

  // ==================== Search ====================

  /** Полнотекстовый поиск */
  async search(
    query: string,
    projectId: string,
    filters: SearchFilters = {}
  ): Promise<{
    entries: ArchiveEntry[];
    materials: ArchiveMaterial[];
    constructions: ArchiveConstruction[];
    total: number;
    facets: Record<string, any>;
  }> {
    const params = new URLSearchParams({ q: query, project_id: projectId });
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.has_attachments) params.append('has_attachments', 'true');
    if (filters.entry_types?.length) {
      filters.entry_types.forEach((t) => params.append('entry_types', t));
    }

    const res = await fetch(`${API_BASE}/archive/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to search');
    return res.json();
  },

  // ==================== Materials ====================

  /** Список материалов */
  async getMaterials(projectId: string): Promise<ArchiveMaterial[]> {
    const params = new URLSearchParams({ project_id: projectId });
    const res = await fetch(`${API_BASE}/archive/materials?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch materials');
    return res.json();
  },

  /** Создать материал */
  async createMaterial(data: Partial<ArchiveMaterial>): Promise<ArchiveMaterial> {
    const res = await fetch(`${API_BASE}/archive/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create material');
    return res.json();
  },

  /** Обновить материал */
  async updateMaterial(materialId: string, data: Partial<ArchiveMaterial>): Promise<ArchiveMaterial> {
    const res = await fetch(`${API_BASE}/archive/materials/${materialId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to update material');
    return res.json();
  },

  /** Удалить материал */
  async deleteMaterial(materialId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/archive/materials/${materialId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to delete material');
  },

  // ==================== Constructions ====================

  /** Список конструкций */
  async getConstructions(projectId: string): Promise<ArchiveConstruction[]> {
    const params = new URLSearchParams({ project_id: projectId });
    const res = await fetch(`${API_BASE}/archive/constructions?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch constructions');
    return res.json();
  },

  /** Создать конструкцию */
  async createConstruction(data: Partial<ArchiveConstruction>): Promise<ArchiveConstruction> {
    const res = await fetch(`${API_BASE}/archive/constructions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create construction');
    return res.json();
  },

  /** Обновить конструкцию */
  async updateConstruction(
    constructionId: string,
    data: Partial<ArchiveConstruction>
  ): Promise<ArchiveConstruction> {
    const res = await fetch(`${API_BASE}/archive/constructions/${constructionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to update construction');
    return res.json();
  },

  /** Удалить конструкцию */
  async deleteConstruction(constructionId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/archive/constructions/${constructionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to delete construction');
  },

  // ==================== Statistics & Timeline ====================

  /** Статистика */
  async getStatistics(projectId: string): Promise<ArchiveStatistics> {
    const params = new URLSearchParams({ project_id: projectId });
    const res = await fetch(`${API_BASE}/archive/statistics?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch statistics');
    return res.json();
  },

  /** Хронология */
  async getTimeline(
    projectId: string,
    filters: { date_from?: string; date_to?: string; limit?: number } = {}
  ): Promise<TimelineEvent[]> {
    const params = new URLSearchParams({ project_id: projectId });
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const res = await fetch(`${API_BASE}/archive/timeline?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch timeline');
    const data = await res.json();
    return data.events;
  },
};
