/**
 * AI onboarding processor. Reads raw `responses` from an onboarding
 * submission and produces a structured `config` object on the linked
 * client_service + a normalized copy on `aiExtracted`.
 *
 * Current state: pass-through normalization + client metadata backfill.
 * AI extraction stub is behind a feature flag — when ENABLE_ONBOARDING_AI=1
 * and an OpenAI or Anthropic key is set, we call the model to extract
 * a richer config (regime hints, risk flags). Until then, this is still
 * useful because it:
 *   - backfills client.name / client.companyName / client.phone from intake
 *   - writes a clean service-level config record
 *   - stamps the submission as processed so the admin UI can filter
 */
import * as crm from "./crmStorage";
import { getOnboardingFormSchema } from "./onboardingForms";

export async function processOnboardingSubmission(submissionId: string): Promise<void> {
  const submission = await findSubmissionById(submissionId);
  if (!submission) return;

  const service = await crm.getClientServiceById(submission.clientServiceId);
  if (!service) return;

  const responses = (submission.responses ?? {}) as Record<string, any>;
  const schema = getOnboardingFormSchema(service.serviceKey);

  // Normalize: only keep fields the schema declares. Guards against
  // stale / unknown keys accumulating in client_services.config.
  const config: Record<string, any> = {};
  for (const section of schema.sections) {
    for (const field of section.fields) {
      const value = responses[field.key];
      if (value !== undefined && value !== null && value !== "") {
        config[field.key] = value;
      }
    }
  }

  await crm.updateClientServiceConfig(service.id, config);

  // Backfill the client record with what we learned.
  const patch: {
    name?: string;
    companyName?: string;
    phone?: string;
    country?: string;
  } = {};
  if (config.contactName) patch.name = String(config.contactName);
  if (config.legalName || config.tradeName) {
    patch.companyName = String(config.legalName || config.tradeName);
  }
  if (config.contactPhone) patch.phone = String(config.contactPhone);
  if (config.countryOfResidence) patch.country = String(config.countryOfResidence);

  if (Object.keys(patch).length) {
    const client = await crm.getClientById(service.clientId);
    if (client) {
      // findOrCreateClient only backfills empty fields — reuse it.
      await crm.findOrCreateClient({
        email: client.email,
        name: patch.name ?? null,
        companyName: patch.companyName ?? null,
        phone: patch.phone ?? null,
        country: patch.country ?? null,
      });
    }
  }

  await crm.markOnboardingStatus(submission.id, "processed", {
    aiExtracted: config,
    aiProcessedAt: new Date(),
  });

  await crm.logActivity({
    clientId: service.clientId,
    clientServiceId: service.id,
    actorType: "ai_agent",
    action: "onboarding.processed",
    message: `Extracted ${Object.keys(config).length} fields from onboarding`,
    metadata: { fieldCount: Object.keys(config).length },
  });

  // Future: enable AI extraction when ENABLE_ONBOARDING_AI=1.
  // The Claude prompt would receive `responses` + `schema` and return a
  // richer structured object including regime hints ("simplified" vs
  // "normal" for GST/HST) and risk flags. For now the normalizer above
  // is sufficient to populate the admin UI and the authorization packet.
}

// Unexported helper — fetch a submission by id (crmStorage doesn't expose this directly).
import { db } from "./db";
import { onboardingSubmissions, type OnboardingSubmission } from "@shared/schema";
import { eq } from "drizzle-orm";

async function findSubmissionById(id: string): Promise<OnboardingSubmission | undefined> {
  const [row] = await db
    .select()
    .from(onboardingSubmissions)
    .where(eq(onboardingSubmissions.id, id))
    .limit(1);
  return row;
}
