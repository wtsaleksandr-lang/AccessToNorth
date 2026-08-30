import { pgTable, text, serial, timestamp, boolean, jsonb, uuid, real, integer, index } from "drizzle-orm/pg-core";
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

export interface FreightQuoteOrderData {
  requestType: "freight-quote";
  mode: string;
  direction: string;
  serviceLevel: string;
  origin: string;
  destination: string;
  readyDate: string;
  incoterm: string;
  commodity: string;
  cargoLines: Array<Record<string, unknown>>;
  cargoSummary: { packages: number; weightKg: number; volumeCbm: number };
  stackable: boolean;
  hazardous: boolean;
  temperatureControlled: boolean;
  temperatureC?: number | null;
  notes: string;
  companyName: string;
  phone: string;
  documentCount: number;
}

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name"),
    serviceType: text("service_type").notNull(),
    status: text("status").notNull().default("In Progress"),
    steps: jsonb("steps").notNull().$type<OrderStep[]>(),
    stripeSessionId: text("stripe_session_id"),
    metadata: jsonb("metadata").$type<ClassificationOrderData | FreightQuoteOrderData>(),
    confirmationEmailSentAt: timestamp("confirmation_email_sent_at"),
    internalEmailSentAt: timestamp("internal_email_sent_at"),
    reportFileId: text("report_file_id"),
    reportToken: text("report_token"),
    reportTokenExpiresAt: timestamp("report_token_expires_at"),
    deliveredAt: timestamp("delivered_at"),
    aiDraftReport: text("ai_draft_report"),
    aiGeneratedAt: timestamp("ai_generated_at"),
    aiModelUsed: text("ai_model_used"),
    aiSummary: text("ai_summary"),
    aiClientUpdateDraft: text("ai_client_update_draft"),
    aiMissingDocs: text("ai_missing_docs"),
    aiNextSteps: text("ai_next_steps"),
    aiAssistGeneratedAt: timestamp("ai_assist_generated_at"),
    aiReadinessSnapshotText: text("ai_readiness_snapshot_text"),
    readinessSnapshotPdfId: text("readiness_snapshot_pdf_id"),
    readinessSnapshotSentAt: timestamp("readiness_snapshot_sent_at"),
    aiBrokerPackText: text("ai_broker_pack_text"),
    brokerPackPdfId: text("broker_pack_pdf_id"),
    brokerPackSentAt: timestamp("broker_pack_sent_at"),
    secureToken: text("secure_token"),
    secureTokenExpiresAt: timestamp("secure_token_expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    stripeSessionIdx: index("idx_orders_stripe_session_id").on(table.stripeSessionId),
    customerEmailIdx: index("idx_orders_customer_email").on(table.customerEmail),
  }),
);

export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: text("order_id").notNull().references(() => orders.id),
    fileName: text("file_name").notNull(),
    // file_data is the legacy base64 payload. New uploads may leave this as
    // "" when storageKey points to an external backend. Kept notNull +
    // default "" for backward-compat with existing rows.
    fileData: text("file_data").notNull().default(""),
    // storageKey points to the backend-owned object (e.g. local-disk filename,
    // S3 key). Null means the blob lives in fileData (DB-base64 backend).
    storageKey: text("storage_key"),
    fileSize: text("file_size"),
    mimeType: text("mime_type"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("idx_uploads_order_id").on(table.orderId),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: text("order_id").notNull().references(() => orders.id),
    sender: text("sender").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("idx_messages_order_id").on(table.orderId),
  }),
);

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

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id),
    serviceKey: text("service_key").notNull(),
    serviceName: text("service_name").notNull(),
    tier: text("tier"),
    priceCAD: integer("price_cad").notNull(),
    quantity: integer("quantity").notNull().default(1),
    status: text("status").notNull().default("Pending Details"),
    intakeData: jsonb("intake_data").$type<Record<string, any>>(),
    completedAt: timestamp("completed_at"),
    reminder1SentAt: timestamp("reminder_1_sent_at"),
    reminder2SentAt: timestamp("reminder_2_sent_at"),
    onHoldAt: timestamp("on_hold_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("idx_order_items_order_id").on(table.orderId),
  }),
);

export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  completedAt: true,
  reminder1SentAt: true,
  reminder2SentAt: true,
  onHoldAt: true,
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
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// ============================================================================
// SERVICE-DELIVERY LAYER
// ----------------------------------------------------------------------------
// The flat orders/orderItems tables above cover the billing/transaction side.
// The tables below model the actual WORK we do per purchased service:
// every service gets a client_services row with its own lifecycle, a set
// of fulfillment_tasks copied from a service_task_templates recipe at
// provision time, and an onboarding_submissions record for structured
// client intake. Every write is stamped in admin_activity_log with the
// actor_type (human/ai_agent/system).
// ============================================================================

/** Static catalog of serviceable SKUs — source of truth for delivery patterns. */
export const serviceCatalog = pgTable(
  "service_catalog",
  {
    id: serial("id").primaryKey(),
    serviceKey: text("service_key").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    deliveryPattern: text("delivery_pattern").notNull().default("one_time"),
    priceCAD: integer("price_cad").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    keyIdx: index("idx_service_catalog_key").on(t.serviceKey),
    categoryIdx: index("idx_service_catalog_category").on(t.category),
  }),
);

/** Deduplicated client identities. Every purchased service links here. */
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    name: text("name"),
    companyName: text("company_name"),
    phone: text("phone"),
    country: text("country"),
    status: text("status").notNull().default("lead"),
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    emailIdx: index("idx_clients_email").on(t.email),
    statusIdx: index("idx_clients_status").on(t.status),
  }),
);

/** Per-purchased-service delivery unit. One client_service = one deliverable. */
export const clientServices = pgTable(
  "client_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").notNull().references(() => clients.id),
    orderId: text("order_id").references(() => orders.id),
    orderItemId: integer("order_item_id").references(() => orderItems.id),
    serviceKey: text("service_key").notNull(),
    serviceName: text("service_name").notNull(),
    status: text("status").notNull().default("pending"),
    tier: text("tier"),
    priceCAD: integer("price_cad"),
    config: jsonb("config").$type<Record<string, any>>(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    welcomeSentAt: timestamp("welcome_sent_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    clientIdx: index("idx_client_services_client").on(t.clientId),
    orderIdx: index("idx_client_services_order").on(t.orderId),
    statusIdx: index("idx_client_services_status").on(t.status),
    serviceKeyIdx: index("idx_client_services_service_key").on(t.serviceKey),
  }),
);

/** Atomic fulfillment work units. Copied from templates at provision time. */
export const fulfillmentTasks = pgTable(
  "fulfillment_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientServiceId: uuid("client_service_id").notNull().references(() => clientServices.id),
    title: text("title").notNull(),
    description: text("description"),
    orderIndex: integer("order_index").notNull().default(0),
    status: text("status").notNull().default("not_started"),
    priority: text("priority").notNull().default("normal"),
    handledBy: text("handled_by").notNull().default("internal"),
    waitingOn: text("waiting_on"),
    assignedTo: integer("assigned_to").references(() => adminUsers.id),
    dueAt: timestamp("due_at"),
    startedAt: timestamp("started_at"),
    deliveredAt: timestamp("delivered_at"),
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    serviceIdx: index("idx_fulfillment_tasks_service").on(t.clientServiceId),
    statusIdx: index("idx_fulfillment_tasks_status").on(t.status),
    assignedIdx: index("idx_fulfillment_tasks_assigned").on(t.assignedTo),
  }),
);

/** Per-service recipe: the tasks we copy into fulfillment_tasks at provision. */
export const serviceTaskTemplates = pgTable(
  "service_task_templates",
  {
    id: serial("id").primaryKey(),
    serviceKey: text("service_key").notNull(),
    orderIndex: integer("order_index").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    defaultHandledBy: text("default_handled_by").notNull().default("internal"),
    defaultWaitingOn: text("default_waiting_on"),
    estimatedDays: integer("estimated_days"),
  },
  (t) => ({
    serviceKeyIdx: index("idx_task_templates_service_key").on(t.serviceKey),
  }),
);

/** Client intake form responses, tokenized for email-link access. */
export const onboardingSubmissions = pgTable(
  "onboarding_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientServiceId: uuid("client_service_id").notNull().references(() => clientServices.id),
    accessToken: text("access_token").notNull().unique(),
    tokenExpiresAt: timestamp("token_expires_at"),
    status: text("status").notNull().default("not_sent"),
    responses: jsonb("responses").$type<Record<string, any>>(),
    aiExtracted: jsonb("ai_extracted").$type<Record<string, any>>(),
    aiProcessedAt: timestamp("ai_processed_at"),
    sentAt: timestamp("sent_at"),
    viewedAt: timestamp("viewed_at"),
    submittedAt: timestamp("submitted_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    tokenIdx: index("idx_onboarding_token").on(t.accessToken),
    serviceIdx: index("idx_onboarding_service").on(t.clientServiceId),
  }),
);

// ============================================================================
// AI ASSISTANT MEMORY + THREADS
// ----------------------------------------------------------------------------
// chat_memory: anonymous-session or user-identified chat history with
// lightweight extracted signals. Shared across website chat, admin copilot,
// portal chat, and Vapi voice — one DB, one source of truth, one session
// id stitching mechanism.
// ============================================================================

export const chatMemory = pgTable(
  "chat_memory",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull().unique(),
    surface: text("surface").notNull().default("website"),
    /** If the visitor logs into the portal we link their session to client.id. */
    clientId: uuid("client_id").references(() => clients.id),
    messagesJson: jsonb("messages_json").$type<Array<{ role: string; content: string; timestamp?: string }>>().default([]),
    extractedSignals: jsonb("extracted_signals").$type<Record<string, any>>().default({}),
    lastSeenAt: timestamp("last_seen_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    sessionIdx: index("idx_chat_memory_session").on(t.sessionId),
    clientIdx: index("idx_chat_memory_client").on(t.clientId),
    lastSeenIdx: index("idx_chat_memory_last_seen").on(t.lastSeenAt),
  }),
);

/** Audit trail for every mutation. Stamps actor_type for AI/system/human separation. */
export const adminActivityLog = pgTable(
  "admin_activity_log",
  {
    id: serial("id").primaryKey(),
    clientId: uuid("client_id").references(() => clients.id),
    clientServiceId: uuid("client_service_id").references(() => clientServices.id),
    taskId: uuid("task_id").references(() => fulfillmentTasks.id),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    message: text("message"),
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    clientIdx: index("idx_activity_client").on(t.clientId),
    serviceIdx: index("idx_activity_service").on(t.clientServiceId),
    createdIdx: index("idx_activity_created").on(t.createdAt),
  }),
);

// Drizzle-zod inserts for the service-delivery layer
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertClientServiceSchema = createInsertSchema(clientServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  startedAt: true,
  completedAt: true,
  welcomeSentAt: true,
});
export const insertFulfillmentTaskSchema = createInsertSchema(fulfillmentTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  startedAt: true,
  deliveredAt: true,
});
export const insertOnboardingSubmissionSchema = createInsertSchema(onboardingSubmissions).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  viewedAt: true,
  submittedAt: true,
  aiProcessedAt: true,
});
export const insertAdminActivityLogSchema = createInsertSchema(adminActivityLog).omit({
  id: true,
  createdAt: true,
});

export type ServiceCatalog = typeof serviceCatalog.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type ClientService = typeof clientServices.$inferSelect;
export type InsertClientService = z.infer<typeof insertClientServiceSchema>;
export type FulfillmentTask = typeof fulfillmentTasks.$inferSelect;
export type InsertFulfillmentTask = z.infer<typeof insertFulfillmentTaskSchema>;
export type ServiceTaskTemplate = typeof serviceTaskTemplates.$inferSelect;
export type OnboardingSubmission = typeof onboardingSubmissions.$inferSelect;
export type InsertOnboardingSubmission = z.infer<typeof insertOnboardingSubmissionSchema>;
export type AdminActivityLogEntry = typeof adminActivityLog.$inferSelect;
export type InsertAdminActivityLogEntry = z.infer<typeof insertAdminActivityLogSchema>;

export type ChatMemory = typeof chatMemory.$inferSelect;
export const insertChatMemorySchema = createInsertSchema(chatMemory).omit({
  id: true,
  createdAt: true,
  lastSeenAt: true,
});
export type InsertChatMemory = z.infer<typeof insertChatMemorySchema>;

export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("admin"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_admin_users_email").on(table.email),
  }),
);

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

/**
 * Compliance-grade audit trail for admin mutations on the flat orders table.
 *
 * Distinct from admin_activity_log (which covers the service-delivery CRM layer:
 * clients / client_services / fulfillment_tasks). This table records every
 * change to an order, its progress steps, or messages tied to it — captured
 * with both a FK actor_id (when known) AND a snapshotted actor_email so the
 * trail survives an admin user being deleted or renamed.
 */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id),
    actorId: integer("actor_id").references(() => adminUsers.id),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    fieldName: text("field_name"),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("idx_audit_events_order_id").on(table.orderId),
    createdAtIdx: index("idx_audit_events_created_at").on(table.createdAt),
  }),
);

export const insertAuditEventSchema = createInsertSchema(auditEvents).omit({
  id: true,
  createdAt: true,
});

export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;

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
