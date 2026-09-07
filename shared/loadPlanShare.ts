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

const sharedCargoItemSchema = z.object({
  id: z.string().trim().min(1).max(100),
  name: z.string().max(160),
  length: finiteNonNegative.max(2_000),
  width: finiteNonNegative.max(1_000),
  height: finiteNonNegative.max(1_000),
  weight: finiteNonNegative.max(2_000_000),
  quantity: z.number().int().positive().max(10_000),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  stackable: z.boolean(),
  palletized: z.boolean(),
  palletType: z.enum(["none", "us48x40", "euro", "custom"]),
  customPalletL: finiteNonNegative.max(2_000),
  customPalletW: finiteNonNegative.max(1_000),
  customPalletH: finiteNonNegative.max(1_000),
  rotationMode: z.enum(["all", "horizontal", "fixed"]),
  included: z.boolean(),
  loadPriority: z.enum(["first", "normal", "last"]),
});

const sharedEditorStateSchema = z.object({
  containerSelectionMode: z.enum(["recommend", "manual"]),
  containerId: z.string().trim().min(1).max(40),
  customContainer: z.object({
    lengthIn: finitePositive.max(2_000),
    widthIn: finitePositive.max(1_000),
    heightIn: finitePositive.max(1_000),
    maxPayloadLbs: finitePositive.max(2_000_000),
  }),
  cargoItems: z.array(sharedCargoItemSchema).min(1).max(500),
});

export const createSharedLoadPlanSchema = z.object({
  title: z.string().trim().min(1).max(120).default("Container loading plan"),
  unitSystem: z.enum(["imperial", "metric"]),
  containers: z.array(sharedLoadPlanContainerSchema).min(1).max(20),
  // Optional so every share link created before editable copies existed
  // remains valid. Older plans are reconstructed from their placements.
  editorState: sharedEditorStateSchema.optional(),
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
