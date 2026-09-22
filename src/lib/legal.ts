/**
 * Single source of truth for legal/company details shown in the policy pages
 * and the site footer.
 *
 * ⚠️ BEFORE LAUNCH: every field marked TODO must be filled in. EU/UK e-commerce
 * rules (and Stripe's own terms) require a trader to publish their legal name,
 * geographic address and a contact email. Fields left null are simply omitted
 * from the rendered pages rather than shown as placeholders.
 */

export const LEGAL_LAST_UPDATED = '22 September 2026'

export const COMPANY = {
  /** Trading name shown to users. */
  productName: 'Tintomi',
  /** TODO: registered company name, or your full personal name if you trade as a sole trader. */
  legalName: null as string | null,
  /** TODO: company/VAT registration number, if you have one. */
  registrationNumber: null as string | null,
  /** TODO: full postal address. Required for EU/UK consumer law — a PO box is not enough. */
  address: null as string | null,
  /** TODO: country whose law governs the Terms and whose regulator hears complaints. */
  country: null as string | null,
  /**
   * Contact address for users, privacy requests and refunds.
   * TODO: replace with a role address (e.g. support@tintomi.com) before launch —
   * a personal inbox published on a public site attracts spam and mixes concerns.
   */
  contactEmail: 'bertranddilan32@gmail.com',
  website: 'https://www.tintomi.com',
} as const

/** Minimum age to hold an account. Under-13s are not permitted (US COPPA). */
export const MINIMUM_AGE = 13

/**
 * Age below which EEA/UK users need a parent or guardian to agree on their
 * behalf. GDPR Art. 8 lets each country set this between 13 and 16, so we use
 * the highest value and ask for parental involvement across the board.
 */
export const PARENTAL_CONSENT_AGE = 16

/** Third parties that process user data on our behalf. Keep in sync with reality. */
export const SUBPROCESSORS = [
  {
    name: 'Supabase',
    role: 'Accounts, database and image storage',
    location: 'United States (AWS us-east-1)',
    privacyUrl: 'https://supabase.com/privacy',
  },
  {
    name: 'Vercel',
    role: 'Website hosting and server logs',
    location: 'United States / global edge network',
    privacyUrl: 'https://vercel.com/legal/privacy-policy',
  },
  {
    name: 'Stripe',
    role: 'Payment processing for Tintomi Pro',
    location: 'United States / Ireland',
    privacyUrl: 'https://stripe.com/privacy',
  },
  {
    name: 'Resend',
    role: 'Sending account and weekly recap emails',
    location: 'United States',
    privacyUrl: 'https://resend.com/legal/privacy-policy',
  },
] as const

/** Market data source. We call it server-side, so no user data reaches it. */
export const MARKET_DATA_SOURCE = 'Yahoo Finance'
