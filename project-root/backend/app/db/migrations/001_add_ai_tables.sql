-- Документы, загруженные в AI
CREATE TABLE ai_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL, -- pdf, docx
    content TEXT, -- Полный текст
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending', -- pending, indexed, error
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Чанки для векторного поиска
CREATE TABLE ai_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES ai_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- section, page, heading
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, chunk_index)
);

-- История диалогов с AI
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    document_id UUID REFERENCES ai_documents(id),
    task_type VARCHAR(50) NOT NULL, -- chat, analyze
    query_text TEXT NOT NULL,
    response_text TEXT,
    context_chunks JSONB DEFAULT '[]', -- [{chunk_id, text, score}]
    confidence FLOAT,
    model_version VARCHAR(50),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Результаты анализа документов
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES ai_documents(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL, -- structure, compliance, full
    overall_score FLOAT,
    findings JSONB DEFAULT '[]',
    raw_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_docs_status ON ai_documents(status);
CREATE INDEX idx_ai_docs_project ON ai_documents(original_document_id);
CREATE INDEX idx_ai_interactions_session ON ai_interactions(session_id);