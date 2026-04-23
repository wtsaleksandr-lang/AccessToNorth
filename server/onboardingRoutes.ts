/**
 * Public onboarding intake routes. Accessed via the token link emailed to
 * the client after checkout — no auth, just token verification.
 *
 *   GET  /api/onboarding/:token        → return form schema + current responses
 *   POST /api/onboarding/:token        → submit/update responses
 *
 * The submit handler also stamps an activity-log entry and kicks off the
 * (stubbed) AI onboarding processor.
 */
import type { Express, Request, Response } from "express";
import { z } from "zod";
import * as crm from "./crmStorage";
import { getOnboardingFormSchema } from "./onboardingForms";

const submitSchema = z.object({
  responses: z.record(z.string(), z.any()),
  finalize: z.boolean().optional(),
});

export function registerOnboardingRoutes(app: Express): void {
  app.get("/api/onboarding/:token", async (req: Request, res: Response) => {
    try {
      const submission = await crm.getOnboardingByToken(req.params.token);
      if (!submission) {
        return res.status(404).json({ message: "Onboarding link not found" });
      }
      if (submission.tokenExpiresAt && new Date(submission.tokenExpiresAt) < new Date()) {
        return res.status(410).json({ message: "Onboarding link has expired. Please contact support." });
      }

      const service = await crm.getClientServiceById(submission.clientServiceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Mark as viewed on first load
      if (submission.status === "sent") {
        await crm.markOnboardingStatus(submission.id, "viewed", { viewedAt: new Date() });
      }

      const formSchema = getOnboardingFormSchema(service.serviceKey);

      res.json({
        submissionId: submission.id,
        serviceKey: service.serviceKey,
        serviceName: service.serviceName,
        status: submission.status,
        submittedAt: submission.submittedAt,
        responses: submission.responses ?? {},
        form: formSchema,
      });
    } catch (err) {
      console.error("Onboarding GET error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/onboarding/:token", async (req: Request, res: Response) => {
    try {
      const { responses, finalize } = submitSchema.parse(req.body);

      const submission = await crm.getOnboardingByToken(req.params.token);
      if (!submission) {
        return res.status(404).json({ message: "Onboarding link not found" });
      }
      if (submission.tokenExpiresAt && new Date(submission.tokenExpiresAt) < new Date()) {
        return res.status(410).json({ message: "Onboarding link has expired. Please contact support." });
      }
      if (submission.status === "submitted" || submission.status === "processed") {
        // Allow resubmit until submitted+final; once submitted, it's locked.
        if (!finalize) {
          return res.status(409).json({ message: "Onboarding already submitted. Contact support for changes." });
        }
      }

      const nextStatus: "viewed" | "submitted" = finalize ? "submitted" : "viewed";
      const extras = finalize
        ? { responses, submittedAt: new Date() }
        : { responses };

      await crm.markOnboardingStatus(submission.id, nextStatus, extras);

      if (finalize) {
        const service = await crm.getClientServiceById(submission.clientServiceId);
        if (service) {
          await crm.logActivity({
            clientId: service.clientId,
            clientServiceId: service.id,
            actorType: "system",
            action: "onboarding.submitted",
            message: `Onboarding submitted for ${service.serviceName}`,
          });

          // Auto-advance the "Collect onboarding intake" task to delivered.
          const tasks = await crm.listTasksForClientService(service.id);
          const intakeTask = tasks.find((t) =>
            t.title.toLowerCase().includes("intake"),
          );
          if (intakeTask && intakeTask.status !== "delivered") {
            await crm.updateTaskStatus(intakeTask.id, "delivered");
            await crm.logActivity({
              clientId: service.clientId,
              clientServiceId: service.id,
              taskId: intakeTask.id,
              actorType: "system",
              action: "task.delivered",
              message: `Intake task auto-completed from onboarding submission`,
            });
          }

          // Advance client_service from onboarding → in_progress.
          if (service.status === "onboarding" || service.status === "pending") {
            await crm.updateClientServiceStatus(service.id, "in_progress", {
              startedAt: new Date(),
            });
          }

          // Fire-and-forget AI processor (stub — see onboardingAI.ts).
          try {
            const { processOnboardingSubmission } = await import("./onboardingAI");
            await processOnboardingSubmission(submission.id);
          } catch (aiErr) {
            console.error("[onboarding] AI processor failed (non-fatal):", aiErr);
          }
        }
      }

      res.json({ success: true, status: nextStatus });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Onboarding POST error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
