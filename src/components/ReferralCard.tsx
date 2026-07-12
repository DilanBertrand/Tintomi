import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Card } from './Card'
import { useAuth } from '../contexts/AuthContext'
import { redeemReferral } from '../lib/notifications'

const REFERRAL_XP = 100

const REDEEM_MESSAGES: Record<string, string> = {
  already_referred: 'This account already used a referral code.',
  invalid_code: 'That code does not exist. Check it and try again.',
  self: 'Nice try — you cannot refer yourself.',
  not_authenticated: 'Please sign in again.',
  error: 'Something went wrong. Try again.',
}

/**
 * Share your referral code / redeem someone else's. Redemption runs through
 * the redeem_referral RPC, which credits +100 XP to both sides exactly once.
 */
export function ReferralCard({ onAddXp }: { onAddXp: (amount: number) => Promise<void> | void }) {
  const { profile, refreshProfile } = useAuth()
  const [copied, setCopied] = useState(false)
  const [code, setCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const myCode = profile?.referral_code ?? null
  const alreadyReferred = !!profile?.referred_by

  const copy = async () => {
    if (!myCode) return
    try {
      await navigator.clipboard.writeText(myCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked */
    }
  }

  const redeem = async () => {
    if (redeeming || code.trim().length === 0) return
    setRedeeming(true)
    setResult(null)
    const status = await redeemReferral(code.trim())
    if (status === 'ok') {
      // RPC already added +100 XP in the DB; mirror it locally so App's
      // absolute XP (which write-through syncs) doesn't clobber the grant.
      await onAddXp(REFERRAL_XP)
      await refreshProfile()
      setResult({ ok: true, text: `Code accepted — you and your friend both earned +${REFERRAL_XP} XP.` })
      setCode('')
    } else {
      setResult({ ok: false, text: REDEEM_MESSAGES[status] ?? REDEEM_MESSAGES.error })
    }
    setRedeeming(false)
  }

  return (
    <Card title="Refer a friend" subtitle={`You each earn +${REFERRAL_XP} XP`}>
      <p className="text-sm text-[#a7b0a8]">
        Share your code. When a friend enters it, you both get +{REFERRAL_XP} XP.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <p className="rounded-lg border border-[#232b25] bg-[#0f1412] px-4 py-2.5 font-mono text-lg font-semibold tracking-[0.25em] text-[#2979ff]">
          {myCode ?? '······'}
        </p>
        <button
          type="button"
          onClick={() => void copy()}
          disabled={!myCode}
          aria-label="Copy referral code"
          className="flex min-h-11 items-center gap-1.5 rounded-lg border border-[#232b25] bg-transparent px-3 py-2 text-xs font-medium text-[#e9ece8] transition-colors hover:bg-[#1a221c] disabled:opacity-50"
        >
          {copied ? <Check className="h-4 w-4 text-[#00d18f]" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {!alreadyReferred ? (
        <div className="mt-5 border-t border-[#232b25] pt-4">
          <p className="text-sm text-[#a7b0a8]">Got a code from a friend?</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 12))}
              placeholder="ABC123"
              className="min-h-11 flex-1 rounded-lg border border-[#232b25] bg-[#0f1412] px-3 font-mono text-sm tracking-widest text-[#e9ece8] placeholder-[#5c665e] outline-none transition-colors focus:border-[#2979ff]"
            />
            <button
              type="button"
              onClick={() => void redeem()}
              disabled={redeeming || code.trim().length === 0}
              className="min-h-11 rounded-full bg-[#e9ece8] px-6 text-sm font-semibold text-[#0f1412] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {redeeming ? 'Checking…' : 'Redeem'}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-[#5c665e]">Referral code already redeemed on this account.</p>
      )}
      {result ? (
        <p className={`mt-3 text-xs ${result.ok ? 'text-[#00d18f]' : 'text-[#ff6b5e]'}`}>{result.text}</p>
      ) : null}
    </Card>
  )
}
