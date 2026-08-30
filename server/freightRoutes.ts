import crypto from "crypto";
import type { Express, NextFunction, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { freightEstimateRequestSchema, freightQuoteSchema, normalizeAccessToNorthId, shipmentTrackingSchema, summarizeFreightCargo } from "@shared/freight";
import type { FreightEstimateRequest } from "@shared/freight";
import type { FreightQuoteOrderData, OrderStep } from "@shared/schema";
import { storage } from "./storage";
import { getUploadBackend } from "./storage/uploadStorage";
import {
  buildFreightQuoteCustomerEmail,
  buildFreightQuoteInternalEmail,
  sendEmail,
} from "./emailService";
import { fetchFreightMarketEstimate } from "./freightMarketEstimate";

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const MAX_DOCUMENTS = 5;
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_SIZE, files: MAX_DOCUMENTS },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_DOCUMENT_TYPES.has(file.mimetype)) return callback(null, true);
    callback(new Error("Unsupported document type. Upload PDF, image, CSV, Excel, or Word files."));
  },
});

const ESTIMATE_CACHE_TTL_MS = 12 * 60 * 60 * 1_000;
const ESTIMATE_CACHE_MAX_ENTRIES = 500;
const estimateCache = new Map<string, { expiresAt: number; value: Awaited<ReturnType<typeof fetchFreightMarketEstimate>> }>();
let externalEstimateCalls: number[] = [];

function estimateCacheKey(input: FreightEstimateRequest) {
  const cargo = summarizeFreightCargo(input.cargoLines);
  const normalized = {
    mode: input.mode,
    origin: input.origin.trim().toLowerCase(),
    destination: input.destination.trim().toLowerCase(),
    service: input.service,
    equipmentQuantity: input.equipmentQuantity,
    weightKg: cargo.weightKg.toFixed(1),
    volumeCbm: cargo.volumeCbm.toFixed(2),
  };
  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

function reserveExternalEstimateCall() {
  const cutoff = Date.now() - 60 * 60 * 1_000;
  externalEstimateCalls = externalEstimateCalls.filter((time) => time > cutoff);
  if (externalEstimateCalls.length >= 90) return false;
  externalEstimateCalls.push(Date.now());
  return true;
}

function setCachedEstimate(key: string, value: Awaited<ReturnType<typeof fetchFreightMarketEstimate>>) {
  const now = Date.now();
  for (const [cacheKey, entry] of estimateCache) {
    if (entry.expiresAt <= now) estimateCache.delete(cacheKey);
  }
  if (estimateCache.size >= ESTIMATE_CACHE_MAX_ENTRIES) {
    const oldestKey = estimateCache.keys().next().value;
    if (oldestKey) estimateCache.delete(oldestKey);
  }
  estimateCache.set(key, { expiresAt: now + ESTIMATE_CACHE_TTL_MS, value });
}

function createRateLimiter(maxRequests: number, windowMs = 60_000) {
  const requests = new Map<string, number[]>();
  return (req: Request, res: Response) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const recent = (requests.get(key) || []).filter((time) => now - time < windowMs);
    if (recent.length >= maxRequests) {
      res.status(429).json({ message: "Too many requests. Please wait a minute and try again." });
      return false;
    }
    recent.push(now);
    requests.set(key, recent);
    return true;
  };
}

async function generateRequestId() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const suffix = crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
    const requestId = `RFQ-${suffix}`;
    if (!(await storage.getOrderById(requestId))) return requestId;
  }
  throw new Error("Could not create a unique freight request reference");
}

export function registerFreightRoutes(app: Express) {
  const acceptQuoteRequest = createRateLimiter(4);
  const acceptEstimateRequest = createRateLimiter(8);
  const acceptTrackingRequest = createRateLimiter(15);

  const limitQuoteUpload = (req: Request, res: Response, next: NextFunction) => {
    if (acceptQuoteRequest(req, res)) next();
  };
  const receiveQuoteDocuments = (req: Request, res: Response, next: NextFunction) => {
    upload.array("documents", MAX_DOCUMENTS)(req, res, (error) => {
      if (error) {
        const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "Each document must be 10 MB or smaller."
          : error instanceof multer.MulterError && error.code === "LIMIT_FILE_COUNT"
            ? `Upload no more than ${MAX_DOCUMENTS} documents.`
            : error instanceof Error ? error.message : "The documents could not be uploaded.";
        return res.status(400).json({ message });
      }
      next();
    });
  };

  app.post("/api/freight-estimate", async (req, res) => {
    try {
      if (!acceptEstimateRequest(req, res)) return;
      const input = freightEstimateRequestSchema.parse(req.body);
      const cacheKey = estimateCacheKey(input);
      const cached = estimateCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        res.setHeader("Cache-Control", "private, max-age=300");
        return res.json({ ...cached.value, cached: true });
      }
      if (!reserveExternalEstimateCall()) {
        return res.status(503).json({
          message: "The public market feed has reached its hourly capacity. Submit the shipment for a verified quote or try again later.",
          canRequestQuote: true,
        });
      }
      const result = await fetchFreightMarketEstimate(input);
      setCachedEstimate(cacheKey, result);
      res.setHeader("Cache-Control", "private, max-age=300");
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
          canRequestQuote: true,
        });
      }
      console.error("Freight market estimate failed:", error);
      res.status(502).json({
        message: "A public market estimate is not available for this route right now. You can still submit the shipment for a verified quote.",
        canRequestQuote: true,
      });
    }
  });

  app.post("/api/freight-quote", limitQuoteUpload, receiveQuoteDocuments, async (req, res) => {
    try {
      const rawRequest = typeof req.body.request === "string" ? JSON.parse(req.body.request) : req.body;
      const input = freightQuoteSchema.parse(rawRequest);
      const requestId = await generateRequestId();
      const files = (req.files || []) as Express.Multer.File[];
      const cargoSummary = summarizeFreightCargo(input.cargoLines);
      const metadata: FreightQuoteOrderData = {
        requestType: "freight-quote",
        mode: input.mode,
        direction: input.direction,
        serviceLevel: input.serviceLevel,
        origin: input.origin,
        destination: input.destination,
        readyDate: input.readyDate,
        incoterm: input.incoterm,
        commodity: input.commodity,
        cargoLines: input.cargoLines,
        cargoSummary,
        stackable: input.stackable,
        hazardous: input.hazardous,
        temperatureControlled: input.temperatureControlled,
        temperatureC: input.temperatureC ?? null,
        notes: input.notes,
        companyName: input.companyName,
        phone: input.phone,
        documentCount: files.length,
      };
      const steps: OrderStep[] = [
        { label: "Request received", state: "done" },
        { label: "Shipment details under review", state: "working" },
        { label: "Quote prepared", state: "upcoming" },
        { label: "Carrier confirmation", state: "upcoming" },
      ];

      await storage.createOrder({
        id: requestId,
        customerEmail: input.email.toLowerCase(),
        customerName: input.contactName,
        serviceType: "Freight Quote Request",
        status: "Pending Review",
        steps,
        stripeSessionId: null,
        metadata,
      });

      if (files.length > 0) {
        const backend = getUploadBackend();
        for (const file of files) {
          const location = await backend.put({
            buffer: file.buffer,
            contentType: file.mimetype,
            fileNameHint: file.originalname,
          });
          await storage.createUpload({
            orderId: requestId,
            fileName: file.originalname,
            fileData: location.kind === "db-base64" ? location.fileData : "",
            storageKey: location.kind === "external" ? location.storageKey : null,
            fileSize: String(file.size),
            mimeType: file.mimetype,
          });
        }
      }

      const [customerSent, internalSent] = await Promise.all([
        sendEmail(buildFreightQuoteCustomerEmail(requestId, input, files.length)),
        sendEmail(buildFreightQuoteInternalEmail(requestId, input, cargoSummary, files.length)),
      ]);
      if (customerSent || internalSent) {
        await storage.updateOrderMetadata(requestId, {
          ...(customerSent ? { confirmationEmailSentAt: new Date() } : {}),
          ...(internalSent ? { internalEmailSentAt: new Date() } : {}),
        });
      }

      res.status(201).json({
        success: true,
        requestId,
        documentsAccepted: files.length,
        portalUrl: "/portal",
        confirmationEmailSent: customerSent,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      if (error instanceof SyntaxError) {
        return res.status(400).json({ message: "The quote request could not be read." });
      }
      console.error("Freight quote request failed:", error);
      res.status(500).json({ message: "Could not save the quote request. Please try again." });
    }
  });

  app.post("/api/shipment-tracking", async (req, res) => {
    try {
      if (!acceptTrackingRequest(req, res)) return;
      const input = shipmentTrackingSchema.parse(req.body);
      const trackingId = normalizeAccessToNorthId(input.trackingId);
      const order = await storage.getOrderByIdAndEmail(trackingId, input.email.toLowerCase());
      res.setHeader("Cache-Control", "private, no-store");
      if (!order) {
        return res.status(404).json({
          message: "No AccessToNorth request matched that ID and email. Check both entries and try again.",
        });
      }
      const uploads = await storage.getUploadsByOrderId(order.id);
      res.json({
        trackingId: order.id,
        serviceType: order.serviceType,
        status: order.status,
        steps: order.steps,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        deliveredAt: order.deliveredAt,
        documentCount: uploads.length,
        portalAvailable: true,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Shipment tracking lookup failed:", error);
      res.status(500).json({ message: "Tracking is temporarily unavailable. Please try again shortly." });
    }
  });
}
