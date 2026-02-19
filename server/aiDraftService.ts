import OpenAI from "openai";
import type { ClassificationOrderData, Order, Upload } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const MODEL = "gpt-4o";

function buildPrompt(order: Order, uploads: Upload[]): string {
  const meta = order.metadata as ClassificationOrderData | null;
  if (!meta) {
    throw new Error("Order has no classification metadata");
  }

  const uploadList = uploads
    .map((u) => `- ${u.fileName} (${u.mimeType || "unknown type"}, ${u.fileSize ? Math.round(parseInt(u.fileSize) / 1024) + " KB" : "unknown size"})`)
    .join("\n");

  return `You are an expert Canadian customs and trade compliance analyst working for AccessToNorth.com. Generate a professional HS Code Classification Report draft based on the following order details.

ORDER INFORMATION:
- Order ID: ${order.id}
- Customer: ${order.customerName || "N/A"} (${order.customerEmail})
- Company: ${meta.companyName || "N/A"}
- Package Tier: ${meta.packageTier} (${meta.packagePrice})
- HS Codes Requested: Up to ${meta.hsCodesRequested}
- Delivery Timeline: ${meta.deliveryTime}

PRODUCT DETAILS:
- Product Name: ${meta.productName}
- Product Description: ${meta.productDescription || "Not provided"}
- Country of Origin: ${meta.countryOfOrigin}
- Industry Category: ${meta.industryCategory || "Not specified"}

ADDITIONAL NOTES FROM CUSTOMER:
${meta.additionalNotes || "None provided"}

UPLOADED DOCUMENTS:
${uploadList || "No documents uploaded"}

INSTRUCTIONS:
Generate a structured classification report with these exact sections:

## Section 1: Executive Summary
Brief overview of the classification findings.

## Section 2: Product Analysis
Detailed analysis of the product based on the provided description, documents, and any relevant technical specifications.

## Section 3: HS Code Classification
For each classified product/variant (up to ${meta.hsCodesRequested}):
- Recommended 10-digit HS Code
- Code description from the Canadian Customs Tariff
- Chapter and heading rationale
- Applicable tariff treatment codes (MFN, UST, CPTPT, etc. as relevant based on country of origin: ${meta.countryOfOrigin})
- Estimated duty rate

## Section 4: Regulatory Notes
Any relevant import requirements, permits, certifications, or restrictions (e.g., CFIA, Health Canada, CARM requirements).

## Section 5: Missing Information / Recommendations
If any information is insufficient for a definitive classification, list specific questions or documents needed from the customer. If everything is sufficient, state that the classification is complete.

FORMAT RULES:
- Use Markdown formatting
- Be professional and thorough
- Include disclaimers that this is a draft for internal review
- Reference the Canadian Customs Tariff Schedule
- Note that final classification should be verified by a licensed customs broker`;
}

export async function generateDraftReport(
  order: Order,
  uploads: Upload[]
): Promise<{ draft: string; model: string }> {
  const prompt = buildPrompt(order, uploads);

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a Canadian customs classification expert. Generate accurate, professional HS code classification reports. Always use proper Canadian Customs Tariff terminology and 10-digit HS codes.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const draft = completion.choices[0]?.message?.content;
  if (!draft) {
    throw new Error("AI returned empty response");
  }

  const modelUsed = completion.model || MODEL;

  return { draft, model: modelUsed };
}

export function extractMissingInfoQuestions(draftReport: string): string[] {
  const section5Match = draftReport.match(
    /##\s*Section\s*5[:\s]*(.*?)(?=##|$)/is
  );
  if (!section5Match) return [];

  const section5 = section5Match[1];

  const lines = section5.split("\n").filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 10 &&
      (trimmed.startsWith("-") ||
        trimmed.startsWith("*") ||
        trimmed.match(/^\d+[\.\)]/)) &&
      (trimmed.includes("?") ||
        trimmed.toLowerCase().includes("provide") ||
        trimmed.toLowerCase().includes("need") ||
        trimmed.toLowerCase().includes("required") ||
        trimmed.toLowerCase().includes("missing") ||
        trimmed.toLowerCase().includes("clarif") ||
        trimmed.toLowerCase().includes("specify") ||
        trimmed.toLowerCase().includes("confirm"))
    );
  });

  return lines.map((l) => l.replace(/^[-*\d.\)]+\s*/, "").trim());
}
