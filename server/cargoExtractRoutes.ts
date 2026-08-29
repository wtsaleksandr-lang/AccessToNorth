import type { Express, Request, Response } from "express";
import multer from "multer";
import OpenAI from "openai";
import { createRateLimiter } from "./middleware/rateLimit";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const cargoExtractRateLimiter = createRateLimiter({
  max: 15,
  windowMs: 15 * 60 * 1000,
  message: "Too many document imports. Please try again in a few minutes.",
});

const SUPPORTED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "rtf", "odt",
  "ppt", "pptx",
  "txt", "text", "md", "markdown", "json", "xml", "html", "htm", "eml",
  "csv", "tsv", "xls", "xlsx",
  "jpg", "jpeg", "png", "webp", "gif",
]);

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return _openai;
}
const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as any)[prop];
  },
});

const EXTRACTION_PROMPT = `You are an expert freight packing-list analyst.
Extract every cargo/item row from the uploaded packing list, invoice, email, spreadsheet, presentation, or shipping document. For each item, extract:
- name: item description/name
- length: numeric length dimension
- width: numeric width dimension
- height: numeric height dimension
- weight: TOTAL GROSS WEIGHT for the full row, across all units in that row
- quantity: number of units (default 1 if not specified)
- stackable: true only if the document explicitly confirms the cargo can be stacked; otherwise false
- rotationMode: "horizontal" unless the document explicitly allows turning cargo on its side; use "all" only when clearly allowed, or "fixed" when orientation is fixed

Also determine the unit system used in the document:
- "imperial" if dimensions are in inches and weight in lbs/pounds
- "metric" if dimensions are in cm/mm and weight in kg

Weight rules:
- A statement such as "7 pallets" followed by "Total GW 5260 kg" means quantity 7 and weight 5260, NOT 5260 per pallet.
- If only a per-unit weight is provided, multiply it by quantity to produce the row's total weight.
- If there is one item row and a separate grand total weight, assign that grand total to the row.
- Never multiply a stated total/gross weight by quantity again.

Return ONLY valid JSON in this exact format, no other text:
{
  "units": "imperial" or "metric",
  "items": [
    { "name": "Item Name", "length": 10, "width": 8, "height": 6, "weight": 50, "quantity": 2, "stackable": false, "rotationMode": "horizontal" }
  ],
  "warnings": []
}

If dimensions appear to be in mm, convert to cm. If weight appears to be in grams, convert to kg.
If you cannot find dimensional data, return: { "units": "imperial", "items": [], "warnings": ["No dimensional data found"] }
Extract every row you can find. Be thorough.`;

export function registerCargoExtractRoutes(app: Express): void {
  app.post(
    "/api/cargo/extract",
    cargoExtractRateLimiter,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { mimetype, buffer, originalname } = req.file;
        const extension = originalname.split(".").pop()?.toLowerCase() || "";
        const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)
          || ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimetype);
        const isPdf = extension === "pdf" || mimetype === "application/pdf";

        if (!SUPPORTED_EXTENSIONS.has(extension) && !isImage && !isPdf) {
          return res.status(400).json({
            error: "Unsupported file type. Upload a common document, spreadsheet, PDF, email, text, or image file.",
          });
        }

        const base64 = buffer.toString("base64");
        const dataUrl = `data:${mimetype};base64,${base64}`;

        const content: any[] = [
          { type: "input_text", text: EXTRACTION_PROMPT },
          isImage
            ? { type: "input_image", image_url: dataUrl, detail: "high" }
            : {
                type: "input_file",
                filename: originalname,
                file_data: dataUrl,
                ...(isPdf ? { detail: "high" } : {}),
              },
        ];

        const response = await openai.responses.create({
          model: process.env.CARGO_EXTRACT_MODEL || "gpt-4o",
          input: [
            {
              role: "user",
              content,
            },
          ],
          max_output_tokens: 4096,
        });

        const text = response.output_text || "";

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return res.status(422).json({
            error: "Could not extract cargo data from this document. Try a clearer image or a different format.",
          });
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (!parsed.items || !Array.isArray(parsed.items)) {
          return res.status(422).json({
            error: "No items found in the document.",
          });
        }

        const items = parsed.items.map((item: any) => ({
          name: String(item.name || "").substring(0, 100),
          length: Math.max(0, Number(item.length) || 0),
          width: Math.max(0, Number(item.width) || 0),
          height: Math.max(0, Number(item.height) || 0),
          weight: Math.max(0, Number(item.weight) || 0),
          quantity: Math.min(10000, Math.max(1, Math.round(Number(item.quantity) || 1))),
          stackable: item.stackable === true,
          rotationMode: ["all", "horizontal", "fixed"].includes(item.rotationMode)
            ? item.rotationMode
            : "horizontal",
        }));

        res.json({
          units: parsed.units === "metric" ? "metric" : "imperial",
          items,
          warnings: Array.isArray(parsed.warnings)
            ? parsed.warnings.map((warning: unknown) => String(warning).substring(0, 200)).slice(0, 10)
            : [],
        });
      } catch (error: any) {
        console.error("Cargo extraction error:", error);
        if (error.status === 429) {
          return res.status(429).json({ error: "Rate limited. Please try again in a moment." });
        }
        res.status(500).json({
          error: "Failed to extract cargo data. Please try again.",
        });
      }
    }
  );
}
