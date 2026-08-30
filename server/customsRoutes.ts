import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { insertCustomsLeadSchema } from "@shared/schema";
import {
  calculateBorderTaxes,
  calculateDutyAmount,
  GST_RATE,
  PROVINCIAL_TAXES,
} from "@shared/customsEstimate";
import { TARIFF_DATA_MINIMUMS } from "./tariffCountryTreatments";

const TARIFF_TREATMENT_PRIORITY: Record<string, number> = {
  UST: 1,
  MXT: 2,
  CPTPT: 3,
  CEUT: 4,
  UKT: 5,
  AUT: 6,
  NZT: 7,
  CT: 8,
  CRT: 9,
  KRT: 10,
  CIAT: 11,
  COLT: 12,
  PAT: 13,
  HNT: 14,
  JT: 15,
  PT: 16,
  IT: 17,
  NT: 18,
  SLT: 19,
  UAT: 20,
  CCCT: 21,
  GPT: 22,
  LDCT: 23,
  MFN: 24,
  "General Tariff": 25,
};

function getBestTreatment(
  countryTreatments: string[],
  dutyRates: Record<string, string>,
  valueCAD: number,
  quantity: number,
  unitOfMeasure?: string | null,
): { treatment: string; rate: string; treatmentName: string } {
  const TREATMENT_NAMES: Record<string, string> = {
    MFN: "Most Favoured Nation",
    UST: "United States (CUSMA)",
    MXT: "Mexico (CUSMA)",
    CPTPT: "CPTPP",
    CEUT: "CETA (EU)",
    UKT: "CUKTCA (UK)",
    AUT: "Australia",
    NZT: "New Zealand",
    CT: "Chile",
    CRT: "Costa Rica",
    KRT: "Korea",
    CIAT: "Canada-Israel",
    COLT: "Colombia",
    PAT: "Panama",
    HNT: "Honduras",
    JT: "Jordan",
    PT: "Peru",
    IT: "Iceland",
    NT: "Norway",
    SLT: "Switzerland-Liechtenstein",
    UAT: "Ukraine",
    GPT: "General Preferential",
    LDCT: "Least Developed Country",
    CCCT: "Commonwealth Caribbean",
    "General Tariff": "General Tariff",
  };

  const initialTreatment = countryTreatments.find((treatment) => dutyRates[treatment] && dutyRates[treatment] !== "N/A") || "MFN";
  let bestTreatment = initialTreatment;
  let bestRate = dutyRates[initialTreatment] || "N/A";
  let bestCalculation = calculateDutyAmount(bestRate, valueCAD, quantity, unitOfMeasure);
  let bestPriority = TARIFF_TREATMENT_PRIORITY[initialTreatment] || 99;

  for (const treatment of countryTreatments) {
    const rate = dutyRates[treatment];
    if (!rate || rate === "N/A") continue;

    const calculation = calculateDutyAmount(rate, valueCAD, quantity, unitOfMeasure);
    const priority = TARIFF_TREATMENT_PRIORITY[treatment] || 99;
    const reliabilityImproved = bestCalculation.requiresManualReview && !calculation.requiresManualReview;
    const sameReliability = bestCalculation.requiresManualReview === calculation.requiresManualReview;
    const lowerEstimate = calculation.duty < bestCalculation.duty - 0.005;
    const tiedEstimate = Math.abs(calculation.duty - bestCalculation.duty) <= 0.005;
    if (reliabilityImproved || (sameReliability && (lowerEstimate || (tiedEstimate && priority < bestPriority)))) {
      bestTreatment = treatment;
      bestRate = rate;
      bestCalculation = calculation;
      bestPriority = priority;
    }
  }

  return {
    treatment: bestTreatment,
    rate: bestRate,
    treatmentName: TREATMENT_NAMES[bestTreatment] || bestTreatment,
  };
}

function calculateDuty(
  rateStr: string,
  valueCAD: number,
  quantity: number,
  unitOfMeasure?: string | null,
) {
  return calculateDutyAmount(rateStr, valueCAD, quantity, unitOfMeasure);
}

export function registerCustomsRoutes(app: Express) {
  const calculationRateLimit = new Map<string, number[]>();
  const limitCalculations = (req: any, res: any, next: any) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const recent = (calculationRateLimit.get(key) || []).filter((time) => now - time < 60_000);
    if (recent.length >= 30) {
      return res.status(429).json({ message: "Too many calculation requests. Please wait a minute and try again." });
    }
    recent.push(now);
    calculationRateLimit.set(key, recent);
    next();
  };
  const unavailable = (res: any) => res.status(503).json({
    code: "TARIFF_DATA_UNAVAILABLE",
    message: "The Canadian tariff dataset is temporarily unavailable. Please try again shortly.",
  });

  app.get("/api/customs/status", async (_req, res) => {
    try {
      const health = await storage.getTariffDataHealth();
      const available = health.hsCodeCount >= TARIFF_DATA_MINIMUMS.classifications
        && health.countryCount >= TARIFF_DATA_MINIMUMS.countries;
      res.status(available ? 200 : 503).json({
        available,
        ...health,
        tariffEdition: "T2026",
      });
    } catch {
      unavailable(res);
    }
  });

  app.get("/api/hs-search", async (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 30);

      if (query.length < 3) {
        return res.json([]);
      }

      const health = await storage.getTariffDataHealth();
      if (health.hsCodeCount < TARIFF_DATA_MINIMUMS.classifications) return unavailable(res);

      const results = await storage.searchHsCodesFuzzy(query, limit);
      res.json(
        results.map((r) => ({
          code: r.code,
          description: r.description,
          descriptionFull: r.descriptionFull || r.description,
          chapter: r.chapter,
          unitOfMeasure: r.unitOfMeasure,
          score: r.score,
        }))
      );
    } catch (err) {
      console.error("Error in fuzzy HS search:", err);
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/customs/hs-search", async (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      if (query.length < 2 || (!/^[\d.]+$/.test(query.trim()) && query.trim().length < 3)) {
        return res.json([]);
      }

      const health = await storage.getTariffDataHealth();
      if (health.hsCodeCount < TARIFF_DATA_MINIMUMS.classifications) return unavailable(res);
      const numeric = /^[\d.]+$/.test(query.trim());
      const results = numeric
        ? (await storage.searchHsCodes(query, limit)).map((result) => ({ ...result, score: 1 }))
        : await storage.searchHsCodesFuzzy(query, limit);
      res.json(
        results.map((r) => ({
          code: r.code,
          description: r.description,
          descriptionFull: r.descriptionFull || r.description,
          chapter: r.chapter,
          unitOfMeasure: r.unitOfMeasure,
          score: r.score,
          classificationLevel: r.code.replace(/\D/g, "").length === 10 ? "complete" : "tariff-item",
        }))
      );
    } catch (err) {
      console.error("Error searching HS codes:", err);
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/customs/countries", async (_req, res) => {
    try {
      const countries = await storage.getAllCountries();
      if (countries.length < TARIFF_DATA_MINIMUMS.countries) return unavailable(res);
      res.json(countries);
    } catch (err) {
      console.error("Error fetching countries:", err);
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  app.get("/api/customs/provinces", async (_req, res) => {
    res.json(
      Object.entries(PROVINCIAL_TAXES).map(([code, info]) => ({
        code,
        name: info.name,
        rate: info.rate,
        type: info.type,
        totalTaxRate: info.type === "HST" ? GST_RATE + info.rate : GST_RATE + info.rate,
        gstRate: GST_RATE,
        provincialRate: info.rate,
      }))
    );
  });

  app.post("/api/customs/calculate", limitCalculations, async (req, res) => {
    try {
      const schema = z.object({
        hsCode: z.string().min(1, "HS code is required"),
        countryOfOrigin: z.string().min(1, "Country of origin is required"),
        valueCAD: z.number().positive("Value must be positive"),
        quantity: z.number().min(0).default(0),
        province: z.string().min(2).max(2).default("ON"),
        shipmentType: z.enum(["commercial", "personal"]).default("commercial"),
        confirmedOrigin: z.boolean().default(false),
      });

      const input = schema.parse(req.body);

      const hsCode = await storage.getHsCodeByCode(input.hsCode);
      if (!hsCode) {
        return res.status(404).json({ message: "HS code not found" });
      }

      const countries = await storage.getAllCountries();
      const country = countries.find(
        (c) => c.name.toLowerCase() === input.countryOfOrigin.toLowerCase()
      );
      let treatments = country?.treatments || ["MFN"];

      const isPreferential = treatments.some(t => t !== "MFN" && t !== "General Tariff");
      const warnings: string[] = [];

      if (isPreferential && !input.confirmedOrigin) {
        treatments = ["MFN"];
        warnings.push("Preferential tariff rates require goods to qualify under rules of origin. MFN rate applied. Check the box to confirm eligibility for preferential rates.");
      }

      const dutyRates = hsCode.dutyRates as Record<string, string>;
      const bestTreatment = getBestTreatment(treatments, dutyRates, input.valueCAD, input.quantity, hsCode.unitOfMeasure);
      const dutyCalc = calculateDuty(bestTreatment.rate, input.valueCAD, input.quantity, hsCode.unitOfMeasure);
      const dutyAmount = dutyCalc.duty;
      warnings.push(...dutyCalc.warnings);

      const taxes = calculateBorderTaxes({
        valueCAD: input.valueCAD,
        dutyAmount,
        province: input.province,
        shipmentType: input.shipmentType,
      });
      warnings.push(...taxes.warnings);

      const totalDutiesAndTaxes = dutyAmount + taxes.totalTax;
      const totalLandedCost = input.valueCAD + totalDutiesAndTaxes;

      const allTreatmentRates: Record<string, { rate: string; duty: number }> = {};
      const allTreatments = country?.treatments || ["MFN"];
      for (const t of allTreatments) {
        const rate = dutyRates[t];
        if (rate && rate !== "N/A") {
          const calc = calculateDuty(rate, input.valueCAD, input.quantity, hsCode.unitOfMeasure);
          allTreatmentRates[t] = {
            rate,
            duty: calc.duty,
          };
        }
      }

      res.json({
        hsCode: hsCode.code,
        description: hsCode.descriptionFull || hsCode.description,
        unitOfMeasure: hsCode.unitOfMeasure,
        countryOfOrigin: input.countryOfOrigin,
        valueCAD: input.valueCAD,
        quantity: input.quantity,
        province: input.province,
        provinceName: taxes.provinceInfo.name,
        shipmentType: input.shipmentType,

        appliedTreatment: bestTreatment.treatment,
        appliedTreatmentName: bestTreatment.treatmentName,
        dutyRate: bestTreatment.rate,
        dutyAmount: Math.round(dutyAmount * 100) / 100,

        gstRate: taxes.gstRate,
        gstAmount: Math.round(taxes.gstAmount * 100) / 100,
        gstLabel: taxes.gstLabel,

        provincialTaxRate: taxes.provincialTaxRate,
        provincialTaxAmount: Math.round(taxes.provincialTaxAmount * 100) / 100,
        provincialTaxName: taxes.provincialTaxName,

        totalDutiesAndTaxes: Math.round(totalDutiesAndTaxes * 100) / 100,
        totalLandedCost: Math.round(totalLandedCost * 100) / 100,

        availableTreatments: allTreatmentRates,

        warnings,
        requiresManualReview: dutyCalc.requiresManualReview,
        preferentialAvailable: isPreferential,
        originConfirmed: input.confirmedOrigin,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      } else {
        console.error("Error calculating duties:", err);
        res.status(500).json({ message: "Calculation failed" });
      }
    }
  });

  app.post("/api/customs/calculate-bulk", limitCalculations, async (req, res) => {
    try {
      const schema = z.object({
        items: z.array(
          z.object({
            hsCode: z.string(),
            countryOfOrigin: z.string(),
            valueCAD: z.number().positive(),
            quantity: z.number().min(0).default(0),
            description: z.string().optional(),
          })
        ).min(1).max(100),
        province: z.string().min(2).max(2).default("ON"),
        shipmentType: z.enum(["commercial", "personal"]).default("commercial"),
        confirmedOrigin: z.boolean().default(false),
      });

      const input = schema.parse(req.body);
      const countries = await storage.getAllCountries();
      const provTax = PROVINCIAL_TAXES[input.province as keyof typeof PROVINCIAL_TAXES] || PROVINCIAL_TAXES.ON;
      const results: any[] = [];
      let totalValue = 0;
      let totalDuty = 0;
      let totalGST = 0;
      let totalProvTax = 0;

      for (const item of input.items) {
        const hsCode = await storage.getHsCodeByCode(item.hsCode);
        if (!hsCode) {
          results.push({
            hsCode: item.hsCode,
            error: "HS code not found",
            description: item.description || "Unknown",
          });
          continue;
        }

        const country = countries.find(
          (c) => c.name.toLowerCase() === item.countryOfOrigin.toLowerCase()
        );
        const availableTreatments = country?.treatments || ["MFN"];
        const preferentialAvailable = availableTreatments.some(
          (treatment) => treatment !== "MFN" && treatment !== "General Tariff",
        );
        const treatments = preferentialAvailable && !input.confirmedOrigin
          ? ["MFN"]
          : availableTreatments;
        const dutyRates = hsCode.dutyRates as Record<string, string>;
        const bestTreatment = getBestTreatment(treatments, dutyRates, item.valueCAD, item.quantity, hsCode.unitOfMeasure);
        const dutyCalc = calculateDuty(bestTreatment.rate, item.valueCAD, item.quantity, hsCode.unitOfMeasure);
        const dutyAmount = dutyCalc.duty;
        const taxes = calculateBorderTaxes({
          valueCAD: item.valueCAD,
          dutyAmount,
          province: input.province,
          shipmentType: input.shipmentType,
        });
        const gstAmount = taxes.gstAmount;
        const provincialTaxAmount = taxes.provincialTaxAmount;
        const itemWarnings = [...dutyCalc.warnings, ...taxes.warnings];
        if (preferentialAvailable && !input.confirmedOrigin) {
          itemWarnings.unshift("MFN applied because preferential rules-of-origin eligibility was not confirmed.");
        }

        totalValue += item.valueCAD;
        totalDuty += dutyAmount;
        totalGST += gstAmount;
        totalProvTax += provincialTaxAmount;

        results.push({
          hsCode: hsCode.code,
          description: item.description || hsCode.descriptionFull || hsCode.description,
          countryOfOrigin: item.countryOfOrigin,
          valueCAD: item.valueCAD,
          quantity: item.quantity,
          appliedTreatment: bestTreatment.treatmentName,
          dutyRate: bestTreatment.rate,
          dutyAmount: Math.round(dutyAmount * 100) / 100,
          gstAmount: Math.round(gstAmount * 100) / 100,
          provincialTaxAmount: Math.round(provincialTaxAmount * 100) / 100,
          totalForItem: Math.round((item.valueCAD + dutyAmount + gstAmount + provincialTaxAmount) * 100) / 100,
          warnings: itemWarnings,
          requiresManualReview: dutyCalc.requiresManualReview,
        });
      }

      res.json({
        items: results,
        summary: {
          totalItems: results.filter((r) => !r.error).length,
          totalValue: Math.round(totalValue * 100) / 100,
          totalDuty: Math.round(totalDuty * 100) / 100,
          totalGST: Math.round(totalGST * 100) / 100,
          totalProvincialTax: Math.round(totalProvTax * 100) / 100,
          totalDutiesAndTaxes: Math.round((totalDuty + totalGST + totalProvTax) * 100) / 100,
          totalLandedCost: Math.round((totalValue + totalDuty + totalGST + totalProvTax) * 100) / 100,
          province: input.province,
          provinceName: provTax.name,
          shipmentType: input.shipmentType,
          originConfirmed: input.confirmedOrigin,
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Error in bulk calculation:", err);
        res.status(500).json({ message: "Bulk calculation failed" });
      }
    }
  });

  const customsLeadRateLimit = new Map<string, number[]>();

  const acceptLeadRequest = (req: any, res: any) => {
    const ip = req.ip || "unknown";
    const now = Date.now();
    const timestamps = customsLeadRateLimit.get(ip)?.filter((time) => now - time < 60_000) || [];
    if (timestamps.length >= 5) {
      res.status(429).json({ message: "Too many requests. Please try again later." });
      return false;
    }
    timestamps.push(now);
    customsLeadRateLimit.set(ip, timestamps);
    return true;
  };

  app.post("/api/leads/tool-waitlist", async (req, res) => {
    try {
      if (!acceptLeadRequest(req, res)) return;
      const input = z.object({
        email: z.string().email(),
        tool: z.enum(["freight-quote", "shipment-tracking"]),
      }).parse(req.body);
      const lead = await storage.createCustomsLead({
        email: input.email,
        companyName: null,
        phone: null,
        hsCode: null,
        countryOfOrigin: null,
        goodsValue: null,
        calculatedDuty: null,
        source: `${input.tool}-waitlist`,
      });
      res.status(201).json({ success: true, id: lead.id });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Error creating tool waitlist lead:", err);
        res.status(500).json({ message: "Could not save your email. Please try again." });
      }
    }
  });

  app.post("/api/leads/customs-calculator", async (req, res) => {
    try {
      if (!acceptLeadRequest(req, res)) return;

      const input = insertCustomsLeadSchema.parse({
        ...req.body,
        source: "customs-calculator",
      });
      const lead = await storage.createCustomsLead(input);
      res.status(201).json({ success: true, id: lead.id });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Error creating customs lead:", err);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });
}
