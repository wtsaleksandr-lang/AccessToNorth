export const TOOL_TRIAL_DAYS = 14;
export const WINBACK_DELAY_DAYS = 10;
export const WINBACK_PERCENT_OFF = 50;
export const WINBACK_MONTHS = 6;

export type ToolBillingPeriod = "monthly" | "annual";
export type ToolPlanId =
  | "embed-starter-monthly"
  | "embed-starter-annual"
  | "embed-pro-monthly"
  | "embed-pro-annual"
  | "loading-api-monthly"
  | "loading-api-annual";

export interface ToolPlan {
  id: ToolPlanId;
  tier: "embed-starter" | "embed-pro" | "loading-api";
  name: string;
  billingPeriod: ToolBillingPeriod;
  amount: number;
  interval: "month" | "year";
  domains: number;
  monthlyCalculations: number;
  whiteLabel: boolean;
  apiAccess: boolean;
  founding?: boolean;
}

export const TOOL_PLANS: readonly ToolPlan[] = [
  { id: "embed-starter-monthly", tier: "embed-starter", name: "Embed Starter", billingPeriod: "monthly", amount: 1900, interval: "month", domains: 1, monthlyCalculations: 500, whiteLabel: false, apiAccess: false },
  { id: "embed-starter-annual", tier: "embed-starter", name: "Embed Starter", billingPeriod: "annual", amount: 14900, interval: "year", domains: 1, monthlyCalculations: 500, whiteLabel: false, apiAccess: false, founding: true },
  { id: "embed-pro-monthly", tier: "embed-pro", name: "Embed Pro", billingPeriod: "monthly", amount: 4900, interval: "month", domains: 3, monthlyCalculations: 5_000, whiteLabel: true, apiAccess: false },
  { id: "embed-pro-annual", tier: "embed-pro", name: "Embed Pro", billingPeriod: "annual", amount: 49000, interval: "year", domains: 3, monthlyCalculations: 5_000, whiteLabel: true, apiAccess: false },
  { id: "loading-api-monthly", tier: "loading-api", name: "Loading API", billingPeriod: "monthly", amount: 9900, interval: "month", domains: 0, monthlyCalculations: 20_000, whiteLabel: true, apiAccess: true },
  { id: "loading-api-annual", tier: "loading-api", name: "Loading API", billingPeriod: "annual", amount: 99000, interval: "year", domains: 0, monthlyCalculations: 20_000, whiteLabel: true, apiAccess: true },
] as const;

export function getToolPlan(planId: string) {
  return TOOL_PLANS.find((plan) => plan.id === planId);
}

export function formatCad(amount: number) {
  return `CA$${(amount / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}
