import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared control shell for the tool surfaces.
 *
 *   48px tall, white, 1px #CAD5E2, 8px radius, 16px horizontal padding,
 *   15px ink text, #90A1B9 placeholder.
 *
 * FOCUS — why an inset outline and not a thicker border:
 * the design law is "2px accent edge on focus, and nothing reflows". Swapping a
 * 1px border for a 2px one moves the content box by a pixel on every focus, so
 * the accent edge is drawn as `outline: 2px` with `outline-offset: -2px`, which
 * paints inside the box and costs zero layout. No glow, no ring — the edge is
 * the whole signal.
 *
 * The `!` on offset/radius is deliberate: index.css ships a global
 * `*:focus-visible { outline-offset: 2px; border-radius: 4px }` that sits after
 * Tailwind's utilities in source order, so a plain utility loses to it and the
 * control would grow a detached 4px-radius ring on focus.
 */
export const TOOL_CONTROL_BASE = cn(
  "h-12 w-full rounded-md border border-border-control bg-white px-4",
  "text-[15px] leading-5 text-text-primary",
  "transition-colors duration-state",
  "focus:outline focus:outline-2 focus:outline-brand",
  "focus:!outline-offset-[-2px] focus:!rounded-md",
  "disabled:cursor-not-allowed disabled:bg-surface-recessed disabled:text-text-deemphasis",
);

export interface InputProps extends React.ComponentPropsWithoutRef<"input"> {
  /** Adds left padding for an absolutely-positioned leading icon (40px gutter). */
  hasLeadingIcon?: boolean;
  /** Adds right padding for a trailing icon / spinner (40px gutter). */
  hasTrailingIcon?: boolean;
}

/**
 * Text input for tool forms.
 *
 * ```tsx
 * <div className="relative">
 *   <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-deemphasis" />
 *   <Input hasLeadingIcon placeholder="…" value={q} onChange={…} />
 * </div>
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasLeadingIcon, hasTrailingIcon, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        TOOL_CONTROL_BASE,
        "placeholder:text-text-deemphasis",
        // file inputs: the native button is restyled to match the outline button
        "file:mr-3 file:h-8 file:cursor-pointer file:rounded-md file:border file:border-border-control",
        "file:bg-white file:px-3 file:text-[13px] file:font-semibold file:text-text-primary",
        hasLeadingIcon && "pl-11",
        hasTrailingIcon && "pr-11",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "ToolInput";
