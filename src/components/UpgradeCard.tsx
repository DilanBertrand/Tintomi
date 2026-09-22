import { Crown, Sparkles, Flame, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { startProCheckout } from '../lib/startProCheckout'
import { fetchProPrice, formatProPrice, type ProPrice } from '../lib/proPrice'
import type { LegalSlug } from '../lib/routes'

const PERKS = [
  { icon: Lock, text: 'Unlock every track and lesson — the full library' },
  { icon: Sparkles, text: 'Earn 2x XP on every quiz and lesson' },
  { icon: Crown, text: 'Gold Pro badge on your profile' },
  { icon: Flame, text: 'Animated streak flame' },
]

/**
 * Tintomi Pro upsell.
 *
 * Consumer-law notes, because this takes recurring money from a young audience:
 * the price, billing period and auto-renewal are shown *before* the button; the
 * button says plainly that it starts a paid subscription (EU Consumer Rights
 * Directive art. 8(2) wants an unambiguous label, not "Go Pro"); and cancelling
 * and refunds are linked rather than buried. The price is read live from Stripe
 * so it cannot drift from what is actually charged.
 */
export function UpgradeCard({ onOpenLegal }: { onOpenLegal: (slug: LegalSlug) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [price, setPrice] = useState<ProPrice | null>(null)
  const [priceFailed, setPriceFailed] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    void fetchProPrice(ctrl.signal).then((p) => {
      if (ctrl.signal.aborted) return
      setPrice(p)
      setPriceFailed(p === null)
    })
    return () => ctrl.abort()
  }, [])

  async function go() {
    setLoading(true)
    setError('')
    const err = await startProCheckout()
    if (err) {
      setError(err)
      setLoading(false)
    }
    // On success the page navigates to Stripe, so no need to reset loading.
  }

  const priceLabel = price ? formatProPrice(price) : null
  const period = price?.interval ?? 'billing period'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#c9a227]/40 bg-gradient-to-br from-[#1a1608] to-[#121a15] p-5">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-[#e5c76b]" strokeWidth={2} aria-hidden />
        <h3 className="text-base font-semibold text-[#f4e9c8]">Tintomi Pro</h3>
      </div>
      <p className="mt-1 text-sm text-[#c9bd97]">Go deeper, learn faster, show it off.</p>

      <p className="mt-4 text-2xl font-bold text-[#f4e9c8]">
        {priceLabel ?? (priceFailed ? 'Price unavailable' : 'Loading price…')}
      </p>

      <ul className="mt-4 space-y-2.5">
        {PERKS.map((perk) => (
          <li key={perk.text} className="flex items-center gap-3 text-sm text-[#e9ece8]">
            <perk.icon className="h-4 w-4 shrink-0 text-[#e5c76b]" strokeWidth={2} aria-hidden />
            {perk.text}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-[#c9bd97]">
        Renews automatically every {period} until you cancel. Cancel any time from your account — you keep Pro until
        the end of the period you have paid for. 14-day money-back guarantee. You must be 18 or over, or have a
        parent or guardian pay on your behalf.
      </p>

      <p className="mt-2 text-xs text-[#c9bd97]">
        <button
          type="button"
          onClick={() => onOpenLegal('terms')}
          className="underline underline-offset-2 hover:text-[#f4e9c8]"
        >
          Terms
        </button>
        {' · '}
        <button
          type="button"
          onClick={() => onOpenLegal('refunds')}
          className="underline underline-offset-2 hover:text-[#f4e9c8]"
        >
          Refund Policy
        </button>
      </p>

      {error ? (
        <p className="mt-3 text-xs text-[#ff6b5e]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void go()}
        disabled={loading || !price}
        className="mt-5 min-h-12 w-full rounded-full bg-[#e5c76b] py-3 text-sm font-semibold text-[#1a1608] transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
      >
        {loading
          ? 'Opening checkout…'
          : priceLabel
            ? `Subscribe — ${priceLabel}`
            : 'Subscribe'}
      </button>
    </div>
  )
}
