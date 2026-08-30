export const GST_RATE = 0.05;

export const PROVINCIAL_TAXES = {
  AB: { name: "Alberta", rate: 0, type: "GST" },
  BC: { name: "British Columbia", rate: 0.07, type: "GST+PST" },
  MB: { name: "Manitoba", rate: 0.07, type: "GST+PST" },
  NB: { name: "New Brunswick", rate: 0.10, type: "HST" },
  NL: { name: "Newfoundland and Labrador", rate: 0.10, type: "HST" },
  NS: { name: "Nova Scotia", rate: 0.09, type: "HST" },
  NT: { name: "Northwest Territories", rate: 0, type: "GST" },
  NU: { name: "Nunavut", rate: 0, type: "GST" },
  ON: { name: "Ontario", rate: 0.08, type: "HST" },
  PE: { name: "Prince Edward Island", rate: 0.10, type: "HST" },
  QC: { name: "Quebec", rate: 0.09975, type: "GST+QST" },
  SK: { name: "Saskatchewan", rate: 0.06, type: "GST+PST" },
  YT: { name: "Yukon", rate: 0, type: "GST" },
} as const;

export type ProvinceCode = keyof typeof PROVINCIAL_TAXES;
export type ShipmentType = "commercial" | "personal";

export function calculateBorderTaxes({
  valueCAD,
  dutyAmount,
  province,
  shipmentType,
}: {
  valueCAD: number;
  dutyAmount: number;
  province: string;
  shipmentType: ShipmentType;
}) {
  const provinceInfo = PROVINCIAL_TAXES[province as ProvinceCode] || PROVINCIAL_TAXES.ON;
  const taxableBase = valueCAD + dutyAmount;
  let gstRate = GST_RATE;
  let gstAmount = taxableBase * GST_RATE;
  let gstLabel = "GST";
  let provincialTaxRate = 0;
  let provincialTaxAmount = 0;
  let provincialTaxName = "";
  const warnings: string[] = [];

  if (shipmentType === "personal") {
    provincialTaxRate = provinceInfo.rate;
    if (provinceInfo.type === "HST") {
      gstRate = GST_RATE + provinceInfo.rate;
      gstAmount = taxableBase * gstRate;
      gstLabel = "HST";
    } else if (provinceInfo.type === "GST+PST") {
      provincialTaxAmount = taxableBase * provinceInfo.rate;
      provincialTaxName = "PST";
      warnings.push("PST is shown for planning. Actual border collection can depend on the province of customs release and import stream; self-assessment may be required.");
    } else if (provinceInfo.type === "GST+QST") {
      provincialTaxAmount = taxableBase * provinceInfo.rate;
      provincialTaxName = "QST";
      warnings.push("QST is shown for planning. Confirm collection or self-assessment with Revenu Québec for the actual import stream.");
    }
  } else if (provinceInfo.rate > 0) {
    warnings.push(
      "Commercial imports are generally charged GST or the federal part of HST at the border. Provincial tax is not included here; self-assessment may apply depending on use and registration status.",
    );
    gstLabel = "GST / federal HST";
  }

  return {
    provinceInfo,
    gstRate,
    gstAmount,
    gstLabel,
    provincialTaxRate,
    provincialTaxAmount,
    provincialTaxName,
    totalTax: gstAmount + provincialTaxAmount,
    warnings,
  };
}

export interface DutyResult {
  duty: number;
  warnings: string[];
  requiresManualReview: boolean;
}

function unitsForRate(quantity: number, sourceUnit: string | null | undefined, rateUnit: string) {
  const source = (sourceUnit || "").toUpperCase();
  if (rateUnit === "kg") {
    if (!source || source === "KGM" || source === "KG") return quantity;
    if (source === "TNE" || source === "TONNE") return quantity * 1000;
  }
  if (rateUnit === "tonne") {
    if (source === "KGM" || source === "KG") return quantity / 1000;
    if (!source || source === "TNE" || source === "TONNE") return quantity;
  }
  if (rateUnit === "litre") {
    if (!source || source === "LTR" || source === "LITRE") return quantity;
    if (source === "HLT" || source === "HL") return quantity * 100;
  }
  if (rateUnit === "hl") {
    if (source === "LTR" || source === "LITRE") return quantity / 100;
    if (!source || source === "HLT" || source === "HL") return quantity;
  }
  if (rateUnit === "dozen") {
    if (source === "NMB" || source === "EACH") return quantity / 12;
    if (!source || source === "DZN" || source === "DOZEN") return quantity;
  }
  if (rateUnit === "each") {
    if (source === "DZN" || source === "DOZEN") return quantity * 12;
    if (!source || source === "NMB" || source === "EACH") return quantity;
  }
  return null;
}

function parseSpecific(rate: string, quantity: number, unitOfMeasure?: string | null) {
  const match = rate.match(/(\$)?\s*([\d.]+)\s*(¢)?\s*\/?\s*(kg|litre|tonne|hl|dozen|each)/i);
  if (!match) return null;
  const rateUnit = match[4].toLowerCase();
  const units = unitsForRate(quantity, unitOfMeasure, rateUnit);
  if (units == null) return { amount: 0, supported: false, rateUnit };
  const amountPerUnit = Number(match[2]) * (match[3] ? 0.01 : 1);
  return { amount: amountPerUnit * units, supported: true, rateUnit };
}

export function calculateDutyAmount(
  rateString: string,
  valueCAD: number,
  quantity: number,
  unitOfMeasure?: string | null,
): DutyResult {
  const rate = (rateString || "").trim();
  if (!rate || /^N\/A$/i.test(rate)) {
    return {
      duty: 0,
      warnings: ["This tariff rate requires manual review or a quota/authorization check."],
      requiresManualReview: true,
    };
  }
  if (/^free$/i.test(rate)) return { duty: 0, warnings: [], requiresManualReview: false };

  const percentMatches = [...rate.matchAll(/([\d.]+)\s*%/g)].map((match) => Number(match[1]));
  const adValorem = percentMatches.reduce((total, percent) => total + valueCAD * percent / 100, 0);
  const specific = parseSpecific(rate, quantity, unitOfMeasure);
  const warnings: string[] = [];

  if (specific && quantity <= 0) {
    return {
      duty: adValorem,
      warnings: [`Quantity is required because this rate includes an amount per ${specific.rateUnit}.`],
      requiresManualReview: true,
    };
  }
  if (specific && !specific.supported) {
    return {
      duty: adValorem,
      warnings: [`The tariff uses a ${specific.rateUnit} quantity basis, but the selected classification reports ${unitOfMeasure || "an unspecified unit"}. Confirm the correct quantity manually.`],
      requiresManualReview: true,
    };
  }
  if (/or more than|absolute ethyl alcohol/i.test(rate) || (percentMatches.length > 1 && /not less than/i.test(rate))) {
    return {
      duty: Math.max(adValorem, specific?.amount || 0),
      warnings: [`The compound rate “${rate}” needs manual review. The displayed amount is only a preliminary estimate.`],
      requiresManualReview: true,
    };
  }

  let duty: number;
  if (/but not less than/i.test(rate) && specific && percentMatches.length) {
    duty = Math.max(adValorem, specific.amount);
  } else if (/plus/i.test(rate) && specific) {
    duty = adValorem + specific.amount;
  } else if (specific) {
    duty = specific.amount;
  } else if (percentMatches.length) {
    duty = adValorem;
  } else {
    duty = 0;
    warnings.push(`The duty format “${rate}” is not safely supported and must be reviewed manually.`);
  }

  return { duty, warnings, requiresManualReview: warnings.length > 0 };
}

export function calculateCarmSecurity(highestMonthlyReceivable: number, premiumRate = 0.015) {
  const amount = Math.max(0, highestMonthlyReceivable);
  const half = amount * 0.5;
  const uncappedWrittenSecurity = Math.max(5000, Math.ceil(half / 100) * 100);
  const writtenSecurity = Math.min(10_000_000, uncappedWrittenSecurity);
  return {
    writtenSecurity,
    cashSecurity: amount,
    minimumApplied: half < 5000,
    maximumApplied: uncappedWrittenSecurity > 10_000_000,
    estimatedAnnualPremium: Math.round(writtenSecurity * premiumRate),
  };
}
