import type { ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalloutTone = "warning" | "error" | "info";

export interface CalloutProps {
  tone?: CalloutTone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  role?: "alert" | "status";
  "data-testid"?: string;
}

/**
 * Qualifying notice attached to a figure — a tariff caveat, a "consult a
 * broker" flag, a disclaimer.
 *
 * Seventh primitive, beyond the six named in the brief, because these tools are
 * compliance surfaces: a warning that an importer acts on must not be styled
 * ad-hoc per page. The rules this bakes in, and which no caller should undo:
 *
 *   - body text is 14px — the same size as the figures it qualifies, never
 *     smaller, and never `text-xs`;
 *   - ink is #78350F on #FFFBEB (11.5:1) for warnings and #7A271A on #FEF3F2
 *     (11.2:1) for errors — far past AA, because these are the strings that
 *     carry legal weight;
 *   - it is always expanded. There is no collapsed variant, no tooltip
 *     variant, and no muted variant. Hiding a caveat behind a disclosure is a
 *     misrepresentation, not a layout choice;
 *   - it renders ABOVE the figure it qualifies, which is the caller's job.
 *
 * The system has no warning token (the one accent is reserved for
 * selection/focus), so the palette is stated here once and reused.
 */
export function Callout({
  tone = "warning",
  title,
  children,
  className,
  role,
  ...rest
}: CalloutProps) {
  const palette =
    tone === "error"
      ? { bg: "bg-[#FEF3F2]", border: "border-[#FECDCA]", text: "text-[#7A271A]", icon: "text-[#B42318]" }
      : tone === "info"
        ? { bg: "bg-surface-recessed", border: "border-border-hairline", text: "text-text-secondary", icon: "text-text-muted" }
        : { bg: "bg-[#FFFBEB]", border: "border-[#FDE68A]", text: "text-[#78350F]", icon: "text-[#B45309]" };

  const Icon = tone === "info" ? Info : AlertTriangle;

  return (
    <div
      role={role}
      className={cn("flex items-start gap-3 rounded-lg border p-4", palette.bg, palette.border, className)}
      data-testid={rest["data-testid"]}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", palette.icon)} aria-hidden="true" />
      <div className={cn("min-w-0 space-y-1.5 text-[14px] leading-[20px]", palette.text)}>
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
