import type { Express } from "express";
import { z } from "zod";
import {
  CONTAINER_PRESETS,
  packIntoContainers,
  recommendContainer,
  type CargoItem,
} from "../client/src/lib/containerPacking";
import { consumeApiAllowance, validateSubscriptionApiKey } from "./toolSubscriptionService";
import { getToolPlan } from "../shared/toolPlans";

const ENGINE_VERSION = process.env.REPLIT_DEPLOYMENT_ID || process.env.GIT_COMMIT_SHA || "current";

const requestSchema = z.object({
  container: z.enum(["auto", "20dc", "40dc", "40hc", "45hc"]).default("auto"),
  items: z.array(z.object({
    name: z.string().trim().min(1).max(160),
    length: z.number().finite().positive().max(10_000),
    width: z.number().finite().positive().max(10_000),
    height: z.number().finite().positive().max(10_000),
    quantity: z.number().int().positive().max(5_000),
    totalWeight: z.number().finite().nonnegative().max(10_000_000),
    units: z.enum(["in-lbs", "cm-kg"]).default("in-lbs"),
    stackable: z.boolean().default(false),
    rotation: z.enum(["all", "horizontal", "fixed"]).default("horizontal"),
    loadPriority: z.enum(["first", "normal", "last"]).default("normal"),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  })).min(1).max(500),
  maxContainers: z.number().int().min(1).max(20).default(10),
});

const requestWindows = new Map<string, number[]>();

function configuredApiKeys() {
  return new Set((process.env.CONTAINER_LOADING_API_KEYS || "").split(",").map((key) => key.trim()).filter(Boolean));
}

function extractBearer(value: string | undefined) {
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function rateAllowed(key: string) {
  const now = Date.now();
  const current = (requestWindows.get(key) || []).filter((stamp) => now - stamp < 60_000);
  if (current.length >= 120) return false;
  current.push(now);
  requestWindows.set(key, current);
  return true;
}

export function registerContainerLoadingApiRoutes(app: Express) {
  app.post("/api/v1/container-load-plans", async (req, res) => {
    const keys = configuredApiKeys();
    const key = extractBearer(req.header("authorization")) || req.header("x-api-key") || "";
    const subscription = keys.has(key) ? { plan_id: "legacy", stripe_subscription_id: "" } : await validateSubscriptionApiKey(key).catch(() => null);
    if (!subscription) {
      return res.status(401).json({ error: "invalid_api_key", message: "Provide a valid API key." });
    }
    if (!rateAllowed(key)) {
      return res.status(429).json({ error: "rate_limit", message: "Too many requests. Try again in one minute." });
    }
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "invalid_request",
        message: parsed.error.issues[0]?.message || "Invalid request.",
        path: parsed.error.issues[0]?.path.join(".") || undefined,
      });
    }
    if (subscription.plan_id !== "legacy") {
      const plan = getToolPlan(subscription.plan_id);
      const count = plan ? await consumeApiAllowance(subscription.stripe_subscription_id, plan.monthlyCalculations) : undefined;
      if (!count) return res.status(429).json({ error: "monthly_limit", message: "Monthly calculation allowance reached. Contact support to add capacity." });
      res.setHeader("X-RateLimit-Monthly-Limit", String(plan!.monthlyCalculations));
      res.setHeader("X-RateLimit-Monthly-Remaining", String(Math.max(0, plan!.monthlyCalculations - count)));
    }

    const palette = ["#0f766e", "#2563eb", "#b45309", "#7c3aed", "#be123c"];
    const items: CargoItem[] = parsed.data.items.map((item, index) => {
      const metric = item.units === "cm-kg";
      return {
        id: `api-${index + 1}`,
        name: item.name,
        length: metric ? item.length / 2.54 : item.length,
        width: metric ? item.width / 2.54 : item.width,
        height: metric ? item.height / 2.54 : item.height,
        quantity: item.quantity,
        weight: metric ? item.totalWeight / 0.453592 : item.totalWeight,
        color: item.color || palette[index % palette.length],
        stackable: item.stackable,
        palletized: false,
        palletType: "none",
        customPalletL: 0,
        customPalletW: 0,
        customPalletH: 0,
        rotationMode: item.rotation,
        included: true,
        loadPriority: item.loadPriority,
      };
    });

    const recommendation = parsed.data.container === "auto"
      ? recommendContainer(items)
      : null;
    const selected = recommendation?.container || CONTAINER_PRESETS.find((entry) => entry.id === parsed.data.container);
    if (!selected) {
      return res.status(400).json({ error: "container_not_found", message: "Unsupported container type." });
    }
    const plan = recommendation?.plan || packIntoContainers(items, selected, parsed.data.maxContainers);

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-AccessToNorth-Engine-Version", ENGINE_VERSION);
    return res.json({
      apiVersion: "v1",
      engineVersion: ENGINE_VERSION,
      recommendedContainer: selected,
      complete: plan.totalPiecesLoaded === plan.totalPiecesAll,
      totalContainers: plan.totalContainers,
      totalPieces: plan.totalPiecesAll,
      loadedPieces: plan.totalPiecesLoaded,
      containers: plan.containers.map((entry, index) => ({
        number: index + 1,
        label: entry.label,
        container: entry.container,
        utilization: {
          volumePercent: entry.result.volumeUtil,
          payloadPercent: entry.result.weightUtil,
        },
        placed: entry.result.placed,
        unplaced: entry.result.unplaced,
      })),
    });
  });
}
