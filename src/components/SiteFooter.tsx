import { COMPANY } from '../lib/legal'
import { LEGAL_PAGES, type LegalSlug } from '../lib/routes'

/**
 * Footer carrying the policy links and trader identity details that EU/UK
 * e-commerce rules require to be available from every page.
 */
export function SiteFooter({
  onNavigate,
  className = '',
}: {
  onNavigate: (slug: LegalSlug) => void
  className?: string
}) {
  const identity = [COMPANY.legalName, COMPANY.registrationNumber, COMPANY.address, COMPANY.country].filter(
    (v): v is string => !!v,
  )

  return (
    <footer className={`border-t border-[#232b25] px-4 py-8 text-center sm:px-8 ${className}`}>
      <nav aria-label="Legal">
        <ul className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          {(Object.keys(LEGAL_PAGES) as LegalSlug[]).map((slug) => (
            <li key={slug}>
              <a
                href={`/${slug}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(slug)
                }}
                className="rounded text-[#a7b0a8] underline-offset-2 transition hover:text-[#e9ece8] hover:underline"
              >
                {LEGAL_PAGES[slug]}
              </a>
            </li>
          ))}
          <li>
            <a
              href={`mailto:${COMPANY.contactEmail}`}
              className="rounded text-[#a7b0a8] underline-offset-2 transition hover:text-[#e9ece8] hover:underline"
            >
              Contact
            </a>
          </li>
        </ul>
      </nav>

      <p className="mx-auto mt-5 max-w-2xl text-xs leading-relaxed text-[#a7b0a8]">
        {COMPANY.productName} is an educational service. It is not a broker, bank or investment adviser, and nothing
        here is financial advice. All trading in the app uses simulated money.
      </p>

      {identity.length > 0 ? (
        <p className="mx-auto mt-3 max-w-2xl text-xs text-[#a7b0a8]">{identity.join(' · ')}</p>
      ) : null}

      <p className="mt-3 text-xs text-[#a7b0a8]">
        © {new Date().getFullYear()} {COMPANY.legalName ?? COMPANY.productName}
      </p>
    </footer>
  )
}
