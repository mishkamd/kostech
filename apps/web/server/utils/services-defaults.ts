import type { Service } from '~~/app/content/services'
import { defaultServices } from '~~/app/content/services'

export type ServicesLocale = 'ro' | 'ru' | 'en'

export function defaultServicesForLang(locale: string): Service[] {
  if (locale === 'ru' || locale === 'en') return defaultServices[locale]
  return defaultServices.ro
}

function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result = { ...base }
  for (const key of Object.keys(override) as Array<keyof T>) {
    const ov = override[key]
    const bv = base[key]
    if (ov && typeof ov === 'object' && !Array.isArray(ov) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
      result[key] = deepMerge(bv as Record<string, unknown>, ov as Record<string, unknown>) as T[typeof key]
    } else if (ov !== undefined) {
      result[key] = ov as T[typeof key]
    }
  }
  return result
}

export function mergeServices(base: Service[], override: Service[] | null): Service[] {
  if (!override || !Array.isArray(override)) return base
  // Merge by slug: keep override order, then any base entries not in override
  const bySlug = new Map<string, Service>()
  for (const s of base) bySlug.set(s.slug, s)
  const result: Service[] = []
  const seen = new Set<string>()
  for (const ov of override) {
    const bv = bySlug.get(ov.slug)
    if (bv) {
      result.push(deepMerge(bv as unknown as Record<string, unknown>, ov as unknown as Record<string, unknown>) as unknown as Service)
    } else {
      result.push(ov)
    }
    seen.add(ov.slug)
  }
  for (const s of base) {
    if (!seen.has(s.slug)) result.push(s)
  }
  return result
}
