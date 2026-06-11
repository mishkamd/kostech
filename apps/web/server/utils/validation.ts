import { z } from 'zod'

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const

export const AttachmentItemSchema = z.object({
  name: z.string().min(1).max(260),
  type: z.enum(ALLOWED_MIME),
  /** base64-encoded file data */
  data: z.string().min(1).max(7_000_000),
  size: z.number().int().positive().max(5_000_000),
})

const attachmentsField = z
  .array(AttachmentItemSchema)
  .min(1)
  .max(3)
  .optional()

export const ContactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160).optional().or(z.literal('')),
  phone: z.string().min(5).max(40).optional().or(z.literal('')),
  message: z.string().max(2000).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  scheduledAt: z.string().max(40).optional(),
  source: z.string().max(40).optional(),
  attachments: attachmentsField,
})

export const BookingSchema = z.object({
  serviceSlug: z.string().min(2).max(80),
  date: z.string().min(8).max(20),
  name: z.string().min(2).max(120),
  phone: z.string().min(5).max(40),
  email: z.string().email().max(160).optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  attachments: attachmentsField,
})

export const StatusSchema = z.object({
  status: z.enum(['new', 'in_progress', 'done', 'canceled']),
})

export const BookingUpdateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'done', 'canceled']).optional(),
  name: z.string().min(2).max(120).optional(),
  phone: z.string().min(5).max(40).optional().or(z.literal('')),
  date: z.string().min(8).max(20).optional(),
  address: z.string().max(300).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export const LeadUpdateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'done', 'canceled']).optional(),
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().max(160).optional().or(z.literal('')),
  phone: z.string().min(5).max(40).optional().or(z.literal('')),
  message: z.string().max(2000).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  scheduledAt: z.string().max(40).optional().or(z.literal('')),
})
