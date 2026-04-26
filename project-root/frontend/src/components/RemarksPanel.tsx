import { useState, useEffect } from "react";
import { MessageSquare, CheckCircle, XCircle, RotateCcw, Send, FileText } from "lucide-react";

type RemarkStatus = "open" | "resolved" | "rejected" | "superseded";

interface RemarkResponse {
  id: number; author_name: string; text: string; created_at: string;
}
export interface Remark {
  id: number; source: string; text: string; status: RemarkStatus;
  author_name: string; assignee_name?: string;
  resolution_comment?: string; created_at: string;
  document_id?: number; responses: RemarkResponse[];
}

const STATUS_UI: Record<RemarkStatus, { label: string; cls: string }> = {
  open:       { label: "Открыто",           cls: "bg-red-100 text-red-700 border-red-200" },
  resolved:   { label: "✅ Решено",          cls: "bg-green-100 text-green-700 border-green-200" },
  rejected:   { label: "❌ Ошибочно",        cls: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
  superseded: { label: "🔄 Снято (изм. ТЗ)", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

const SOURCE_LABEL: Record<string, string> = {
  internal: "Внутреннее", customer: "Заказчик", reviewer: "Проверяющий",
};

interface RemarksPanelProps {
  projectId: number;
  documentId?: number; // Если передан — показываем замечания только по этому документу
}

export default function RemarksPanel({ projectId, documentId }: RemarksPanelProps) {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [filter, setFilter] = useState<RemarkStatus | "all">("all");
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRemarks = async () => {
    setLoading(true);
    try {
      // Используем documentId если передан, иначе project
      const endpoint = documentId 
        ? `/api/remarks/document/${documentId}${filter !== "all" ? `?status=${filter}` : ""}`
        : `/api/remarks/project/${projectId}${filter !== "all" ? `?status=${filter}` : ""}`;
      
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) setRemarks(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchRemarks();
  }, [projectId, documentId, filter]);

  const updateStatus = async (id: number, status: RemarkStatus, comment?: string) => {
    await fetch(`/api/remarks/${id}/resolve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json",
                 Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ status, comment }),
    });
    fetchRemarks();
  };

  const sendResponse = async (remarkId: number) => {
    const text = replyTexts[remarkId]?.trim();
    if (!text) return;
    await fetch(`/api/remarks/${remarkId}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json",
                 Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ text }),
    });
    setReplyTexts(prev => ({ ...prev, [remarkId]: "" }));
    fetchRemarks();
  };

  const addRemark = async () => {
    if (!newText.trim()) return;
    await fetch("/api/remarks/", {
      method: "POST",
      headers: { "Content-Type": "application/json",
                 Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ 
        project_id: projectId,
        document_id: documentId, // Привязываем к документу если передан
        text: newText 
      }),
    });
    setNewText("");
    fetchRemarks();
  };

  const filtered = filter === "all" ? remarks : remarks.filter(r => r.status === filter);
  const counts = remarks.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  return (
    <aside className="w-96 h-full flex flex-col border-l" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
      {/* Заголовок */}
      <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-2)' }}>
        <MessageSquare size={16} style={{ color: 'var(--accent-engineering)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {documentId ? 'Замечания по документу' : 'Замечания по проекту'}
        </span>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-red-500 text-white">
          {counts["open"] || 0} откр.
        </span>
      </div>

      {/* Фильтры */}
      <div className="flex gap-1.5 p-2 border-b flex-wrap" style={{ borderColor: 'var(--border-default)' }}>
        {(["all", "open", "resolved", "rejected", "superseded"] as const).map(s => (
          <button 
            key={s} 
            onClick={() => setFilter(s)}
            className="px-2 py-1 rounded-full text-xs font-medium border transition-all"
            style={{
              backgroundColor: filter === s ? 'var(--accent-engineering)' : 'var(--bg-surface)',
              color: filter === s ? 'var(--text-inverse)' : 'var(--text-secondary)',
              borderColor: filter === s ? 'var(--accent-engineering)' : 'var(--border-default)',
            }}
          >
            {s === "all" ? `Все (${remarks.length})` : `${STATUS_UI[s].label} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      {/* Список замечаний */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 border-2 border-t-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--accent-engineering)' }} />
          </div>
        )}
        
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <FileText size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
              {documentId ? 'Нет замечаний по документу' : 'Нет замечаний по проекту'}
            </p>
          </div>
        )}
        
        {filtered.map(remark => (
          <div key={remark.id}
            className="border rounded-lg p-2.5 transition-all"
            style={{
              borderColor: remark.status === "open" ? 'var(--error)' : 'var(--border-default)',
              backgroundColor: remark.status === "open" ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-surface)',
            }}>

            {/* Заголовок замечания */}
            <div className="flex justify-between items-start mb-1.5 gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>#{remark.id}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                  {SOURCE_LABEL[remark.source] || remark.source}
                </span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_UI[remark.status as RemarkStatus]?.cls}`}>
                {STATUS_UI[remark.status as RemarkStatus]?.label}
              </span>
            </div>

            <p className="text-xs mb-1.5 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{remark.text}</p>
            <p className="text-[10px] mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              {remark.author_name} · {new Date(remark.created_at).toLocaleDateString("ru-RU")}
              {remark.assignee_name && ` → ${remark.assignee_name}`}
            </p>

            {/* Наши ответы */}
            {remark.responses.map(resp => (
              <div key={resp.id}
                className="mt-1.5 pl-2 border-l-2 rounded-r py-1 pr-1.5"
                style={{ borderColor: 'var(--accent-engineering)', backgroundColor: 'rgba(124, 58, 237, 0.05)' }}>
                <p className="text-[10px] font-semibold" style={{ color: 'var(--accent-engineering)' }}>{resp.author_name}:</p>
                <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{resp.text}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(resp.created_at).toLocaleDateString("ru-RU")}
                </p>
              </div>
            ))}

            {/* Поле ответа */}
            {remark.status === "open" && (
              <div className="mt-1.5 flex gap-1.5">
                <input
                  type="text"
                  placeholder="Ответ..."
                  value={replyTexts[remark.id] || ""}
                  onChange={e => setReplyTexts(p => ({...p, [remark.id]: e.target.value}))}
                  onKeyDown={e => e.key === "Enter" && sendResponse(remark.id)}
                  className="flex-1 text-xs rounded border focus:outline-none focus:ring-1"
                  style={{
                    backgroundColor: 'var(--bg-surface-2)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button onClick={() => sendResponse(remark.id)}
                  className="p-1 rounded hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--accent-engineering)', color: 'var(--text-inverse)' }}>
                  <Send size={12} />
                </button>
              </div>
            )}

            {/* Кнопки смены статуса */}
            {remark.status === "open" && (
              <div className="mt-2 flex gap-1 flex-wrap">
                <button onClick={() => updateStatus(remark.id, "resolved", "Замечание устранено")}
                  className="flex items-center gap-0.5 text-[10px] font-medium px-2 py-1 rounded transition-colors"
                  style={{ backgroundColor: 'var(--success)', color: 'var(--text-inverse)' }}>
                  <CheckCircle size={10} /> Решено
                </button>
                <button onClick={() => updateStatus(remark.id, "rejected", "Ошибочно")}
                  className="flex items-center gap-0.5 text-[10px] font-medium px-2 py-1 rounded transition-colors"
                  style={{ backgroundColor: 'var(--text-tertiary)', color: 'var(--text-inverse)' }}>
                  <XCircle size={10} /> Ошибочно
                </button>
                <button onClick={() => updateStatus(remark.id, "superseded", "Изм. ТЗ")}
                  className="flex items-center gap-0.5 text-[10px] font-medium px-2 py-1 rounded transition-colors"
                  style={{ backgroundColor: 'var(--warning)', color: 'var(--text-inverse)' }}>
                  <RotateCcw size={10} /> Изм. ТЗ
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Поле нового замечания */}
      <div className="p-2 border-t" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-2)' }}>
        <div className="flex gap-1.5">
          <input 
            type="text" 
            placeholder="Новое замечание..."
            value={newText} 
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addRemark()}
            className="flex-1 text-xs rounded border focus:outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }} 
          />
          <button onClick={addRemark}
            className="px-2 py-1 text-xs font-medium rounded transition-colors"
            style={{ backgroundColor: 'var(--accent-engineering)', color: 'var(--text-inverse)' }}>
            +
          </button>
        </div>
      </div>
    </aside>
  );
}