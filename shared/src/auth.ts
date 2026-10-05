import { z } from 'zod';
import type { UserRole } from './enums.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);
const name = z.string().trim().min(1, 'Required').max(120);
const phone = z.string().trim().min(6, 'Enter a valid phone number').max(20);
const optionalPhone = z
  .string()
  .trim()
  .max(20)
  .optional()
  .transform((v) => (v ? v : undefined));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerCustomerSchema = z.object({
  name,
  email,
  phone: optionalPhone,
  password,
});
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;

/** A center's details and what it services: used at registration and when editing (docs/DECISIONS.md #34). */
export const serviceCenterProfileSchema = z.object({
  center: z.object({
    name,
    address: z.string().trim().min(1, 'Required').max(500),
    phone,
    email,
  }),
  categoryIds: z.array(z.string().uuid()).min(1, 'Select at least one category'),
  brandIds: z.array(z.string().uuid()).min(1, 'Select at least one brand'),
});
export type ServiceCenterProfileInput = z.infer<typeof serviceCenterProfileSchema>;

export interface ServiceCenterProfile {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  categoryIds: string[];
  brandIds: string[];
  closedAt: string | null;
  /** Requests that block closing: new, accepted, assigned or in progress. */
  openRequestCount: number;
}

export const registerServiceCenterSchema = serviceCenterProfileSchema.extend({
  staff: z.object({
    name,
    email,
    phone: optionalPhone,
    password,
  }),
});
export type RegisterServiceCenterInput = z.infer<typeof registerServiceCenterSchema>;

/** A technician or staff account created by center staff (docs/DECISIONS.md #22, #29). */
export const createTeamMemberSchema = z.object({
  name,
  email,
  phone: optionalPhone,
  password,
});
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;

/** The signed-in user as returned by GET /api/auth/me. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  serviceCenter: { id: string; name: string; closed: boolean } | null;
}

export interface CatalogItem {
  id: string;
  name: string;
}

/** API error body. `fieldErrors` keys are dotted paths, e.g. "staff.email". */
export interface ApiErrorBody {
  error: string;
  fieldErrors?: Record<string, string>;
}
