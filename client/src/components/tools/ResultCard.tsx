import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ResultRow {
  label: ReactNode;
  /** Right-hand figure. Rendered tabular-nums so columns of digits align. */
  value: ReactNode;
  /** Middle column — a rate, a unit, a treatment code. Also tabular-nums. */
  meta?: ReactNode;
  /** Renders the row in ink/semibold — use for a subtotal, not for every row. */
  emphasis?: boolean;
  testId?: string;
  valueTestId?: string;
}

export interface ResultCardProps {
  title?: ReactNode;
  /** Right-hand slot in the header — an export button, a badge. */
  action?: ReactNode;
  /** The one number the reader came for. */
  figure?: ReactNode;
  figureLabel?: ReactNode;
  /** Qualifying line under the figure. Never put a warning here — warnings go above the card. */
  figureNote?: ReactNode;
  figureTestId?: string;
  rows?: ResultRow[];
  children?: ReactNode;
  className?: string;
  "data-testid"?: string;
}

/**
 * Result surface for tool output.
 *
 *   white · 1px #E2E8F0 · 12px radius · one hairline between rows
 *
 * Hierarchy is: headline figure (32px, ink, bold, tabular-nums) first, then the
 * rows that build up to it, values right-aligned. Nothing is collapsed and no
 * row is greyed out — a figure a user acts on is never the quiet element.
 *
 * ```tsx
 * <ResultCard
 *   title="Duty & tax breakdown"
 *   figureLabel="Goods + border charges"
 *   figure={formatCurrency(total)}
 *   rows={[{ label: "Customs duty", meta: "6.5%", value: formatCurrency(duty) }]}
 * />
 * ```
 */
export function ResultCard({
  title,
  action,
  figure,
  figureLabel,
  figureNote,
  figureTestId,
  rows,
  children,
  className,
  ...rest
}: ResultCardProps) {
  return (
    <section
      className={cn("rounded-lg border border-border-hairline bg-white", className)}
      data-testid={rest["data-testid"]}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          {title && <h3 className="text-h3 text-text-primary">{title}</h3>}
          {action}
        </header>
      )}

      {figure !== undefined && (
        <div className={cn("px-5", title || action ? "pt-4" : "pt-5")}>
          {figureLabel && (
            <p className="text-[13px] font-medium leading-[18px] text-text-muted">{figureLabel}</p>
          )}
          <p
            className="mt-1 text-[32px] font-bold leading-[38px] tracking-[-0.02em] text-text-primary tabular-nums"
            data-testid={figureTestId}
          >
            {figure}
          </p>
          {figureNote && (
            <p className="mt-1.5 text-[13px] leading-[18px] text-text-muted">{figureNote}</p>
          )}
        </div>
      )}

      {rows && rows.length > 0 && (
        <dl className="mt-5 border-t border-border-hairline">
          {rows.map((row, index) => (
            <div
              key={index}
              className={cn(
                "flex items-baseline justify-between gap-4 px-5 py-3",
                index < rows.length - 1 && "border-b border-border-hairline",
              )}
              data-testid={row.testId}
            >
              <dt
                className={cn(
                  "min-w-0 text-[14px] leading-5",
                  row.emphasis ? "font-semibold text-text-primary" : "text-text-secondary",
                )}
              >
                {row.label}
              </dt>
              <div className="flex shrink-0 items-baseline gap-4">
                {row.meta !== undefined && row.meta !== null && (
                  <span className="text-[13px] leading-5 text-text-muted tabular-nums">
                    {row.meta}
                  </span>
                )}
                <dd
                  className={cn(
                    "min-w-[92px] text-right text-[14px] leading-5 tabular-nums",
                    row.emphasis
                      ? "font-bold text-text-primary"
                      : "font-semibold text-text-primary",
                  )}
                  data-testid={row.valueTestId}
                >
                  {row.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      )}

      {children && (
        <div className={cn(rows && rows.length > 0 ? "" : "mt-5 border-t border-border-hairline")}>
          {children}
        </div>
      )}

      {!children && (!rows || rows.length === 0) && <div className="pb-5" />}
    </section>
  );
}
