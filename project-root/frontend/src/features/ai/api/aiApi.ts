import client from '@/shared/api/client';
import type { InlineSuggestionItem } from '../types';

export interface InlineSuggestionPayload {
  document_id?: string;
  document_type?: string;
  current_section?: string;
  preceding_text: string;
  current_line: string;
  cursor_position: number;
}

export interface InlineSuggestionRESTResponse {
  suggestions: InlineSuggestionItem[];
  request_id: string;
  model?: string;
}

/**
 * REST fallback для inline-подсказок (если WebSocket недоступен)
 */
export const getInlineSuggestions = async (
  payload: InlineSuggestionPayload
): Promise<InlineSuggestionRESTResponse> => {
  const { data } = await client.post('/api/v1/ai/inline-suggest', payload);
  return data;
};
