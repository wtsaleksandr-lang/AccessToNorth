import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FieldLabelProps {
  /** `id` of the control this labels. Always pass it — the label is a real <label>. */
  htmlFor?: string;
  children: ReactNode;
  /**
   * Helper / qualifying text. Rendered top-left, between the label and the
   * control, so it is read before the field is filled rather than after.
   * A caveat that only appears under a field has already been ignored.
   */
  help?: ReactNode;
  /** Renders the help text in the warning palette (amber-900 on amber-50). */
  helpTone?: "muted" | "warning";
  required?: boolean;
  className?: string;
}

/**
 * Field label for tool forms.
 *
 * Label 14px / 600 in ink, help text directly beneath it at 13px. The pair is
 * a block so the control below can be any of the primitives in this folder.
 *
 * ```tsx
 * <FieldLabel htmlFor="country" help="Origin decides which tariff applies.">
 *   Country of Origin
 * </FieldLabel>
 * <Select id="country" … />
 * ```
 */
export function FieldLabel({
  htmlFor,
  children,
  help,
  helpTone = "muted",
  required,
  className,
}: FieldLabelProps) {
  return (
    <div className={cn("mb-2", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[14px] font-semibold leading-5 text-text-primary"
      >
        {children}
        {required && (
          <span className="ml-1 text-[#B42318]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {help && (
        <p
          className={cn(
            "mt-1 text-[13px] leading-[18px]",
            helpTone === "warning" ? "text-[#78350F]" : "text-text-muted",
          )}
        >
          {help}
        </p>
      )}
    </div>
  );
}
