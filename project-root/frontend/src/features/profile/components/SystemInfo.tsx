import { Info, GitCommit, Calendar, Monitor, Users } from "lucide-react";
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
      users: "Активных пользователей",
      screens: "Поддерживаемые экраны",
    },
    en: {
      title: "About",
      version: "Version",
      buildDate: "Build date",
      update: "Check for updates",
      users: "Active users",
      screens: "Supported displays",
    },
  };

  const t = labels[lang];

  return (
    <div className="glass-card neon-border-purple p-5 md:p-6 lg:p-8 rounded-xl">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <Info className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
        <h3 className="text-lg md:text-xl font-semibold text-[var(--text-main)]">{t.title}</h3>
      </div>

      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-[var(--card-bg)]/50 border border-[var(--border-color)]">
          <div className="flex items-center gap-2 md:gap-3">
            <GitCommit className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            <span className="text-sm md:text-base text-[var(--text-muted)]">{t.version}</span>
          </div>
          <span className="text-sm md:text-base font-mono font-bold text-purple-400">v{version}</span>
        </div>

        <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-[var(--card-bg)]/50 border border-[var(--border-color)]">
          <div className="flex items-center gap-2 md:gap-3">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[var(--text-muted)]" />
            <span className="text-sm md:text-base text-[var(--text-muted)]">{t.buildDate}</span>
          </div>
          <span className="text-sm md:text-base text-[var(--text-main)]">{buildDate}</span>
        </div>

        <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-[var(--card-bg)]/50 border border-[var(--border-color)]">
          <div className="flex items-center gap-2 md:gap-3">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
            <span className="text-sm md:text-base text-[var(--text-muted)]">{t.users}</span>
          </div>
          <span className="text-sm md:text-base font-bold text-emerald-400">47</span>
        </div>

        <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-[var(--card-bg)]/50 border border-[var(--border-color)]">
          <div className="flex items-center gap-2 md:gap-3">
            <Monitor className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
            <span className="text-sm md:text-base text-[var(--text-muted)]">{t.screens}</span>
          </div>
          <span className="text-sm md:text-base text-blue-400">Full HD — 4K</span>
        </div>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="mt-4 md:mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 md:py-4 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm md:text-base transition-colors border border-purple-500/30"
      >
        {t.update}
      </button>
    </div>
  );
}