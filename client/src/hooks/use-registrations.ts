import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Types derived from schema via routes
type InsertRegistration = z.infer<typeof api.registrations.create.input>;
type InsertContact = z.infer<typeof api.contact.submit.input>;

export function useRegistrations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createRegistration = useMutation({
    mutationFn: async (data: InsertRegistration) => {
      const res = await fetch(api.registrations.create.path, {
        method: api.registrations.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create registration");
      }
      
      return api.registrations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({
        title: "Application Received",
        description: "We have received your registration request. Check your email for next steps.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const checkStatus = useMutation({
    mutationFn: async (email: string) => {
      // Note: GET request with body is non-standard, usually passed as query params
      // But adhering to the routes manifest structure which likely intended query params
      // Since fetch GET can't have body, we'll manually construct URL with params if the manifest implies it
      // However, the routes manifest defines 'input' which usually implies body for POST/PUT. 
      // For GET, we treat input as query params.
      
      // Construct URL with query params
      const url = `${api.registrations.getStatus.path}?email=${encodeURIComponent(email)}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error("Could not fetch status");
      }
      
      return api.registrations.getStatus.responses[200].parse(await res.json());
    }
  });

  return { createRegistration, checkStatus };
}

export function useContact() {
  const { toast } = useToast();

  const submitContact = useMutation({
    mutationFn: async (data: InsertContact) => {
      const res = await fetch(api.contact.submit.path, {
        method: api.contact.submit.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send message");
      }

      return api.contact.submit.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Thank you for reaching out. We will review your message and respond shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return { submitContact };
}
