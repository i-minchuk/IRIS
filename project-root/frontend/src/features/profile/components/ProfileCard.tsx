import { User, Mail, Shield } from "lucide-react";
import { t } from "../i18n/translations";
import type { Language } from "../i18n/translations";

interface Props {
  name: string;
  role: string;
  department: string;
  email: string;
  lang: Language;
}

export function ProfileCard({ name, role, department, email, lang }: Props) {
  return (
    <div className="glass-card neon-border-purple p-6 rounded-xl">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-purple-500/20 border-2 border-purple-500/40 flex items-center justify-center">
          <User className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)]">{name}</h2>
          <p className="text-sm text-purple-400 font-medium">{role}</p>
          <p className="text-xs text-[var(--text-muted)]">{department}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Mail className="w-4 h-4" />
        {email}
        <Shield className="w-4 h-4 ml-4 text-green-400" />
        <span className="text-green-400 text-xs">{t("admin", lang)}</span>
      </div>
    </div>
  );
}