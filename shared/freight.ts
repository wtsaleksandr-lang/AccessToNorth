import { z } from "zod";

export const freightCargoLineSchema = z.object({
  id: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1, "Describe each cargo line").max(200),
  packaging: z.enum(["pallets", "cartons", "crates", "drums", "bags", "loose", "other"]),
  quantity: z.coerce.number().int().min(1).max(100_000),
  length: z.coerce.number().positive().max(100_000),
  width: z.coerce.number().positive().max(100_000),
  height: z.coerce.number().positive().max(100_000),
  dimensionUnit: z.enum(["in", "cm"]),
  totalWeight: z.coerce.number().positive().max(100_000_000),
  weightUnit: z.enum(["lb", "kg"]),
});

export const freightEstimateServiceSchema = z.enum([
  "lcl",
  "fcl20",
  "fcl40",
  "fcl40hc",
  "fcl45hc",
  "air",
  "ltl",
  "ftl",
  "express",
]);

export const freightEstimateRequestSchema = z.object({
  mode: z.enum(["ocean", "air", "truck", "courier"]),
  origin: z.string().trim().min(2, "Origin is required").max(240),
  destination: z.string().trim().min(2, "Destination is required").max(240),
  service: freightEstimateServiceSchema,
  equipmentQuantity: z.coerce.number().int().min(1).max(20).default(1),
  cargoLines: z.array(freightCargoLineSchema).min(1).max(30),
  hazardous: z.boolean().default(false),
  temperatureControlled: z.boolean().default(false),
}).superRefine((input, context) => {
  const allowedByMode = {
    ocean: ["lcl", "fcl20", "fcl40", "fcl40hc", "fcl45hc"],
    air: ["air"],
    truck: ["ltl", "ftl"],
    courier: ["express"],
  } as const;
  if (!(allowedByMode[input.mode] as readonly string[]).includes(input.service)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["service"], message: "The selected service does not match the transport mode." });
  }
  if (input.hazardous || input.temperatureControlled) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [input.hazardous ? "hazardous" : "temperatureControlled"],
      message: "Specialized cargo requires a verified quote because public market estimates exclude key accessorials.",
    });
  }
});

export const freightQuoteSchema = z.object({
  mode: z.enum(["ocean", "air", "truck", "rail", "courier"]),
  direction: z.enum(["import", "export", "domestic", "cross-border"]),
  serviceLevel: z.enum(["flexible", "standard", "expedited"]),
  origin: z.string().trim().min(2, "Origin is required").max(240),
  destination: z.string().trim().min(2, "Destination is required").max(240),
  readyDate: z.string().trim().max(20).optional().default(""),
  incoterm: z.string().trim().max(20).optional().default("unsure"),
  commodity: z.string().trim().min(2, "Commodity is required").max(300),
  cargoLines: z.array(freightCargoLineSchema).min(1).max(30),
  stackable: z.boolean().default(false),
  hazardous: z.boolean().default(false),
  temperatureControlled: z.boolean().default(false),
  temperatureC: z.coerce.number().min(-100).max(100).nullable().optional(),
  notes: z.string().trim().max(4_000).optional().default(""),
  contactName: z.string().trim().min(2, "Contact name is required").max(160),
  companyName: z.string().trim().max(200).optional().default(""),
  email: z.string().trim().email("A valid email is required").max(320),
  phone: z.string().trim().max(60).optional().default(""),
  consent: z.literal(true, { errorMap: () => ({ message: "Confirm that the shipment details may be reviewed for a quote" }) }),
});

export const shipmentTrackingSchema = z.object({
  trackingId: z.string().trim().min(4, "Enter an AccessToNorth order or RFQ number").max(40),
  email: z.string().trim().email("Enter the email used for the request").max(320),
});

export type FreightQuoteInput = z.infer<typeof freightQuoteSchema>;
export type FreightCargoLine = z.infer<typeof freightCargoLineSchema>;
export type FreightEstimateRequest = z.infer<typeof freightEstimateRequestSchema>;

export interface FreightMarketEstimate {
  mode: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  transitMinDays: number | null;
  transitMaxDays: number | null;
}

export interface FreightMarketEstimateResponse {
  source: "Freightos";
  estimates: FreightMarketEstimate[];
  retrievedAt: string;
  cached: boolean;
  attributionUrl: string;
  disclaimer: string;
}

export function normalizeAccessToNorthId(value: string) {
  return value.trim().toUpperCase();
}

export function summarizeFreightCargo(lines: FreightCargoLine[]) {
  return lines.reduce((summary, line) => {
    summary.packages += line.quantity;
    summary.weightKg += line.weightUnit === "kg" ? line.totalWeight : line.totalWeight * 0.45359237;
    const lengthM = line.dimensionUnit === "cm" ? line.length / 100 : line.length * 0.0254;
    const widthM = line.dimensionUnit === "cm" ? line.width / 100 : line.width * 0.0254;
    const heightM = line.dimensionUnit === "cm" ? line.height / 100 : line.height * 0.0254;
    summary.volumeCbm += lengthM * widthM * heightM * line.quantity;
    return summary;
  }, { packages: 0, weightKg: 0, volumeCbm: 0 });
}
