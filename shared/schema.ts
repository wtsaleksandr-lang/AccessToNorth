import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  businessName: text("business_name").notNull(),
  residentStatus: text("resident_status").notNull().default("canadian"),
  packageType: text("package_type").notNull(),
  businessType: text("business_type"),
  estimatedRevenue: text("estimated_revenue"),
  notes: text("notes"),
  authorizationConsent: boolean("authorization_consent").notNull().default(false),
  status: text("status").notNull().default("pending"),
  isNonResident: boolean("is_non_resident").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({ 
  id: true, 
  status: true, 
  createdAt: true 
});

export const insertContactSchema = createInsertSchema(contacts).omit({ 
  id: true, 
  createdAt: true 
});

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type RegistrationResponse = Registration;
