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
  /**
   * OPTIONAL back-navigation. When supplied, steps already in the "done" state
   * render as real buttons that call this with their index, so a reader can
   * jump straight back to an earlier step instead of walking back one at a
   * time. Omit it and the ribbon renders exactly as it always has — every
   * existing call site is unaffected.
   *
   * Only COMPLETED steps become controls. The current step is not a control
   * (there is nowhere to go), and upcoming steps are plain text, so this can
   * never be used to skip forward past a validation guard: which transitions
   * are legal stays entirely the caller's business.
   */
  onStepSelect?: (index: number) => void;
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
 * A read-out of state the flow already holds. It gates no field and submits
 * nothing; the single exception is the optional `onStepSelect` back-link on
 * already-completed steps, which moves the caller's own step cursor backwards
 * and nothing else. Colour changes are `.2s ease`; there are no keyframes and
 * no hover lift — a hoverable step changes ink and gains an underline, and the
 * focus ring is the standard 2px accent edge drawn inset, so nothing reflows.
 */
export function StepRibbon({
  steps,
  current,
  completed = [],
  onStepSelect,
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

        /**
         * A step is activatable only when the caller asked for back-navigation
         * AND the step is already done. Everything else stays a <span>, so a
         * ribbon with no handler renders byte-identically to before.
         */
        const canGoBack = Boolean(onStepSelect) && isDone;

        const inner = (
          <>
            {isDone ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            )}
            {step.label}
            {isDone && <span className="sr-only">(completed)</span>}
          </>
        );

        const shared = cn(
          "flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.08em]",
          "transition-colors duration-state",
          tone,
        );

        return (
          <li key={step.label} className="flex items-center gap-2">
            {canGoBack ? (
              <button
                type="button"
                onClick={() => onStepSelect?.(index)}
                className={cn(
                  shared,
                  // Colour + underline only. No lift, no scale, no keyframes.
                  "cursor-pointer underline-offset-4 hover:text-brand hover:underline",
                  // The standard 2px accent edge, drawn inset so focusing the
                  // step moves nothing. The `!` beats the global
                  // `*:focus-visible` rule in index.css, which would otherwise
                  // paint a detached 4px-radius ring around the label.
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand",
                  "focus-visible:!outline-offset-[-2px] focus-visible:!rounded-sm",
                )}
                data-testid={step.testId}
                aria-label={`Go back to step ${index + 1}, ${step.label}`}
              >
                {inner}
              </button>
            ) : (
              <span
                className={shared}
                data-testid={step.testId}
                aria-current={isActive ? "step" : undefined}
              >
                {inner}
              </span>
            )}
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
