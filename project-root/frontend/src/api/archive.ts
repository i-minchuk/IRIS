/** API client for Archive */
import {
  ArchiveEntry,
  ArchiveMaterial,
  ArchiveConstruction,
  ArchiveSearchQuery,
  ArchiveSearchResult,
  ArchiveStatistics,
  TimelineEvent
} from '@/pages/ArchivePage/types/archive';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ==================== Entry Endpoints ====================

export async function getEntries(params?: {
  project_id?: number;
  entry_types?: string[];
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}): Promise<ArchiveEntry[]> {
  const searchParams = new URLSearchParams();
  if (params?.project_id) searchParams.append('project_id', params.project_id.toString());
  if (params?.entry_types) params.entry_types.forEach((t: string) => searchParams.append('entry_types', t));
  if (params?.date_from) searchParams.append('date_from', params.date_from);
  if (params?.date_to) searchParams.append('date_to', params.date_to);
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  return request<ArchiveEntry[]>(`/archive/entries?${searchParams}`);
}

export async function getEntry(id: string): Promise<ArchiveEntry> {
  return request<ArchiveEntry>(`/archive/entries/${id}`);
}

export async function createEntry(data: Partial<ArchiveEntry>): Promise<ArchiveEntry> {
  return request<ArchiveEntry>('/archive/entries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEntry(id: string, data: Partial<ArchiveEntry>): Promise<ArchiveEntry> {
  return request<ArchiveEntry>(`/archive/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEntry(id: string): Promise<void> {
  await request<void>(`/archive/entries/${id}`, {
    method: 'DELETE',
  });
}

// ==================== Material Endpoints ====================

export async function getMaterials(params?: {
  project_id?: number;
  material_type?: string;
}): Promise<ArchiveMaterial[]> {
  const searchParams = new URLSearchParams();
  if (params?.project_id) searchParams.append('project_id', params.project_id.toString());
  if (params?.material_type) searchParams.append('material_type', params.material_type);

  return request<ArchiveMaterial[]>(`/archive/materials?${searchParams}`);
}

export async function getMaterial(id: string): Promise<ArchiveMaterial> {
  return request<ArchiveMaterial>(`/archive/materials/${id}`);
}

export async function createMaterial(data: Partial<ArchiveMaterial>): Promise<ArchiveMaterial> {
  return request<ArchiveMaterial>('/archive/materials', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==================== Construction Endpoints ====================

export async function getConstructions(params?: {
  project_id?: number;
  status?: string;
}): Promise<ArchiveConstruction[]> {
  const searchParams = new URLSearchParams();
  if (params?.project_id) searchParams.append('project_id', params.project_id.toString());
  if (params?.status) searchParams.append('status', params.status);

  return request<ArchiveConstruction[]>(`/archive/constructions?${searchParams}`);
}

export async function getConstruction(id: string): Promise<ArchiveConstruction> {
  return request<ArchiveConstruction>(`/archive/constructions/${id}`);
}

export async function createConstruction(data: Partial<ArchiveConstruction>): Promise<ArchiveConstruction> {
  return request<ArchiveConstruction>('/archive/constructions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==================== Search Endpoint ====================

export async function searchArchive(query: ArchiveSearchQuery): Promise<ArchiveSearchResult> {
  const searchParams = new URLSearchParams();
  searchParams.append('q', query.q);
  if (query.project_id) searchParams.append('project_id', query.project_id.toString());
  if (query.entry_types) query.entry_types.forEach(t => searchParams.append('entry_types', t));
  if (query.date_from) searchParams.append('date_from', query.date_from);
  if (query.date_to) searchParams.append('date_to', query.date_to);
  if (query.limit) searchParams.append('limit', query.limit.toString());

  return request<ArchiveSearchResult>(`/archive/search?${searchParams}`);
}

// ==================== Timeline Endpoint ====================

export async function getTimeline(params?: {
  project_id?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
}): Promise<TimelineEvent[]> {
  const searchParams = new URLSearchParams();
  if (params?.project_id) searchParams.append('project_id', params.project_id.toString());
  if (params?.date_from) searchParams.append('date_from', params.date_from);
  if (params?.date_to) searchParams.append('date_to', params.date_to);
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  const result = await request<{ events: TimelineEvent[]; total: number }>(`/archive/timeline?${searchParams}`);
  return result.events;
}

// ==================== Statistics Endpoint ====================

export async function getStatistics(projectId: number): Promise<ArchiveStatistics> {
  return request<ArchiveStatistics>(`/archive/statistics?project_id=${projectId}`);
}

// ==================== Export Endpoint ====================

export async function exportArchive(projectId: number, format: 'pdf' | 'excel' = 'excel'): Promise<Blob> {
  const response = await fetch(`${API_BASE}/archive/export?project_id=${projectId}&format=${format}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Export failed');
  }

  return response.blob();
}

// Export as named object for compatibility
export const archiveApi = {
  getEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  getMaterials,
  getMaterial,
  createMaterial,
  getConstructions,
  getConstruction,
  createConstruction,
  searchArchive,
  getTimeline,
  getStatistics,
  exportArchive,
};
