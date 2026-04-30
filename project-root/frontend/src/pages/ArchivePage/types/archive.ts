// src/pages/ArchivePage/types/archive.ts
/**
 * Типы для страницы Архив
 */

export type ArchiveEntryType =
  | 'document'
  | 'revision'
  | 'remark'
  | 'workflow'
  | 'comment'
  | 'file_upload'
  | 'project_event'
  | 'external_communication'
  | 'meeting'
  | 'decision'
  | 'material'
  | 'construction'
  | 'photo'
  | 'calculation'
  | 'certificate'
  | 'handover';

export type ArchiveMaterialType =
  | 'steel'
  | 'concrete'
  | 'reinforcement'
  | 'insulation'
  | 'finishing'
  | 'equipment'
  | 'pipe'
  | 'cable'
  | 'other';

export type ArchiveConstructionType =
  | 'foundation'
  | 'column'
  | 'beam'
  | 'slab'
  | 'wall'
  | 'roof'
  | 'frame'
  | 'pipeline'
  | 'electrical'
  | 'other';

export type ArchiveConstructionStatus =
  | 'planned'
  | 'in_production'
  | 'installed'
  | 'tested'
  | 'accepted'
  | 'rejected';

export interface Attachment {
  filename: string;
  url: string;
  type: string;
  size: number;
}

export interface Certificate {
  number: string;
  issued_at: string;
  valid_until: string;
  url: string;
}

export interface ArchiveEntry {
  id: string;
  project_id: string;
  entry_type: ArchiveEntryType;
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
  material_type: ArchiveMaterialType;
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
  construction_type: ArchiveConstructionType;
  designation: string | null;
  location: string | null;
  materials_used: string[];
  documents_related: string[];
  status: ArchiveConstructionStatus;
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
  entry_types: ArchiveEntryType[];
  authors: string[];
  has_attachments: boolean;
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
