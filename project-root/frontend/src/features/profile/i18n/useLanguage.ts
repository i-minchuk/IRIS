import { useLanguageContext } from "./LanguageContext";
import type { Language } from "./translations";

export function useLanguage(): [Language, (lang: Language) => void] {
  const { lang, setLang } = useLanguageContext();
  return [lang, setLang];
}