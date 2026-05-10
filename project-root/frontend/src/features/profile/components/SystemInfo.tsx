import { Info, GitCommit, Calendar } from "lucide-react"; // ← Github заменён на Calendar
import { useAppVersion } from "../hooks/useAppVersion";
import type { Language } from "../i18n/translations";

interface Props {
  lang: Language;
}

export function SystemInfo({ lang }: Props) {
  const { version, buildDate } = useAppVersion();

  const labels = {
    ru: {
      title: "О системе",
      version: "Версия",
      buildDate: "Дата сборки",
      update: "Проверить обновления",
    },
    en: {
      title: "About",
      version: "Version",
      buildDate: "Build date",
      update: "Check for updates",
    },
  };

  const t = labels[lang];

  return (
    <div className="glass-card neon-border-purple p-5 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <Info className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-[var(--text-main)]">{t.title}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--card-bg)]/50 border border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-[var(--text-muted)]">{t.version}</span>
          </div>
          <span className="text-sm font-mono font-bold text-purple-400">v{version}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--card-bg)]/50 border border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--text-muted)]" /> {/* ← Calendar вместо Github */}
            <span className="text-sm text-[var(--text-muted)]">{t.buildDate}</span>
          </div>
          <span className="text-sm text-[var(--text-main)]">{buildDate}</span>
        </div>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm transition-colors border border-purple-500/30"
      >
        {t.update}
      </button>
    </div>
  );
}