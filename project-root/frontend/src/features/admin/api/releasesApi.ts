import apiClient from '@/shared/api/client';
import type { Release } from '@/types/release';

/** Ответ backend /releases (ReleaseResponse). Поля совпадают с Release,
 * но description/planned_date могут прийти null — нормализуем. */
interface ReleaseApiItem extends Omit<Release, 'description' | 'planned_date'> {
  description: string | null;
  planned_date: string | null;
}

export type ReleaseCreatePayload = Omit<Release, 'id' | 'created_at' | 'checklist_progress'>;
export type ReleaseUpdatePayload = Partial<ReleaseCreatePayload>;

function mapToRelease(item: ReleaseApiItem): Release {
  return {
    ...item,
    description: item.description ?? '',
    planned_date: item.planned_date ?? '',
  };
}

export async function getReleases(): Promise<Release[]> {
  const { data } = await apiClient.get<ReleaseApiItem[]>('/releases');
  return data.map(mapToRelease);
}

export async function getRelease(id: number): Promise<Release> {
  const { data } = await apiClient.get<ReleaseApiItem>(`/releases/${id}`);
  return mapToRelease(data);
}

export async function createRelease(payload: ReleaseCreatePayload): Promise<Release> {
  const { data } = await apiClient.post<ReleaseApiItem>('/releases', payload);
  return mapToRelease(data);
}

export async function updateRelease(id: number, payload: ReleaseUpdatePayload): Promise<Release> {
  const { data } = await apiClient.patch<ReleaseApiItem>(`/releases/${id}`, payload);
  return mapToRelease(data);
}

export async function deleteRelease(id: number): Promise<void> {
  await apiClient.delete(`/releases/${id}`);
}
