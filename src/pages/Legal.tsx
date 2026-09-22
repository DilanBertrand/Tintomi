import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { MeshBackdrop } from '../components/MeshBackdrop'
import {
  COMPANY,
  LEGAL_LAST_UPDATED,
  MARKET_DATA_SOURCE,
  MINIMUM_AGE,
  PARENTAL_CONSENT_AGE,
  SUBPROCESSORS,
} from '../lib/legal'
import { LEGAL_PAGES, type LegalSlug } from '../lib/routes'

/* -------------------------------------------------------------------------- */
/* Shared chrome                                                              */
/* -------------------------------------------------------------------------- */

function H2({ children }: { children: ReactNode }) {
  return <h2 className="tm-serif mt-10 text-xl text-[#e9ece8] sm:text-2xl">{children}</h2>
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[0.95rem] leading-relaxed text-[#c3cbc4]">{children}</p>
}

function UL({ children }: { children: ReactNode }) {
  return <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.95rem] leading-relaxed text-[#c3cbc4]">{children}</ul>
}

function Mail() {
  return (
    <a
      href={`mailto:${COMPANY.contactEmail}`}
      className="text-[#5b9bff] underline underline-offset-2 hover:text-[#8fbaff]"
    >
      {COMPANY.contactEmail}
    </a>
  )
}

function CrossLink({ slug, onNavigate }: { slug: LegalSlug; onNavigate: (slug: LegalSlug) => void }) {
  return (
    <a
      href={`/${slug}`}
      onClick={(e) => {
        e.preventDefault()
        onNavigate(slug)
      }}
      className="text-[#5b9bff] underline underline-offset-2 hover:text-[#8fbaff]"
    >
      {LEGAL_PAGES[slug]}
    </a>
  )
}

/** Company identity block required by EU/UK e-commerce rules. Omits unknown fields. */
function CompanyDetails() {
  const rows: { label: string; value: string }[] = []
  if (COMPANY.legalName) rows.push({ label: 'Operated by', value: COMPANY.legalName })
  if (COMPANY.registrationNumber) rows.push({ label: 'Registration number', value: COMPANY.registrationNumber })
  if (COMPANY.address) rows.push({ label: 'Address', value: COMPANY.address })
  if (COMPANY.country) rows.push({ label: 'Country', value: COMPANY.country })

  return (
    <div className="mt-4 rounded-xl border border-[#232b25] bg-[#121a15] p-4">
      <dl className="space-y-2 text-[0.95rem]">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
          <dt className="shrink-0 text-[#a7b0a8] sm:w-44">Service</dt>
          <dd className="text-[#e9ece8]">
            {COMPANY.productName} ({COMPANY.website})
          </dd>
        </div>
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="shrink-0 text-[#a7b0a8] sm:w-44">{r.label}</dt>
            <dd className="text-[#e9ece8]">{r.value}</dd>
          </div>
        ))}
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
          <dt className="shrink-0 text-[#a7b0a8] sm:w-44">Contact</dt>
          <dd className="text-[#e9ece8]">
            <Mail />
          </dd>
        </div>
      </dl>
      {import.meta.env.DEV && rows.length < 4 ? (
        <p className="mt-3 rounded-lg border border-[#c9a227]/40 bg-[#1a1608] p-3 text-xs text-[#e5c76b]">
          Dev-only reminder: fill in legalName, registrationNumber, address and country in{' '}
          <code>src/lib/legal.ts</code>. Missing fields are hidden in production, but an online service aimed at
          consumers is expected to publish them in the EU/UK.
        </p>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Privacy Policy                                                             */
/* -------------------------------------------------------------------------- */

function Privacy({ onNavigate }: { onNavigate: (slug: LegalSlug) => void }) {
  return (
    <>
      <P>
        This policy explains what {COMPANY.productName} collects, why, and what you can do about it. We have tried to
        write it in plain English because most of our users are teenagers.
      </P>
      <CompanyDetails />

      <H2>The short version</H2>
      <UL>
        <li>You need an email address and a password to have an account. Everything else is optional.</li>
        <li>We do not run advertising, and we do not sell or share your data with advertisers or data brokers.</li>
        <li>We do not use analytics, tracking pixels, or third-party cookies.</li>
        <li>
          {COMPANY.productName} is free. There is nothing to buy, so we never ask for payment or bank details.
        </li>
        <li>You can delete your account and your data at any time by emailing us.</li>
      </UL>

      <H2>What we collect</H2>
      <P>
        <strong className="text-[#e9ece8]">Account details.</strong> Your email address and a password. Passwords are
        hashed by our authentication provider and are never visible to us. We also store a username, which is generated
        from your email address when you sign up and which you can change.
      </P>
      <P>
        <strong className="text-[#e9ece8]">Things you choose to add.</strong> A display name, a profile picture, posts
        and replies in the community feed, and any image you attach to a post. Anything you post in the community is
        visible to other signed-in users, so do not put private information in it.
      </P>
      <P>
        <strong className="text-[#e9ece8]">Your progress.</strong> XP, level, which lessons and stories you have
        finished, your learning streak, quiz answers you got wrong (so we can offer a review), your practice-trading
        balance and holdings, and a weekly snapshot of your practice portfolio value and leaderboard rank so we can
        show you how your week went.
      </P>
      <P>
        <strong className="text-[#e9ece8]">Technical data.</strong> Our host keeps standard server logs (IP address,
        browser type, pages requested) for security and debugging. We do not build profiles from them.
      </P>
      <P>
        We do not collect your real name, phone number, address, school, location, payment details, or any financial
        account information, and we ask you not to send them to us.
      </P>

      <H2>Why we are allowed to use it</H2>
      <P>
        If you are in the UK or the EEA, the UK GDPR and GDPR require a lawful basis for each use. Ours are:
      </P>
      <UL>
        <li>
          <strong className="text-[#e9ece8]">Performing our contract with you</strong> — running your account and
          saving your progress.
        </li>
        <li>
          <strong className="text-[#e9ece8]">Your consent</strong> — the optional profile picture and display name, and
          the weekly recap email, which you can turn off at any time.
        </li>
        <li>
          <strong className="text-[#e9ece8]">Our legitimate interests</strong> — keeping the service secure, preventing
          abuse and spam, and fixing bugs.
        </li>
      </UL>

      <H2>Age</H2>
      <P>
        You must be at least {MINIMUM_AGE} to create an account. {COMPANY.productName} is not directed at children
        under {MINIMUM_AGE}, and we do not knowingly collect their data. If you are under {PARENTAL_CONSENT_AGE} and
        live in the UK or the EEA, please ask a parent or guardian to agree on your behalf before signing up. If you
        are a parent and believe your child has created an account, email us at <Mail /> and we will delete it.
      </P>

      <H2>Who we share it with</H2>
      <P>
        We do not sell your data. We use a small number of service providers who process data on our instructions:
      </P>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-[0.9rem]">
          <caption className="sr-only">Service providers that process Tintomi user data</caption>
          <thead>
            <tr className="border-b border-[#232b25]">
              <th scope="col" className="py-2 pr-3 font-semibold text-[#e9ece8]">
                Provider
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold text-[#e9ece8]">
                What they do
              </th>
              <th scope="col" className="py-2 font-semibold text-[#e9ece8]">
                Where
              </th>
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((s) => (
              <tr key={s.name} className="border-b border-[#232b25]/60">
                <td className="py-2 pr-3 align-top text-[#c3cbc4]">
                  <a
                    href={s.privacyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5b9bff] underline underline-offset-2 hover:text-[#8fbaff]"
                  >
                    {s.name}
                  </a>
                </td>
                <td className="py-2 pr-3 align-top text-[#c3cbc4]">{s.role}</td>
                <td className="py-2 align-top text-[#c3cbc4]">{s.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        Share prices shown in the app come from {MARKET_DATA_SOURCE}. We request that data from our own servers, so
        your browser never contacts them and they never receive your IP address or any information about you.
      </P>
      <P>
        We may also disclose data if we are legally required to, or to protect the safety of our users.
      </P>

      <H2>Where your data is stored</H2>
      <P>
        Our database and file storage are hosted in the United States. If you are in the UK or the EEA, that means your
        data is transferred outside your country. Our providers rely on the European Commission's Standard Contractual
        Clauses (and the UK Addendum) to make those transfers lawful.
      </P>

      <H2>How long we keep it</H2>
      <UL>
        <li>Account and progress data: until you delete your account.</li>
        <li>Community posts: until you delete them or your account.</li>
        <li>Server logs: typically 30 days.</li>
      </UL>
      <P>
        When you delete your account we remove your profile, progress, wallet, posts and uploaded images. Anonymous,
        aggregated figures that cannot identify you may remain.
      </P>

      <H2>Your rights</H2>
      <P>
        Depending on where you live, you can ask us to give you a copy of your data, correct it, delete it, restrict or
        object to how we use it, or send it to another service. You can also withdraw consent at any time. In
        California, you additionally have the right to know, delete, correct, and opt out of any "sale" or "sharing" of
        personal information — we do neither.
      </P>
      <P>
        To use any of these rights, email <Mail />. We will reply within 30 days and will not charge you or treat you
        differently for asking. If you are unhappy with our answer, you can complain to your local data protection
        authority.
      </P>

      <H2>Security</H2>
      <P>
        Connections are encrypted with HTTPS. Passwords are hashed. Database access is restricted per user by row-level
        security rules, so one account cannot read another's private data. No system is perfectly secure, but if a
        breach affects you we will tell you and the relevant regulator as the law requires.
      </P>

      <H2>Cookies and local storage</H2>
      <P>
        See our <CrossLink slug="cookies" onNavigate={onNavigate} /> for the full list. In short: we use only the
        storage needed to keep you signed in and to remember your progress. No advertising or analytics trackers.
      </P>

      <H2>Changes</H2>
      <P>
        If we make a significant change we will tell you in the app or by email before it takes effect. This policy was
        last updated on {LEGAL_LAST_UPDATED}.
      </P>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Terms and Conditions                                                       */
/* -------------------------------------------------------------------------- */

function Terms() {
  return (
    <>
      <P>
        These terms are the agreement between you and us when you use {COMPANY.productName}. By creating an account you
        accept them. If you do not agree, please do not use the service.
      </P>
      <CompanyDetails />

      <H2>1. What Tintomi is — and is not</H2>
      <P>
        {COMPANY.productName} is an educational product. It teaches personal finance through short lessons and a
        practice-trading game played with simulated money. It is free: there is nothing to buy, no subscription, and
        we never take payment from you.
      </P>
      <div className="mt-4 rounded-xl border border-[#c9a227]/40 bg-[#1a1608] p-4">
        <p className="text-[0.95rem] font-semibold leading-relaxed text-[#f4e9c8]">
          We are not a broker, a bank, an investment adviser, or a financial institution. Nothing in
          {' '}{COMPANY.productName} is financial, investment, tax or legal advice, and nothing in it is a recommendation
          to buy or sell anything. No real money is ever invested, and no real securities are ever bought or sold. Past
          performance of any asset shown in the app does not predict future results. Always do your own research and
          speak to a qualified adviser before making real financial decisions.
        </p>
      </div>

      <H2>2. Eligibility</H2>
      <P>
        You must be at least {MINIMUM_AGE} years old. If you are under {PARENTAL_CONSENT_AGE}, or under the age of
        majority where you live, you may only use {COMPANY.productName} with the agreement of a parent or guardian, and
        they accept these terms with you.
      </P>

      <H2>3. Your account</H2>
      <UL>
        <li>Keep your password to yourself. You are responsible for what happens on your account.</li>
        <li>One account per person. Do not create accounts for other people or with a false identity.</li>
        <li>Tell us at <Mail /> if you think someone else has got into your account.</li>
      </UL>

      <H2>4. The practice portfolio</H2>
      <P>
        Every account starts with a simulated balance of $1,000. This balance, and everything bought with it, is a
        number in a game. It has no cash value, cannot be withdrawn, transferred, sold or exchanged, and we may reset
        it — for example to fix a bug, to start a new season, or if it was obtained by cheating.
      </P>
      <P>
        Prices are supplied by a third party ({MARKET_DATA_SOURCE}), may be delayed, and may be wrong or unavailable.
        We do not guarantee their accuracy and we are not liable for decisions made on the basis of them.
      </P>

      <H2>5. Community rules</H2>
      <P>When you post, you agree not to publish anything that is:</P>
      <UL>
        <li>abusive, hateful, harassing, sexual, or threatening;</li>
        <li>spam, advertising, or a link to a scam or "signal" group;</li>
        <li>financial advice presented as professional advice, or a promise of returns;</li>
        <li>someone else's personal information, or content you do not have the rights to.</li>
      </UL>
      <P>
        You keep ownership of what you post. You give us a licence to display it inside {COMPANY.productName} so the
        feature works. We may remove content or suspend accounts that break these rules, and we may do so without
        notice where the content is harmful.
      </P>

      <H2>6. Acceptable use</H2>
      <P>Do not attempt to break, overload, scrape, reverse-engineer or gain unauthorised access to the service.</P>

      <H2>7. Our content</H2>
      <P>
        The lessons, text, design, code and branding of {COMPANY.productName} belong to us and are protected by
        copyright. You may use them for your own learning. You may not copy, republish or sell them.
      </P>

      <H2>8. Availability</H2>
      <P>
        We provide the service "as is". We do not promise it will always be available, uninterrupted or error-free, and
        we may change or discontinue features.
      </P>

      <H2>9. Liability</H2>
      <P>
        Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or for
        anything else that cannot legally be limited — including your non-excludable rights as a consumer, which these
        terms do not affect.
      </P>
      <P>
        Subject to that, we are not liable for indirect or consequential loss, or for any loss you suffer from real
        financial decisions you make. Because {COMPANY.productName} is free and you pay us nothing, where we are
        liable our total liability to you is limited to $50.
      </P>

      <H2>10. Ending the agreement</H2>
      <P>
        You may stop using {COMPANY.productName} and delete your account at any time. We may suspend or close an
        account that breaks these terms, and will explain why unless we are legally prevented from doing so.
      </P>

      <H2>11. Changes to these terms</H2>
      <P>
        We may update these terms. If a change materially affects you we will give notice in the app or by email before
        it applies. Continuing to use the service after that means you accept the new terms.
      </P>

      <H2>12. Governing law</H2>
      <P>
        {COMPANY.country
          ? `These terms are governed by the law of ${COMPANY.country}, and its courts have jurisdiction.`
          : 'These terms are governed by the law of the country in which we are established, and its courts have jurisdiction.'}{' '}
        If you are a consumer, this does not remove the protection of the mandatory consumer laws of the country where
        you live, and you may bring proceedings there.
      </P>
      <P>
        Questions about these terms: <Mail />. Last updated {LEGAL_LAST_UPDATED}.
      </P>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Cookie Policy                                                              */
/* -------------------------------------------------------------------------- */

type StorageRow = { name: string; kind: string; purpose: string; life: string }

const STORAGE_ROWS: StorageRow[] = [
  {
    name: 'Sign-in session',
    kind: 'Local storage (strictly necessary)',
    purpose: 'Keeps you signed in as you move between pages. Set by our authentication provider.',
    life: 'Until you sign out',
  },
  {
    name: 'Your progress cache',
    kind: 'Local storage (strictly necessary)',
    purpose:
      'A copy of your XP, completed lessons, streak and practice wallet so the app still works if the network drops.',
    life: 'Until you sign out or clear your browser',
  },
  {
    name: 'Daily bonus marker',
    kind: 'Local storage (strictly necessary)',
    purpose: 'Records that you already claimed the once-a-day XP bonus, so it cannot be claimed twice.',
    life: 'Rolling, one entry per day',
  },
  {
    name: 'Poll and challenge state',
    kind: 'Local storage (strictly necessary)',
    purpose: 'Remembers which daily poll you voted in and whether you joined this week’s challenge.',
    life: 'Until the next poll or challenge',
  },
]

function Cookies({ onNavigate }: { onNavigate: (slug: LegalSlug) => void }) {
  return (
    <>
      <P>
        This page explains the cookies and similar storage {COMPANY.productName} uses. It is short, because we use very
        little.
      </P>

      <H2>Why you are not seeing a cookie banner</H2>
      <P>
        Consent banners are required for storage that is not essential — advertising, analytics and tracking. We do not
        use any of those. Everything we store is strictly necessary to deliver the service you asked for, which UK and
        EU e-privacy rules exempt from consent. If we ever add analytics or advertising, we will ask for your consent
        first and this page will change.
      </P>

      <H2>What we actually store</H2>
      <P>
        We use your browser's local storage rather than cookies. It stays on your device and is not transmitted to us
        with every request.
      </P>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-[0.9rem]">
          <caption className="sr-only">Storage used by Tintomi</caption>
          <thead>
            <tr className="border-b border-[#232b25]">
              <th scope="col" className="py-2 pr-3 font-semibold text-[#e9ece8]">
                What
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold text-[#e9ece8]">
                Type
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold text-[#e9ece8]">
                Purpose
              </th>
              <th scope="col" className="py-2 font-semibold text-[#e9ece8]">
                Lifetime
              </th>
            </tr>
          </thead>
          <tbody>
            {STORAGE_ROWS.map((r) => (
              <tr key={r.name} className="border-b border-[#232b25]/60">
                <td className="py-2 pr-3 align-top text-[#e9ece8]">{r.name}</td>
                <td className="py-2 pr-3 align-top text-[#c3cbc4]">{r.kind}</td>
                <td className="py-2 pr-3 align-top text-[#c3cbc4]">{r.purpose}</td>
                <td className="py-2 align-top text-[#c3cbc4]">{r.life}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Third parties</H2>
      <UL>
        <li>
          <strong className="text-[#e9ece8]">No analytics or advertising.</strong> We run no Google Analytics, no
          tracking pixels, no advertising networks and no social media buttons.
        </li>
        <li>
          <strong className="text-[#e9ece8]">Fonts are self-hosted.</strong> Our typefaces are served from our own
          domain, so no request and no IP address goes to Google Fonts.
        </li>
        <li>
          <strong className="text-[#e9ece8]">Market data is fetched by our servers</strong>, not your browser, so the
          data provider never sees you.
        </li>
      </UL>

      <H2>Turning it off</H2>
      <P>
        You can clear local storage in your browser settings at any time. Because the items above are essential,
        clearing them will sign you out and the app may not work correctly until you sign in again.
      </P>
      <P>
        For the bigger picture see our <CrossLink slug="privacy" onNavigate={onNavigate} />. Last updated{' '}
        {LEGAL_LAST_UPDATED}.
      </P>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Page shell                                                                 */
/* -------------------------------------------------------------------------- */

const INTROS: Record<LegalSlug, string> = {
  privacy: 'What we collect, why, and how to get it deleted.',
  terms: 'The rules for using Tintomi.',
  cookies: 'What we store on your device, and why there is no banner.',
}

export function LegalPage({
  slug,
  onBack,
  onNavigate,
}: {
  slug: LegalSlug
  onBack: () => void
  onNavigate: (slug: LegalSlug) => void
}) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  useEffect(() => {
    const previous = document.title
    document.title = `${LEGAL_PAGES[slug]} | ${COMPANY.productName}`
    return () => {
      document.title = previous
    }
  }, [slug])

  return (
    <div className="relative min-h-dvh text-[#e9ece8]">
      <MeshBackdrop />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-24 pt-10 sm:pt-14">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 flex items-center gap-2 rounded-full text-sm font-bold tracking-tight text-[#a7b0a8] transition hover:text-[#e9ece8]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>

        <h1 className="tm-serif text-3xl text-[#e9ece8] sm:text-4xl">{LEGAL_PAGES[slug]}</h1>
        <p className="mt-2 text-[0.95rem] text-[#a7b0a8]">{INTROS[slug]}</p>
        <p className="mt-1 text-xs text-[#a7b0a8]">Last updated {LEGAL_LAST_UPDATED}</p>

        <div className="mt-8">
          {slug === 'privacy' ? <Privacy onNavigate={onNavigate} /> : null}
          {slug === 'terms' ? <Terms /> : null}
          {slug === 'cookies' ? <Cookies onNavigate={onNavigate} /> : null}
        </div>

        <nav aria-label="Other policies" className="mt-14 border-t border-[#232b25] pt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#a7b0a8]">Other policies</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {(Object.keys(LEGAL_PAGES) as LegalSlug[])
              .filter((s) => s !== slug)
              .map((s) => (
                <li key={s}>
                  <a
                    href={`/${s}`}
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate(s)
                    }}
                    className="text-[#5b9bff] underline underline-offset-2 hover:text-[#8fbaff]"
                  >
                    {LEGAL_PAGES[s]}
                  </a>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
