/** Client for /api/pro-price (see api/pro-price.ts). */

export type ProPrice = {
  unitAmount: number
  currency: string
  interval: string | null
  intervalCount: number
}

export async function fetchProPrice(signal?: AbortSignal): Promise<ProPrice | null> {
  try {
    const res = await fetch('/api/pro-price', { signal })
    if (!res.ok) return null
    const data = (await res.json()) as Partial<ProPrice> & { ok?: boolean }
    if (!data.ok || typeof data.unitAmount !== 'number' || !data.currency) return null
    return {
      unitAmount: data.unitAmount,
      currency: data.currency,
      interval: data.interval ?? null,
      intervalCount: data.intervalCount ?? 1,
    }
  } catch {
    return null
  }
}

/** "€4.99 / month", or "€4.99 every 3 months" for multi-period prices. */
export function formatProPrice(p: ProPrice): string {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: p.currency,
  }).format(p.unitAmount / 100)
  if (!p.interval) return amount
  if (p.intervalCount === 1) return `${amount} / ${p.interval}`
  return `${amount} every ${p.intervalCount} ${p.interval}s`
}
