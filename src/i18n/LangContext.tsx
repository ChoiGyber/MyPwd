import { createContext, useContext, useState, ReactNode } from "react";
import type { Lang, Translations } from "./index";
import { getTranslations } from "./index";

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LangContext = createContext<LangContextType>({
  lang: "ko",
  setLang: () => {},
  t: getTranslations("ko"),
});

export function useLang() {
  return useContext(LangContext);
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("mypwd-lang");
    return (saved === "en" || saved === "ko") ? saved : "ko";
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("mypwd-lang", newLang);
  };

  const t = getTranslations(lang);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}
