import { Globe } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

interface LocaleToggleProps {
  light?: boolean;
}

export function LocaleToggle({ light }: LocaleToggleProps) {
  const { locale, setLocale } = useLocale();
  const base = "text-xs font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer";
  const activeClass = light ? "bg-white/20 text-white" : "bg-primary/10 text-primary";
  const inactiveClass = light ? "text-white/50 hover:text-white/80" : "text-slate-400 hover:text-slate-600";

  return (
    <div
      className={`flex items-center rounded-lg p-0.5 ${light ? "bg-white/10" : "bg-slate-100"}`}
      role="group"
      aria-label="Language"
      data-testid="locale-toggle"
    >
      <Globe
        className={`w-3.5 h-3.5 mx-1 ${light ? "text-white/60" : "text-slate-400"}`}
        aria-hidden="true"
      />
      <button
        onClick={() => setLocale("en")}
        className={`${base} ${locale === "en" ? activeClass : inactiveClass}`}
        aria-pressed={locale === "en"}
        data-testid="locale-en"
      >
        EN
      </button>
      <button
        onClick={() => setLocale("fr")}
        className={`${base} ${locale === "fr" ? activeClass : inactiveClass}`}
        aria-pressed={locale === "fr"}
        data-testid="locale-fr"
      >
        FR
      </button>
    </div>
  );
}
