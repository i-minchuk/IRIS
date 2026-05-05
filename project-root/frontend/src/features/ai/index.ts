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
export { getInlineSuggestions } from './api/aiApi';
export type { InlineSuggestionPayload, InlineSuggestionRESTResponse } from './api/aiApi';

// Hooks
export { useInlineAI } from './hooks/useInlineAI';

// Components
export { InlineSuggestionWidget } from './components/InlineSuggestionWidget';
export { AIGhostText } from './components/AIGhostText';
