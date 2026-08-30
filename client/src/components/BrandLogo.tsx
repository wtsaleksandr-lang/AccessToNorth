import { ShieldCheck } from "lucide-react";

interface BrandLogoProps {
  light?: boolean;
  className?: string;
  accentClassName?: string;
}

/** Shared brand lockup so the header and footer stay visually identical. */
export function BrandLogo({ light = false, className = "", accentClassName }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="rounded-lg bg-primary p-1.5 transition-transform group-hover:scale-105">
        <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
      </span>
      <span
        className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-slate-900"}`}
        style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.03em" }}
      >
        AccessToNorth
        <span className={accentClassName ?? (light ? "text-white/80" : "text-primary")}>.com</span>
      </span>
    </span>
  );
}
