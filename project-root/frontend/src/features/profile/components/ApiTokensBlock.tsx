import { Key, Plus, Trash2, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { t } from "../i18n/translations";
import type { Language } from "../i18n/translations";
import { tokensApi } from "../api/tokens";

export interface ApiToken {
  id: string;
  name: string;
  createdAt: string;
  last4: string;
}

interface Props {
  tokens: ApiToken[];
  lang: Language;
}

export function ApiTokensBlock({ tokens: initialTokens, lang }: Props) {
  const [tokens, setTokens] = useState(initialTokens);
  const [showNewToken, setShowNewToken] = useState(false);
  const [newTokenValue, setNewTokenValue] = useState("");
  const [showTokenId, setShowTokenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await tokensApi.create(`Token ${tokens.length + 1}`);
      setNewTokenValue(data.token);
      setShowNewToken(true);

      const newToken: ApiToken = {
        id: data.id,
        name: data.name,
        createdAt: data.created_at,
        last4: data.token.slice(-4),
      };
      setTokens((prev) => [...prev, newToken]);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Не удалось создать токен");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm(t("revoke", lang) + "?")) return;
    try {
      await tokensApi.revoke(id);
      setTokens((prev) => prev.filter((tok) => tok.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Не удалось отозвать токен");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="glass-card neon-border-purple p-5 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Key className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-[var(--text-main)]">{t("apiTokens", lang)}</h3>
        </div>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs transition-colors border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {t("create", lang)}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {showNewToken && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-xs text-amber-400 mb-2 font-medium">{t("copyToken", lang)}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-black/30 px-2 py-1.5 rounded text-green-400 font-mono break-all">
              {newTokenValue}
            </code>
            <button
              onClick={() => copyToClipboard(newTokenValue)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Copy"
            >
              <Copy className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>
          <button
            onClick={() => setShowNewToken(false)}
            className="mt-2 text-xs text-amber-400 hover:text-amber-300"
          >
            {t("savedToken", lang)}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {tokens.map((token) => (
          <div
            key={token.id}
            className="flex items-center justify-between p-3 rounded-lg bg-[var(--card-bg)]/50 border border-[var(--border-color)]"
          >
            <div>
              <p className="text-sm text-[var(--text-main)] font-medium">{token.name}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {t("created", lang)}: {token.createdAt} • 
                <span className="font-mono ml-1">
                  {showTokenId === token.id ? `iris_••••${token.last4}` : `••••${token.last4}`}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowTokenId(showTokenId === token.id ? null : token.id)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
              >
                {showTokenId === token.id ? (
                  <EyeOff className="w-4 h-4 text-[var(--text-muted)]" />
                ) : (
                  <Eye className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </button>
              <button
                onClick={() => handleRevoke(token.id)}
                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {tokens.length === 0 && (
        <p className="text-center text-sm text-[var(--text-muted)] py-4">
          {t("noTokens", lang)}
        </p>
      )}
    </div>
  );
}