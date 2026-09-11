import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  /** Forwarded verbatim as `data-testid` — existing test ids must survive a restyle. */
  testId?: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Required: the group has no visible heading of its own. */
  ariaLabel: string;
  className?: string;
}

/**
 * Two-or-more-way switch for a jurisdiction, unit system, shipment type, etc.
 *
 *   container  #F2F4F7, 4px padding, 12px radius
 *   active     white pill, 8px radius (12 − 4 = 8, concentric), ink, shadow-sm
 *   inactive   #475467, ink on hover
 *
 * Selection is a surface change, not a bright accent fill, and the pill never
 * changes size — only its background and colour — so nothing reflows.
 *
 * ```tsx
 * <SegmentedControl
 *   ariaLabel="Shipment type"
 *   value={shipmentType}
 *   onChange={setShipmentType}
 *   options={[{ value: "commercial", label: "Commercial", testId: "button-commercial" }]}
 * />
 * ```
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex gap-1 rounded-lg bg-surface-canvas p-1", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            data-testid={option.testId}
            className={cn(
              "flex h-10 flex-1 items-center justify-center rounded-md px-4",
              "text-[15px] font-semibold transition-colors duration-state",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand",
              "focus-visible:!outline-offset-[-2px] focus-visible:!rounded-md",
              active
                ? "bg-white text-text-primary shadow-sm"
                : "bg-transparent text-text-muted hover:text-text-primary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
