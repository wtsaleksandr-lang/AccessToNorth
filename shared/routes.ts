import { z } from 'zod';
import { insertRegistrationSchema, insertContactSchema, registrations } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  registrations: {
    create: {
      method: 'POST' as const,
      path: '/api/registrations' as const,
      input: insertRegistrationSchema,
      responses: {
        201: z.custom<typeof registrations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    // Mock endpoint to check status for the portal demo
    getStatus: {
      method: 'GET' as const,
      path: '/api/registrations/status' as const,
      input: z.object({ email: z.string().email() }),
      responses: {
        200: z.array(z.custom<typeof registrations.$inferSelect>()),
      },
    }
  },
  contact: {
    submit: {
      method: 'POST' as const,
      path: '/api/contact' as const,
      input: insertContactSchema,
      responses: {
        201: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
