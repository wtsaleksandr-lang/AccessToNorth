import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TOOL_CONTROL_BASE } from "./Input";

/** Re-exported so a tool can compose grouped/scrolling content itself. */
export { SelectContent, SelectItem, SelectValue };

export interface SelectProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  "data-testid"?: string;
  "aria-label"?: string;
  className?: string;
  /** `<SelectItem>` children (re-exported from this module). */
  children: React.ReactNode;
}

/**
 * Select for tool forms — same 48px shell as `Input`, so a select and an input
 * sitting in the same grid row line up exactly.
 *
 * Focus uses `:focus`, not `:focus-visible`: the Radix trigger is a button, and
 * a button focused by mouse does not match `:focus-visible`, which would leave
 * an open dropdown with no visible edge on its trigger.
 *
 * ```tsx
 * <Select id="province" value={p} onValueChange={setP} placeholder="Select province">
 *   {PROVINCES.map((x) => <SelectItem key={x.code} value={x.code}>{x.name}</SelectItem>)}
 * </Select>
 * ```
 */
export function Select({
  id,
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <SelectRoot value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          TOOL_CONTROL_BASE,
          "flex items-center justify-between gap-2 text-left",
          "data-[placeholder]:text-text-deemphasis",
          "data-[state=open]:outline data-[state=open]:outline-2 data-[state=open]:outline-brand",
          "data-[state=open]:!outline-offset-[-2px]",
          "[&>span]:line-clamp-1",
          className,
        )}
        data-testid={rest["data-testid"]}
        aria-label={rest["aria-label"]}
      >
        <SelectValue placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 text-text-deemphasis" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectContent className="rounded-md border-border-hairline">{children}</SelectContent>
    </SelectRoot>
  );
}
