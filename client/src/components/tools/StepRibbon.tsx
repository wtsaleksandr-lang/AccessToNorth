import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Success ink. The design system has no success token (the accent is reserved
 * for selection/focus), so a "done" step needs one colour defined here.
 * #15803D on white measures 4.98:1 — AA for the 12px text it carries.
 */
export const TOOL_SUCCESS = "#15803D";

export interface Step {
  label: string;
  testId?: string;
}

export interface StepRibbonProps {
  steps: Step[];
  /** Index of the step in progress. Everything before it renders as done. */
  current: number;
  /**
   * Steps to force into the "done" state regardless of `current` — for flows
   * where a later step can be satisfied before an earlier one.
   */
  completed?: number[];
  className?: string;
  "data-testid"?: string;
}

/**
 * `01 Label → 02 Label → 03 Label` progress ribbon.
 *
 *   active     #3356EE (the one accent)
 *   completed  TOOL_SUCCESS with a check
 *   upcoming   #90A1B9
 *
 * Purely a read-out of state the flow already holds — it renders no controls,
 * so it can never gate a field or change what a form submits. Colour changes
 * are `.2s ease`; there are no keyframes.
 */
export function StepRibbon({
  steps,
  current,
  completed = [],
  className,
  ...rest
}: StepRibbonProps) {
  return (
    <ol
      className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}
      data-testid={rest["data-testid"]}
    >
      {steps.map((step, index) => {
        const isDone = completed.includes(index) || index < current;
        const isActive = index === current && !isDone;
        const tone = isDone
          ? "text-[#15803D]"
          : isActive
            ? "text-brand"
            : "text-text-deemphasis";

        return (
          <li key={step.label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.08em]",
                "transition-colors duration-state",
                tone,
              )}
              data-testid={step.testId}
              aria-current={isActive ? "step" : undefined}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              )}
              {step.label}
              {isDone && <span className="sr-only">(completed)</span>}
            </span>
            {index < steps.length - 1 && (
              <span className="text-text-deemphasis" aria-hidden="true">
                &rarr;
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
