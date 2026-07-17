import { createContext, useContext, useCallback, type ReactNode } from "react";
import { translations, type Language } from "./translations";

interface I18nContextValue {
  language: Language;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  language,
  setLanguage,
  children,
}: {
  language: Language;
  setLanguage: (lang: Language) => void;
  children: ReactNode;
}) {
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[language] ?? translations.en;
      let value = dict[key as keyof typeof dict] ?? translations.en[key as keyof typeof translations.en] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return value;
    },
    [language],
  );

  return (
    <I18nContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx.t;
}

export function useLanguage() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLanguage must be used within I18nProvider");
  return { language: ctx.language, setLanguage: ctx.setLanguage };
}
