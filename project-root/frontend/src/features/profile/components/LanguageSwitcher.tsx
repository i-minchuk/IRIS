import { Globe } from "lucide-react";
import { useLanguageContext } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguageContext();

  return (
    <div className="glass-card neon-border-purple p-5 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <Globe className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-[var(--text-main)]">{t("language", lang)}</h3>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setLang("ru")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            lang === "ru"
              ? "bg-purple-500 text-white border-purple-500"
              : "bg-transparent text-[var(--text-muted)] border-[var(--border-color)] hover:border-purple-500/50"
          }`}
        >
          Русский
        </button>
        <button
          onClick={() => setLang("en")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            lang === "en"
              ? "bg-purple-500 text-white border-purple-500"
              : "bg-transparent text-[var(--text-muted)] border-[var(--border-color)] hover:border-purple-500/50"
          }`}
        >
          English
        </button>
      </div>
    </div>
  );
}