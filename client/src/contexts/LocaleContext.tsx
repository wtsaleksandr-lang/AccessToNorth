import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en } from "@/locales/en";
import { fr } from "@/locales/fr";

export type Locale = "en" | "fr";

export type TranslationKey = keyof typeof en;

const catalogues: Record<Locale, Record<TranslationKey, string>> = {
  en,
  fr,
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const STORAGE_KEY = "atn_locale";
const SUPPORTED: Locale[] = ["en", "fr"];

function pickInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage?.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "fr") return stored;
  const navLang = window.navigator?.language?.slice(0, 2).toLowerCase();
  if (navLang === "fr") return "fr";
  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Hydrate once on mount so SSR/prerendered shells are stable.
  useEffect(() => {
    setLocaleState(pickInitialLocale());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.lang = locale === "fr" ? "fr-CA" : "en-CA";
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Ignore storage errors (private mode, quota, etc.)
    }
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => {
    const cat = catalogues[locale];
    return {
      locale,
      setLocale: (l) => {
        if (SUPPORTED.includes(l)) setLocaleState(l);
      },
      t: (key) => cat[key] ?? en[key] ?? String(key),
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}

export const SUPPORTED_LOCALES = SUPPORTED;
