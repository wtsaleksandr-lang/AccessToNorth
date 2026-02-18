import { db } from "./db";
import { 
  registrations, 
  contacts, 
  orders,
  uploads,
  messages,
  carmLeads,
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
  type InsertCarmLead
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
