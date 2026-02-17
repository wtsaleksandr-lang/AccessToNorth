import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Create Registration
  app.post(api.registrations.create.path, async (req, res) => {
    try {
      const input = api.registrations.create.input.parse(req.body);
      const registration = await storage.createRegistration(input);
      res.status(201).json(registration);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // Get Status (Mock Portal Lookup)
  app.get(api.registrations.getStatus.path, async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const results = await storage.getRegistrationsByEmail(email);
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Submit Contact Form
  app.post(api.contact.submit.path, async (req, res) => {
    try {
      const input = api.contact.submit.input.parse(req.body);
      await storage.createContact(input);
      res.status(201).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // Seed Data
  async function seedDatabase() {
    const existing = await storage.getRegistrationsByEmail("demo@example.com");
    if (existing.length === 0) {
      console.log("Seeding database...");
      await storage.createRegistration({
        businessName: "Demo Company Inc.",
        email: "demo@example.com",
        packageType: "standard",
        status: "processing",
        isNonResident: false,
      });
      await storage.createRegistration({
        businessName: "Global Tech Ltd.",
        email: "international@example.com",
        packageType: "non-resident",
        status: "completed",
        isNonResident: true,
      });
      console.log("Database seeded!");
    }
  }

  // Run seeding asynchronously
  seedDatabase().catch(console.error);

  return httpServer;
}
