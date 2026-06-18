// Types
export type {
  InlineSuggestionItem,
  InlineSuggestionsMessage,
  TextChangeMessage,
  AcceptSuggestionMessage,
  RejectSuggestionMessage,
  AIWSMessage,
} from './types';

// API
export {
  getInlineSuggestions,
  semanticSearch,
  analyzeDocument,
  chatWithAI,
  extractRequirements,
} from './api/aiApi';
export type {
  InlineSuggestionPayload,
  InlineSuggestionRESTResponse,
  SemanticSearchRequest,
  SemanticSearchResult,
  SemanticSearchResponse,
  DocumentAnalysisResponse,
  ChatRequest,
  ChatResponse,
  ExtractRequirementsResponse,
} from './api/aiApi';

// Hooks
export { useInlineAI } from './hooks/useInlineAI';
export { useSemanticSearch } from './hooks/useSemanticSearch';
export { useDocumentAnalysis } from './hooks/useDocumentAnalysis';
export { useAIChat } from './hooks/useAIChat';
export { useExtractRequirements } from './hooks/useExtractRequirements';

// Components
export { InlineSuggestionWidget } from './components/InlineSuggestionWidget';
export { AIGhostText } from './components/AIGhostText';
export { SemanticSearchPanel } from './components/SemanticSearchPanel';
export { DocumentAnalysisPanel } from './components/DocumentAnalysisPanel';
export { AIChatPanel } from './components/AIChatPanel';
export { RequirementsPanel } from './components/RequirementsPanel';
