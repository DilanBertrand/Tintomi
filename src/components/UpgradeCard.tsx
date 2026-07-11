import { Crown, Sparkles, Flame, Lock } from 'lucide-react'
import { useState } from 'react'
import { startProCheckout } from '../lib/startProCheckout'

const PERKS = [
  { icon: Lock, text: 'Unlock every track and lesson — the full library' },
  { icon: Sparkles, text: 'Earn 2x XP on every quiz and lesson' },
  { icon: Crown, text: 'Gold Pro badge on your profile' },
  { icon: Flame, text: 'Animated streak flame' },
]

/**
 * Tintomi Pro upsell. The button starts real Stripe Checkout via
 * startProCheckout(); is_pro only flips after Stripe confirms via webhook.
 */
export function UpgradeCard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#c9a227]/40 bg-gradient-to-br from-[#1a1608] to-[#121a15] p-5">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-[#e5c76b]" strokeWidth={2} aria-hidden />
        <h3 className="text-base font-semibold text-[#f4e9c8]">Tintomi Pro</h3>
      </div>
      <p className="mt-1 text-sm text-[#c9bd97]">Go deeper, learn faster, show it off.</p>

      <ul className="mt-4 space-y-2.5">
        {PERKS.map((perk) => (
          <li key={perk.text} className="flex items-center gap-3 text-sm text-[#e9ece8]">
            <perk.icon className="h-4 w-4 shrink-0 text-[#e5c76b]" strokeWidth={2} aria-hidden />
            {perk.text}
          </li>
        ))}
      </ul>

      {error ? <p className="mt-3 text-xs text-[#ff6b5e]">{error}</p> : null}

      <button
        type="button"
        onClick={() => void go()}
        disabled={loading}
        className="mt-5 min-h-12 w-full rounded-full bg-[#e5c76b] py-3 text-sm font-semibold text-[#1a1608] transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
      >
        {loading ? 'Opening checkout…' : 'Go Pro'}
      </button>
    </div>
  )
}
