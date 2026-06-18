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

export interface SemanticSearchRequest {
  query: string;
  top_k?: number;
  document_id?: string;
}

export interface SemanticSearchResult {
  chunk_id: string;
  score: number;
  text: string;
  section?: string;
  heading?: string;
  page?: number;
  document_id: string;
  file_name: string;
}

export interface SemanticSearchResponse {
  results: SemanticSearchResult[];
  total: number;
  query: string;
}

export interface DocumentAnalysisResponse {
  document_id: string;
  overall_score: number;
  findings: Array<{
    severity: 'critical' | 'warning' | 'info';
    category: string;
    description: string;
    suggestion: string;
    location?: string;
    rule?: string;
  }>;
  critical_count: number;
  warning_count: number;
  info_count: number;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  document_id?: string;
  project_id?: string;
  stream?: boolean;
}

export interface ChatResponse {
  response_id: string;
  content: string;
  confidence: number;
  sources: Array<{
    document_id: string;
    file_name: string;
    section?: string;
    page?: number;
    relevance_score: number;
  }>;
  requires_human_review: boolean;
}

export interface ExtractRequirementsResponse {
  document_id: string;
  requirements: Array<{
    type: string;
    value: string;
    description?: string;
    section?: string;
  }>;
  extracted_at: string;
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

/**
 * Семантический поиск по документам (Qdrant + embeddings)
 */
export const semanticSearch = async (
  request: SemanticSearchRequest
): Promise<SemanticSearchResponse> => {
  const { data } = await client.post('/api/v1/ai/search', request);
  return data;
};

/**
 * AI-анализ документа на ошибки, структуру, ГОСТ
 */
export const analyzeDocument = async (
  documentId: string
): Promise<DocumentAnalysisResponse> => {
  const { data } = await client.post(`/api/v1/ai/analyze/${documentId}`);
  return data;
};

/**
 * RAG-чат с AI — ответы на основе документов
 */
export const chatWithAI = async (
  request: ChatRequest
): Promise<ChatResponse> => {
  const { data } = await client.post('/api/v1/ai/chat', request);
  return data;
};

/**
 * Извлечь технические требования из документа
 */
export const extractRequirements = async (
  documentId: string
): Promise<ExtractRequirementsResponse> => {
  const { data } = await client.post(`/api/v1/ai/extract-requirements/${documentId}`);
  return data;
};
