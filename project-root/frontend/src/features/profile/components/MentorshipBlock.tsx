import { Users, GraduationCap, UserCheck } from "lucide-react";
import { t } from "../i18n/translations";
import type { Language } from "../i18n/translations";

interface Props {
  mentor?: string;
  mentees?: string[];
  lang: Language;
}

export function MentorshipBlock({ mentor, mentees, lang }: Props) {
  return (
    <div className="glass-card neon-border-purple p-5 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-[var(--text-main)]">{t("mentorship", lang)}</h3>
      </div>

      {mentor && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--card-bg)]/50 border border-[var(--border-color)]">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t("mentor", lang)}</span>
          </div>
          <p className="text-sm text-[var(--text-main)] font-medium">{mentor}</p>
        </div>
      )}

      {mentees && mentees.length > 0 && (
        <div className="p-3 rounded-lg bg-[var(--card-bg)]/50 border border-[var(--border-color)]">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t("mentees", lang)}</span>
          </div>
          <div className="space-y-1">
            {mentees.map((name, i) => (
              <p key={i} className="text-sm text-[var(--text-main)]">{name}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}