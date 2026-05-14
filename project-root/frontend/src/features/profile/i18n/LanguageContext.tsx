import React, { createContext, useContext, useState, useEffect } from "react";
import type { Language } from "./translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ru",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("ru");

  useEffect(() => {
    const saved = localStorage.getItem("iris-language") as Language | null;
    if (saved && (saved === "ru" || saved === "en")) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("iris-language", newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext(): LanguageContextType {
  return useContext(LanguageContext);
}