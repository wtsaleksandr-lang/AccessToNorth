import { z } from "zod";

const finitePositive = z.number().finite().positive();
const finiteNonNegative = z.number().finite().nonnegative();

export const sharedContainerSpecSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(100),
  lengthIn: finitePositive.max(2_000),
  widthIn: finitePositive.max(1_000),
  heightIn: finitePositive.max(1_000),
  maxPayloadLbs: finitePositive.max(2_000_000),
  volumeCuFt: finiteNonNegative.max(1_000_000),
  tare: finiteNonNegative.max(2_000_000),
});

export const sharedPlacedBoxSchema = z.object({
  cargoId: z.string().max(100),
  cargoName: z.string().trim().min(1).max(160),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  x: finiteNonNegative.max(2_000),
  y: finiteNonNegative.max(1_000),
  z: finiteNonNegative.max(1_000),
  l: finitePositive.max(2_000),
  w: finitePositive.max(1_000),
  h: finitePositive.max(1_000),
  weight: finiteNonNegative.max(2_000_000),
  rotation: z.string().max(20),
  stackable: z.boolean(),
});

export const sharedLoadPlanContainerSchema = z.object({
  label: z.string().trim().min(1).max(100),
  container: sharedContainerSpecSchema,
  placed: z.array(sharedPlacedBoxSchema).max(2_000),
});

export const createSharedLoadPlanSchema = z.object({
  title: z.string().trim().min(1).max(120).default("Container loading plan"),
  unitSystem: z.enum(["imperial", "metric"]),
  containers: z.array(sharedLoadPlanContainerSchema).min(1).max(20),
}).superRefine((plan, ctx) => {
  const totalBoxes = plan.containers.reduce((sum, entry) => sum + entry.placed.length, 0);
  if (totalBoxes > 3_000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["containers"],
      message: "A shared plan may contain at most 3,000 cargo pieces.",
    });
  }
});

export type SharedLoadPlanPayload = z.infer<typeof createSharedLoadPlanSchema>;

