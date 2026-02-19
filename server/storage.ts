import { db } from "./db";
import { 
  registrations, 
  contacts, 
  orders,
  uploads,
  messages,
  carmLeads,
  hsCodes,
  tariffCountries,
  customsLeads,
  type InsertRegistration, 
  type Registration, 
  type InsertContact,
  type Order,
  type InsertOrder,
  type Upload,
  type InsertUpload,
  type Message,
  type InsertMessage,
  type CarmLead,
  type InsertCarmLead,
  type HsCode,
  type TariffCountry,
  type CustomsLead,
  type InsertCustomsLead,
} from "@shared/schema";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getRegistrationsByEmail(email: string): Promise<Registration[]>;
  createContact(contact: InsertContact): Promise<void>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrderByIdAndEmail(id: string, email: string): Promise<Order | undefined>;
  getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<void>;
  updateOrderSteps(id: string, steps: any[]): Promise<void>;
  getAllOrders(): Promise<Order[]>;
  getUploadsByOrderId(orderId: string): Promise<Upload[]>;
  getUploadById(id: string): Promise<Upload | undefined>;
  createUpload(upload: InsertUpload): Promise<Upload>;
  getMessagesByOrderId(orderId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  createCarmLead(lead: InsertCarmLead): Promise<CarmLead>;
  searchHsCodes(query: string, limit?: number): Promise<HsCode[]>;
  searchHsCodesFuzzy(query: string, limit?: number): Promise<Array<HsCode & { score: number }>>;
  getHsCodeByCode(code: string): Promise<HsCode | undefined>;
  getAllCountries(): Promise<TariffCountry[]>;
  createCustomsLead(lead: InsertCustomsLead): Promise<CustomsLead>;
}

export class DatabaseStorage implements IStorage {
  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const [registration] = await db
      .insert(registrations)
      .values(insertRegistration)
      .returning();
    return registration;
  }

  async getRegistrationsByEmail(email: string): Promise<Registration[]> {
    return await db
      .select()
      .from(registrations)
      .where(eq(registrations.email, email));
  }

  async createContact(insertContact: InsertContact): Promise<void> {
    await db.insert(contacts).values(insertContact);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder as any)
      .returning();
    return order;
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getOrderByIdAndEmail(id: string, email: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.customerEmail, email)));
    return order;
  }

  async getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.stripeSessionId, sessionId));
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id));
  }

  async updateOrderSteps(id: string, steps: any[]): Promise<void> {
    await db
      .update(orders)
      .set({ steps, updatedAt: new Date() } as any)
      .where(eq(orders.id, id));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async getUploadById(id: string): Promise<Upload | undefined> {
    const [upload] = await db
      .select()
      .from(uploads)
      .where(eq(uploads.id, id));
    return upload;
  }

  async getUploadsByOrderId(orderId: string): Promise<Upload[]> {
    return await db
      .select()
      .from(uploads)
      .where(eq(uploads.orderId, orderId))
      .orderBy(desc(uploads.createdAt));
  }

  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const [upload] = await db
      .insert(uploads)
      .values(insertUpload)
      .returning();
    return upload;
  }

  async getMessagesByOrderId(orderId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.orderId, orderId))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }
  async createCarmLead(insertLead: InsertCarmLead): Promise<CarmLead> {
    const [lead] = await db
      .insert(carmLeads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async searchHsCodes(query: string, limit: number = 20): Promise<HsCode[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const isCodeSearch = /^[\d.]+$/.test(trimmed);

    if (isCodeSearch) {
      return await db
        .select()
        .from(hsCodes)
        .where(ilike(hsCodes.code, `${trimmed}%`))
        .limit(limit);
    }

    const ilikeResults = await db
      .select()
      .from(hsCodes)
      .where(
        or(
          ilike(hsCodes.description, `%${trimmed}%`),
          ilike(hsCodes.descriptionFull, `%${trimmed}%`)
        )
      )
      .limit(limit);

    if (ilikeResults.length >= limit) return ilikeResults;

    const remaining = limit - ilikeResults.length;
    const existingCodes = ilikeResults.map(r => r.code);

    if (trimmed.length >= 3 && remaining > 0) {
      const existingCodeSet = new Set(existingCodes);
      const fuzzyResults = await db.execute(sql`
        SELECT *
        FROM hs_codes
        WHERE (description % ${trimmed} OR description_full % ${trimmed})
        ORDER BY GREATEST(
          similarity(description, ${trimmed}),
          similarity(COALESCE(description_full, ''), ${trimmed})
        ) DESC
        LIMIT ${remaining + ilikeResults.length}
      `);
      const fuzzyRows = (fuzzyResults.rows || fuzzyResults) as Array<any>;
      const deduped: HsCode[] = [];
      for (const r of fuzzyRows) {
        if (!existingCodeSet.has(r.code) && deduped.length < remaining) {
          deduped.push({
            id: r.id,
            code: r.code,
            description: r.description,
            descriptionFull: r.description_full,
            chapter: r.chapter,
            unitOfMeasure: r.unit_of_measure,
            dutyRates: r.duty_rates,
          } as HsCode);
          existingCodeSet.add(r.code);
        }
      }
      return [...ilikeResults, ...deduped];
    }

    return ilikeResults;
  }

  async searchHsCodesFuzzy(query: string, limit: number = 20): Promise<Array<HsCode & { score: number }>> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 3) return [];

    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const compoundPattern = '\\m\\w{0,6}' + escaped;
    const ilikePattern = '%' + trimmed + '%';
    const ilikeResults = await db.execute(sql`
      SELECT *,
        CASE
          WHEN description ILIKE ${trimmed} THEN 1.0
          WHEN description ILIKE ${trimmed + '%'} THEN 0.95
          WHEN description ~* ${compoundPattern} THEN 0.9
          WHEN description_full ~* ${compoundPattern} THEN 0.85
          WHEN description ILIKE ${ilikePattern} THEN 0.6
          WHEN description_full ILIKE ${ilikePattern} THEN 0.55
          ELSE 0.5
        END AS score
      FROM hs_codes
      WHERE description ~* ${compoundPattern}
         OR description_full ~* ${compoundPattern}
         OR description ILIKE ${ilikePattern}
         OR description_full ILIKE ${ilikePattern}
      ORDER BY score DESC, description ASC
      LIMIT ${limit}
    `);

    let results = (ilikeResults.rows || ilikeResults) as Array<any>;

    if (results.length < 10) {
      const existingCodeSet = new Set(results.map((r: any) => r.code));
      const remaining = limit - results.length;

      const fuzzyResults = await db.execute(sql`
        SELECT *, GREATEST(
          similarity(description, ${trimmed}),
          similarity(COALESCE(description_full, ''), ${trimmed})
        ) AS score
        FROM hs_codes
        WHERE (description % ${trimmed} OR description_full % ${trimmed})
        ORDER BY score DESC
        LIMIT ${remaining + results.length}
      `);
      const fuzzyRows = (fuzzyResults.rows || fuzzyResults) as Array<any>;
      for (const row of fuzzyRows) {
        if (!existingCodeSet.has(row.code) && results.length < limit && parseFloat(row.score) >= 0.2) {
          results.push(row);
          existingCodeSet.add(row.code);
        }
      }
    }

    return results.map((r: any) => ({
      id: r.id,
      code: r.code,
      description: r.description,
      descriptionFull: r.description_full,
      chapter: r.chapter,
      unitOfMeasure: r.unit_of_measure,
      dutyRates: r.duty_rates,
      score: parseFloat(r.score),
    }));
  }

  async getHsCodeByCode(code: string): Promise<HsCode | undefined> {
    const [result] = await db
      .select()
      .from(hsCodes)
      .where(eq(hsCodes.code, code));
    return result;
  }

  async getAllCountries(): Promise<TariffCountry[]> {
    return await db
      .select()
      .from(tariffCountries)
      .orderBy(tariffCountries.name);
  }

  async createCustomsLead(insertLead: InsertCustomsLead): Promise<CustomsLead> {
    const [lead] = await db
      .insert(customsLeads)
      .values(insertLead)
      .returning();
    return lead;
  }
}

export const storage = new DatabaseStorage();
