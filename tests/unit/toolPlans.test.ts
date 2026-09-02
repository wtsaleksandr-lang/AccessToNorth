import assert from "node:assert/strict";
import test from "node:test";
import { getToolPlan, TOOL_PLANS, TOOL_TRIAL_DAYS, WINBACK_MONTHS, WINBACK_PERCENT_OFF } from "../../shared/toolPlans";

test("all paid tool plans use the approved 14-day trial policy", () => {
  assert.equal(TOOL_TRIAL_DAYS, 14);
  assert.equal(TOOL_PLANS.length, 6);
  assert.equal(new Set(TOOL_PLANS.map((plan) => plan.id)).size, TOOL_PLANS.length);
});

test("annual plans are cheaper than twelve monthly payments", () => {
  for (const tier of ["embed-starter", "embed-pro", "loading-api"] as const) {
    const monthly = getToolPlan(`${tier}-monthly`)!;
    const annual = getToolPlan(`${tier}-annual`)!;
    assert.ok(annual.amount < monthly.amount * 12);
  }
  assert.equal(getToolPlan("embed-starter-annual")?.amount, 14_900);
});

test("win-back offer is meaningful without becoming permanent pricing", () => {
  assert.equal(WINBACK_PERCENT_OFF, 50);
  assert.equal(WINBACK_MONTHS, 6);
});
