import { db } from "./db";
import { 
  registrations, 
  contacts, 
  type InsertRegistration, 
  type Registration, 
  type InsertContact 
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getRegistrationsByEmail(email: string): Promise<Registration[]>;
  createContact(contact: InsertContact): Promise<void>;
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
}

export const storage = new DatabaseStorage();
