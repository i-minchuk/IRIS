export interface InlineSuggestionItem {
  type: 'completion' | 'correction' | 'reference';
  text: string;
  display: string;
  confidence: number;
  description?: string;
}

export interface InlineSuggestionsMessage {
  type: 'suggestions';
  items: InlineSuggestionItem[];
  request_id: string;
}

export interface TextChangeMessage {
  type: 'text_change';
  context: {
    document_id?: string;
    document_type?: string;
    current_section?: string;
    preceding_text: string;
    current_line: string;
    cursor_position: number;
  };
}

export interface AcceptSuggestionMessage {
  type: 'accept_suggestion';
  suggestion_id: string;
  request_id: string;
}

export interface RejectSuggestionMessage {
  type: 'reject_suggestion';
  suggestion_id: string;
  request_id: string;
}

export type AIWSMessage =
  | InlineSuggestionsMessage
  | TextChangeMessage
  | AcceptSuggestionMessage
  | RejectSuggestionMessage;
