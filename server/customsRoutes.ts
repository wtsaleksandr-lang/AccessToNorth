import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { insertCustomsLeadSchema } from "@shared/schema";

const GST_RATE = 0.05;

const PROVINCIAL_TAXES: Record<string, { name: string; rate: number; type: string }> = {
  AB: { name: "Alberta", rate: 0, type: "GST" },
  BC: { name: "British Columbia", rate: 0.07, type: "GST+PST" },
  MB: { name: "Manitoba", rate: 0.07, type: "GST+PST" },
  NB: { name: "New Brunswick", rate: 0.10, type: "HST" },
  NL: { name: "Newfoundland and Labrador", rate: 0.10, type: "HST" },
  NS: { name: "Nova Scotia", rate: 0.10, type: "HST" },
  NT: { name: "Northwest Territories", rate: 0, type: "GST" },
  NU: { name: "Nunavut", rate: 0, type: "GST" },
  ON: { name: "Ontario", rate: 0.08, type: "HST" },
  PE: { name: "Prince Edward Island", rate: 0.10, type: "HST" },
  QC: { name: "Quebec", rate: 0.09975, type: "GST+QST" },
  SK: { name: "Saskatchewan", rate: 0.06, type: "GST+PST" },
  YT: { name: "Yukon", rate: 0, type: "GST" },
};

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

function parseRateToPercent(rateStr: string): { percent: number; perUnit: string | null; compound: boolean; description: string } {
  if (!rateStr || rateStr === "N/A") {
    return { percent: 0, perUnit: null, compound: false, description: "N/A" };
  }

  const cleaned = rateStr.trim();

  if (cleaned === "Free" || cleaned === "free") {
    return { percent: 0, perUnit: null, compound: false, description: "Free" };
  }

  const pctMatch = cleaned.match(/^([\d.]+)\s*%/);
  if (pctMatch && !cleaned.includes("but not less than") && !cleaned.includes("/")) {
    return {
      percent: parseFloat(pctMatch[1]),
      perUnit: null,
      compound: false,
      description: `${pctMatch[1]}%`,
    };
  }

  if (cleaned.includes("but not less than") || cleaned.includes("but not more than")) {
    const pct = pctMatch ? parseFloat(pctMatch[1]) : 0;
    return {
      percent: pct,
      perUnit: null,
      compound: true,
      description: cleaned,
    };
  }

  const specificMatch = cleaned.match(/\$([\d.]+)\/(kg|litre|tonne)/);
  if (specificMatch) {
    return {
      percent: 0,
      perUnit: cleaned,
      compound: false,
      description: cleaned,
    };
  }

  const centMatch = cleaned.match(/([\d.]+)\s*¢\/(kg|dozen|litre)/);
  if (centMatch) {
    return {
      percent: 0,
      perUnit: cleaned,
      compound: false,
      description: cleaned,
    };
  }

  const centEachMatch = cleaned.match(/([\d.]+)\s*¢\s*(?:each)?$/);
  if (centEachMatch) {
    return {
      percent: 0,
      perUnit: cleaned,
      compound: false,
      description: cleaned,
    };
  }

  return {
    percent: 0,
    perUnit: null,
    compound: false,
    description: cleaned || "Unknown",
  };
}

function getBestTreatment(
  countryTreatments: string[],
  dutyRates: Record<string, string>
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

  let bestTreatment = "MFN";
  let bestRate = dutyRates["MFN"] || "N/A";
  let bestParsed = parseRateToPercent(bestRate);
  let bestPriority = TARIFF_TREATMENT_PRIORITY["MFN"];

  for (const treatment of countryTreatments) {
    const rate = dutyRates[treatment];
    if (!rate || rate === "N/A") continue;

    const parsed = parseRateToPercent(rate);
    const priority = TARIFF_TREATMENT_PRIORITY[treatment] || 99;

    if (parsed.description === "Free") {
      return {
        treatment,
        rate,
        treatmentName: TREATMENT_NAMES[treatment] || treatment,
      };
    }

    if (priority < bestPriority && !parsed.compound) {
      bestTreatment = treatment;
      bestRate = rate;
      bestParsed = parsed;
      bestPriority = priority;
    } else if (!parsed.compound && parsed.percent < bestParsed.percent && !bestParsed.compound) {
      bestTreatment = treatment;
      bestRate = rate;
      bestParsed = parsed;
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
  quantity: number
): number {
  const parsed = parseRateToPercent(rateStr);

  if (parsed.description === "Free") return 0;

  if (parsed.percent > 0 && !parsed.perUnit) {
    const duty = valueCAD * (parsed.percent / 100);

    if (parsed.compound) {
      const minMatch = rateStr.match(/not less than \$([\d.]+)\/(kg|litre|tonne)/);
      if (minMatch && quantity > 0) {
        const perUnitMin = parseFloat(minMatch[1]);
        let multiplier = quantity;
        if (minMatch[2] === "tonne") multiplier = quantity / 1000;
        const minDuty = perUnitMin * multiplier;
        return Math.max(duty, minDuty);
      }
      const minCentMatch = rateStr.match(/not less than ([\d.]+)\s*¢\/(kg|each)/);
      if (minCentMatch && quantity > 0) {
        const perUnitMin = parseFloat(minCentMatch[1]) / 100;
        const minDuty = perUnitMin * quantity;
        return Math.max(duty, minDuty);
      }
    }

    return duty;
  }

  if (parsed.perUnit && quantity > 0) {
    const dollarMatch = rateStr.match(/\$([\d.]+)\/(kg|litre|tonne)/);
    if (dollarMatch) {
      const rate = parseFloat(dollarMatch[1]);
      let multiplier = quantity;
      if (dollarMatch[2] === "tonne") multiplier = quantity / 1000;
      return rate * multiplier;
    }

    const centMatch = rateStr.match(/([\d.]+)\s*¢\/(kg|dozen|each|litre)/);
    if (centMatch) {
      const rate = parseFloat(centMatch[1]) / 100;
      return rate * quantity;
    }

    const centEachMatch = rateStr.match(/([\d.]+)\s*¢\s*each/);
    if (centEachMatch) {
      const rate = parseFloat(centEachMatch[1]) / 100;
      return rate * quantity;
    }
  }

  return valueCAD * (parsed.percent / 100);
}

export function registerCustomsRoutes(app: Express) {
  app.get("/api/customs/hs-search", async (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      if (query.length < 2) {
        return res.json([]);
      }

      const results = await storage.searchHsCodes(query, limit);
      res.json(
        results.map((r) => ({
          code: r.code,
          description: r.description,
          chapter: r.chapter,
          unitOfMeasure: r.unitOfMeasure,
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

  app.post("/api/customs/calculate", async (req, res) => {
    try {
      const schema = z.object({
        hsCode: z.string().min(1, "HS code is required"),
        countryOfOrigin: z.string().min(1, "Country of origin is required"),
        valueCAD: z.number().positive("Value must be positive"),
        quantity: z.number().min(0).default(0),
        province: z.string().min(2).max(2).default("ON"),
        shipmentType: z.enum(["commercial", "personal"]).default("commercial"),
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
      const treatments = country?.treatments || ["MFN"];

      const dutyRates = hsCode.dutyRates as Record<string, string>;
      const bestTreatment = getBestTreatment(treatments, dutyRates);
      const dutyAmount = calculateDuty(bestTreatment.rate, input.valueCAD, input.quantity);

      const provTax = PROVINCIAL_TAXES[input.province] || PROVINCIAL_TAXES["ON"];
      const dutyPlusValue = input.valueCAD + dutyAmount;

      let gstAmount = dutyPlusValue * GST_RATE;
      let provincialTaxAmount = 0;
      let provincialTaxName = "";

      if (provTax.type === "HST") {
        gstAmount = dutyPlusValue * (GST_RATE + provTax.rate);
        provincialTaxName = "HST";
      } else if (provTax.type === "GST+PST") {
        provincialTaxAmount = dutyPlusValue * provTax.rate;
        provincialTaxName = "PST";
      } else if (provTax.type === "GST+QST") {
        provincialTaxAmount = dutyPlusValue * provTax.rate;
        provincialTaxName = "QST";
      }

      const totalDutiesAndTaxes = dutyAmount + gstAmount + provincialTaxAmount;
      const totalLandedCost = input.valueCAD + totalDutiesAndTaxes;

      const allTreatmentRates: Record<string, { rate: string; duty: number }> = {};
      for (const t of treatments) {
        const rate = dutyRates[t];
        if (rate && rate !== "N/A") {
          allTreatmentRates[t] = {
            rate,
            duty: calculateDuty(rate, input.valueCAD, input.quantity),
          };
        }
      }

      res.json({
        hsCode: hsCode.code,
        description: hsCode.description,
        unitOfMeasure: hsCode.unitOfMeasure,
        countryOfOrigin: input.countryOfOrigin,
        valueCAD: input.valueCAD,
        quantity: input.quantity,
        province: input.province,
        provinceName: provTax.name,
        shipmentType: input.shipmentType,

        appliedTreatment: bestTreatment.treatment,
        appliedTreatmentName: bestTreatment.treatmentName,
        dutyRate: bestTreatment.rate,
        dutyAmount: Math.round(dutyAmount * 100) / 100,

        gstRate: provTax.type === "HST" ? GST_RATE + provTax.rate : GST_RATE,
        gstAmount: Math.round(gstAmount * 100) / 100,
        gstLabel: provTax.type === "HST" ? "HST" : "GST",

        provincialTaxRate: provTax.rate,
        provincialTaxAmount: Math.round(provincialTaxAmount * 100) / 100,
        provincialTaxName,

        totalDutiesAndTaxes: Math.round(totalDutiesAndTaxes * 100) / 100,
        totalLandedCost: Math.round(totalLandedCost * 100) / 100,

        availableTreatments: allTreatmentRates,
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

  app.post("/api/customs/calculate-bulk", async (req, res) => {
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
      });

      const input = schema.parse(req.body);
      const countries = await storage.getAllCountries();
      const provTax = PROVINCIAL_TAXES[input.province] || PROVINCIAL_TAXES["ON"];
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
        const treatments = country?.treatments || ["MFN"];
        const dutyRates = hsCode.dutyRates as Record<string, string>;
        const bestTreatment = getBestTreatment(treatments, dutyRates);
        const dutyAmount = calculateDuty(bestTreatment.rate, item.valueCAD, item.quantity);
        const dutyPlusValue = item.valueCAD + dutyAmount;

        let gstAmount = dutyPlusValue * GST_RATE;
        let provincialTaxAmount = 0;

        if (provTax.type === "HST") {
          gstAmount = dutyPlusValue * (GST_RATE + provTax.rate);
        } else if (provTax.type === "GST+PST" || provTax.type === "GST+QST") {
          provincialTaxAmount = dutyPlusValue * provTax.rate;
        }

        totalValue += item.valueCAD;
        totalDuty += dutyAmount;
        totalGST += gstAmount;
        totalProvTax += provincialTaxAmount;

        results.push({
          hsCode: hsCode.code,
          description: item.description || hsCode.description,
          countryOfOrigin: item.countryOfOrigin,
          valueCAD: item.valueCAD,
          quantity: item.quantity,
          appliedTreatment: bestTreatment.treatmentName,
          dutyRate: bestTreatment.rate,
          dutyAmount: Math.round(dutyAmount * 100) / 100,
          gstAmount: Math.round(gstAmount * 100) / 100,
          provincialTaxAmount: Math.round(provincialTaxAmount * 100) / 100,
          totalForItem: Math.round((item.valueCAD + dutyAmount + gstAmount + provincialTaxAmount) * 100) / 100,
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

  app.post("/api/leads/customs-calculator", async (req, res) => {
    try {
      const ip = req.ip || "unknown";
      const now = Date.now();
      const windowMs = 60_000;
      const maxRequests = 5;
      const timestamps = customsLeadRateLimit.get(ip)?.filter((t) => now - t < windowMs) || [];
      if (timestamps.length >= maxRequests) {
        return res.status(429).json({ message: "Too many requests. Please try again later." });
      }
      timestamps.push(now);
      customsLeadRateLimit.set(ip, timestamps);

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
