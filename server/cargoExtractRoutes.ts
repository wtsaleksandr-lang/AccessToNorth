import type { Express, Request, Response } from "express";
import multer from "multer";
import OpenAI from "openai";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

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

const EXTRACTION_PROMPT = `You are an expert at reading packing lists, invoices, shipping documents, and dimension tables.
Extract all cargo/item rows from this document image. For each item, extract:
- name: item description/name
- length: numeric length dimension
- width: numeric width dimension
- height: numeric height dimension
- weight: numeric weight per unit
- quantity: number of units (default 1 if not specified)

Also determine the unit system used in the document:
- "imperial" if dimensions are in inches and weight in lbs/pounds
- "metric" if dimensions are in cm/mm and weight in kg

Return ONLY valid JSON in this exact format, no other text:
{
  "units": "imperial" or "metric",
  "items": [
    { "name": "Item Name", "length": 10, "width": 8, "height": 6, "weight": 25, "quantity": 2 }
  ]
}

If dimensions appear to be in mm, convert to cm. If weight appears to be in grams, convert to kg.
If you cannot find any dimensional data, return: { "units": "imperial", "items": [] }
Extract every row you can find. Be thorough.`;

export function registerCargoExtractRoutes(app: Express): void {
  app.post(
    "/api/cargo/extract",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { mimetype, buffer } = req.file;

        const isImage = mimetype.startsWith("image/");
        const isPdf = mimetype === "application/pdf";

        if (!isImage && !isPdf) {
          return res.status(400).json({
            error: "Unsupported file type. Please upload an image (JPG, PNG) or PDF.",
          });
        }

        const base64 = buffer.toString("base64");
        const dataUrl = `data:${mimetype};base64,${base64}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: EXTRACTION_PROMPT },
                {
                  type: "image_url",
                  image_url: { url: dataUrl, detail: "high" },
                },
              ],
            },
          ],
          max_tokens: 4096,
          temperature: 0.1,
        });

        const text = response.choices[0]?.message?.content || "";

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
          quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
        }));

        res.json({
          units: parsed.units === "metric" ? "metric" : "imperial",
          items,
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
