import { pgTable, text, serial, timestamp, boolean, jsonb, uuid, real, integer } from "drizzle-orm/pg-core";
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

export interface ClassificationOrderData {
  productName: string;
  productDescription: string;
  countryOfOrigin: string;
  industryCategory: string;
  hsCodesRequested: number;
  additionalNotes: string;
  companyName: string;
  phone: string;
  packageTier: string;
  packagePrice: string;
  deliveryTime: string;
}

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  serviceType: text("service_type").notNull(),
  status: text("status").notNull().default("In Progress"),
  steps: jsonb("steps").notNull().$type<OrderStep[]>(),
  stripeSessionId: text("stripe_session_id"),
  metadata: jsonb("metadata").$type<ClassificationOrderData>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: text("order_id").notNull().references(() => orders.id),
  fileName: text("file_name").notNull(),
  fileData: text("file_data").notNull(),
  fileSize: text("file_size"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: text("order_id").notNull().references(() => orders.id),
  sender: text("sender").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export interface OrderStep {
  label: string;
  state: "done" | "working" | "upcoming";
}

export const insertRegistrationSchema = createInsertSchema(registrations).omit({ 
  id: true, 
  status: true, 
  createdAt: true 
});

export const insertContactSchema = createInsertSchema(contacts).omit({ 
  id: true, 
  createdAt: true 
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const carmLeads = pgTable("carm_leads", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  companyName: text("company_name").notNull(),
  importValueRange: text("import_value_range").notNull(),
  currentlyImporting: boolean("currently_importing").notNull(),
  phone: text("phone"),
  highestMonthlyPayable: text("highest_monthly_payable"),
  bondEstimate: text("bond_estimate"),
  cashEstimate: text("cash_estimate"),
  applyMinimum: boolean("apply_minimum"),
  frequency: text("frequency"),
  isNonResident: boolean("is_non_resident"),
  priority: text("priority").notNull().default("normal"),
  source: text("source").notNull().default("carm-security-calculator"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCarmLeadSchema = createInsertSchema(carmLeads).omit({
  id: true,
  createdAt: true,
});

export type CarmLead = typeof carmLeads.$inferSelect;
export type InsertCarmLead = z.infer<typeof insertCarmLeadSchema>;

export type RegistrationResponse = Registration;

export const hsCodeCategories = pgTable("hs_code_categories", {
  id: serial("id").primaryKey(),
  chapter: text("chapter").notNull(),
  heading: text("heading"),
  description: text("description").notNull(),
});

export const hsCodes = pgTable("hs_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  descriptionFull: text("description_full"),
  chapter: text("chapter").notNull(),
  unitOfMeasure: text("unit_of_measure"),
  dutyRates: jsonb("duty_rates").notNull().$type<Record<string, string>>(),
});

export const tariffCountries = pgTable("tariff_countries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  treatments: text("treatments").array().notNull(),
});

export const customsLeads = pgTable("customs_leads", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  companyName: text("company_name"),
  phone: text("phone"),
  hsCode: text("hs_code"),
  countryOfOrigin: text("country_of_origin"),
  goodsValue: text("goods_value"),
  calculatedDuty: text("calculated_duty"),
  source: text("source").notNull().default("customs-calculator"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomsLeadSchema = createInsertSchema(customsLeads).omit({
  id: true,
  createdAt: true,
});

export type HsCode = typeof hsCodes.$inferSelect;
export type TariffCountry = typeof tariffCountries.$inferSelect;
export type CustomsLead = typeof customsLeads.$inferSelect;
export type InsertCustomsLead = z.infer<typeof insertCustomsLeadSchema>;
