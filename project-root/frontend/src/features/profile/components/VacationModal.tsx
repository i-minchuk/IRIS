import { X, Plane, BriefcaseMedical } from "lucide-react";
import { useState } from "react";
import { t } from "../i18n/translations";
import type { Language } from "../i18n/translations";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { type: "vacation" | "sick"; startDate: string; endDate: string; reason?: string }) => void;
  lang: Language;
}

export function VacationModal({ isOpen, onClose, onSubmit, lang }: Props) {
  const [type, setType] = useState<"vacation" | "sick">("vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ type, startDate, endDate, reason });
    onClose();
  };

  const types = [
    { id: "vacation" as const, label: t("vacation", lang), icon: Plane, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
    { id: "sick" as const, label: t("sickLeave", lang), icon: BriefcaseMedical, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-card neon-border-purple p-6 rounded-xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded transition-colors">
          <X className="w-5 h-5 text-[var(--text-muted)]" />
        </button>

        <h2 className="text-xl font-bold text-[var(--text-main)] mb-6">{t("apply", lang)}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-[var(--text-muted)] mb-2 block">{t("availability", lang)}</label>
            <div className="grid grid-cols-2 gap-2">
              {types.map((tItem) => {
                const Icon = tItem.icon;
                return (
                  <button
                    key={tItem.id}
                    type="button"
                    onClick={() => setType(tItem.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                      type === tItem.id
                        ? `${tItem.bg} ${tItem.border} ${tItem.color}`
                        : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-purple-500/30"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tItem.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[var(--text-muted)] mb-1 block">{t("from", lang)}</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--text-muted)] mb-1 block">{t("to", lang)}</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-[var(--text-muted)] mb-1 block">{t("comment", lang)}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reason", lang)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:outline-none focus:border-purple-500 resize-none placeholder:text-[var(--text-muted)]/50"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] text-sm hover:bg-[var(--card-bg)] transition-colors"
            >
              {t("cancel", lang)}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
            >
              {t("submit", lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}