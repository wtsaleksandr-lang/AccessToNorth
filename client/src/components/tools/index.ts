/**
 * Shared tool-UI primitives.
 *
 * Every calculator / lookup surface on the site is built from these, so the
 * seven tools read as one product rather than seven. The design law they
 * encode, in one place:
 *
 *   accent      #3356EE and nothing else — selection, focus, link hover,
 *               primary button. Never a decorative icon, never a wash.
 *   controls    48px tall, white, 1px #CAD5E2, 8px radius, 15px ink.
 *   focus       2px accent edge drawn as an inset outline. Never reflows.
 *   radii       6 / 8 / 12 only, concentric (12px shell − 4px pad = 8px child).
 *   motion      `.2s ease` on colour. No keyframes, no hover lift, no gradient,
 *               no backdrop-filter.
 *   figures     always `tabular-nums`, always right-aligned in a column.
 *   warnings    `Callout` — 14px, high contrast, never collapsed.
 *
 * Import from the folder, not the file:
 *   import { Input, Select, SelectItem, FieldLabel } from "@/components/tools";
 */
export { Input, TOOL_CONTROL_BASE, type InputProps } from "./Input";
export { Select, SelectContent, SelectItem, SelectValue, type SelectProps } from "./Select";
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedOption,
} from "./SegmentedControl";
export { StepRibbon, TOOL_SUCCESS, type Step, type StepRibbonProps } from "./StepRibbon";
export { ResultCard, type ResultCardProps, type ResultRow } from "./ResultCard";
export { FieldLabel, type FieldLabelProps } from "./FieldLabel";
export { Callout, type CalloutProps, type CalloutTone } from "./Callout";
