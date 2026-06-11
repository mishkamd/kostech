import type { H3Event } from 'h3'

// --- minimal D1 type stubs (avoids importing @cloudflare/workers-types) ---
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(): Promise<T | null>
  run(): Promise<{ success: boolean; meta?: Record<string, unknown> }>
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch(statements: D1PreparedStatement[]): Promise<Array<{ results?: unknown[]; success: boolean }>>
}

export function getD1(event: H3Event): D1Database | null {
  const env = (event.context as { cloudflare?: { env?: { DB?: D1Database } } })?.cloudflare?.env
  return env?.DB ?? null
}

// ─── Booking ─────────────────────────────────────────────────────────────────

interface BookingRow {
  id: string
  service_slug: string
  date: string
  name: string
  phone: string
  email: string
  address: string
  notes: string
  status: string
  created_at: number
  updated_at: number | null
  attachment_keys: string | null
  attachment_meta: string | null
}

export interface BookingRecord {
  id: string
  serviceSlug: string
  date: string
  name: string
  phone: string
  email: string
  address: string
  notes: string
  status: string
  createdAt: number
  updatedAt?: number
  attachments?: Array<{ name: string; type: string; size: number }>
  _r2Keys?: string[]
}

function rowToBooking(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    serviceSlug: row.service_slug,
    date: row.date,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    ...(row.updated_at ? { updatedAt: row.updated_at } : {}),
    ...(row.attachment_meta ? { attachments: JSON.parse(row.attachment_meta) } : {}),
    ...(row.attachment_keys ? { _r2Keys: JSON.parse(row.attachment_keys) } : {}),
  }
}

export async function d1InsertBooking(
  db: D1Database,
  record: BookingRecord,
  r2Keys?: string[],
): Promise<void> {
  await db.prepare(
    `INSERT INTO bookings
      (id,service_slug,date,name,phone,email,address,notes,status,created_at,attachment_keys,attachment_meta)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).bind(
    record.id, record.serviceSlug, record.date, record.name, record.phone,
    record.email ?? '', record.address ?? '', record.notes ?? '',
    record.status, record.createdAt,
    r2Keys?.length ? JSON.stringify(r2Keys) : null,
    record.attachments?.length
      ? JSON.stringify(record.attachments.map(({ name, type, size }) => ({ name, type, size })))
      : null,
  ).run()
}

export async function d1GetBooking(db: D1Database, id: string): Promise<BookingRecord | null> {
  const row = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<BookingRow>()
  return row ? rowToBooking(row) : null
}

export async function d1ListBookings(db: D1Database, limit = 0): Promise<BookingRecord[]> {
  const { results } = limit > 0
    ? await db.prepare('SELECT * FROM bookings ORDER BY created_at DESC LIMIT ?').bind(limit).all<BookingRow>()
    : await db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all<BookingRow>()
  return (results ?? []).map(rowToBooking)
}

export async function d1UpdateBooking(
  db: D1Database,
  id: string,
  fields: Partial<Pick<BookingRecord, 'status' | 'name' | 'phone' | 'date' | 'address' | 'notes'>>,
): Promise<void> {
  const cols = Object.entries({
    status: fields.status,
    name: fields.name,
    phone: fields.phone,
    date: fields.date,
    address: fields.address,
    notes: fields.notes,
  }).filter(([, v]) => v !== undefined)

  if (!cols.length) return
  const sets = [...cols.map(([k]) => `${k} = ?`), 'updated_at = ?'].join(', ')
  const vals = [...cols.map(([, v]) => v), Date.now(), id]
  await db.prepare(`UPDATE bookings SET ${sets} WHERE id = ?`).bind(...vals).run()
}

export async function d1DeleteBooking(db: D1Database, id: string): Promise<string[]> {
  const row = await db.prepare('SELECT attachment_keys FROM bookings WHERE id = ?')
    .bind(id).first<{ attachment_keys: string | null }>()
  await db.prepare('DELETE FROM bookings WHERE id = ?').bind(id).run()
  return row?.attachment_keys ? JSON.parse(row.attachment_keys) : []
}

// ─── Lead ─────────────────────────────────────────────────────────────────────

interface LeadRow {
  id: string
  name: string
  email: string
  phone: string
  message: string
  description: string
  location: string
  scheduled_at: string
  source: string
  status: string
  created_at: number
  updated_at: number | null
  attachment_keys: string | null
  attachment_meta: string | null
}

export interface LeadRecord {
  id: string
  name: string
  email: string
  phone: string
  message: string
  description: string
  location: string
  scheduledAt: string
  source: string
  status: string
  createdAt: number
  updatedAt?: number
  attachments?: Array<{ name: string; type: string; size: number }>
  _r2Keys?: string[]
}

function rowToLead(row: LeadRow): LeadRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    description: row.description,
    location: row.location,
    scheduledAt: row.scheduled_at,
    source: row.source,
    status: row.status,
    createdAt: row.created_at,
    ...(row.updated_at ? { updatedAt: row.updated_at } : {}),
    ...(row.attachment_meta ? { attachments: JSON.parse(row.attachment_meta) } : {}),
    ...(row.attachment_keys ? { _r2Keys: JSON.parse(row.attachment_keys) } : {}),
  }
}

export async function d1InsertLead(
  db: D1Database,
  record: LeadRecord,
  r2Keys?: string[],
): Promise<void> {
  await db.prepare(
    `INSERT INTO leads
      (id,name,email,phone,message,description,location,scheduled_at,source,status,created_at,attachment_keys,attachment_meta)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).bind(
    record.id, record.name, record.email ?? '', record.phone ?? '',
    record.message ?? '', record.description ?? '', record.location ?? '',
    record.scheduledAt ?? '', record.source ?? '',
    record.status, record.createdAt,
    r2Keys?.length ? JSON.stringify(r2Keys) : null,
    record.attachments?.length
      ? JSON.stringify(record.attachments.map(({ name, type, size }) => ({ name, type, size })))
      : null,
  ).run()
}

export async function d1GetLead(db: D1Database, id: string): Promise<LeadRecord | null> {
  const row = await db.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first<LeadRow>()
  return row ? rowToLead(row) : null
}

export async function d1ListLeads(db: D1Database, limit = 0): Promise<LeadRecord[]> {
  const { results } = limit > 0
    ? await db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT ?').bind(limit).all<LeadRow>()
    : await db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all<LeadRow>()
  return (results ?? []).map(rowToLead)
}

export async function d1UpdateLead(
  db: D1Database,
  id: string,
  fields: Partial<Pick<LeadRecord, 'status' | 'name' | 'email' | 'phone' | 'message' | 'description' | 'location' | 'scheduledAt'>>,
): Promise<void> {
  const cols = Object.entries({
    status: fields.status,
    name: fields.name,
    email: fields.email,
    phone: fields.phone,
    message: fields.message,
    description: fields.description,
    location: fields.location,
    scheduled_at: fields.scheduledAt,
  }).filter(([, v]) => v !== undefined)

  if (!cols.length) return
  const sets = [...cols.map(([k]) => `${k} = ?`), 'updated_at = ?'].join(', ')
  const vals = [...cols.map(([, v]) => v), Date.now(), id]
  await db.prepare(`UPDATE leads SET ${sets} WHERE id = ?`).bind(...vals).run()
}

export async function d1DeleteLead(db: D1Database, id: string): Promise<string[]> {
  const row = await db.prepare('SELECT attachment_keys FROM leads WHERE id = ?')
    .bind(id).first<{ attachment_keys: string | null }>()
  await db.prepare('DELETE FROM leads WHERE id = ?').bind(id).run()
  return row?.attachment_keys ? JSON.parse(row.attachment_keys) : []
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function d1Stats(db: D1Database): Promise<{
  bookings: { total: number; new: number }
  leads: { total: number; new: number }
}> {
  const [bAll, bNew, lAll, lNew] = await db.batch([
    db.prepare('SELECT COUNT(*) as n FROM bookings'),
    db.prepare("SELECT COUNT(*) as n FROM bookings WHERE status = 'new'"),
    db.prepare('SELECT COUNT(*) as n FROM leads'),
    db.prepare("SELECT COUNT(*) as n FROM leads WHERE status = 'new'"),
  ])
  const n = (r: { results?: Array<{ n: number }> }) => r.results?.[0]?.n ?? 0
  return {
    bookings: { total: n(bAll as any), new: n(bNew as any) },
    leads: { total: n(lAll as any), new: n(lNew as any) },
  }
}
