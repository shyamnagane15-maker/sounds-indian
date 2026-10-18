import Link from 'next/link';
import { LIVE_CATEGORIES } from '../lib/categories';
import Logo from './Logo';

export default function SiteFooter() {
  const linkClass = 'text-ivory/70 hover:text-ivory transition-colors';

  return (
    <footer className="bg-ink text-ivory mt-24">
      <div className="max-w-6xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="dark" />
          <p className="mt-3 text-sm text-ivory/70 max-w-xs">
            Verified Indian alternatives to the global products you already use, with the honest
            trade-offs included.
          </p>
        </div>

        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-ivory/50 mb-4">Explore</div>
          <ul className="space-y-2 text-sm">
            {LIVE_CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/?category=${c.slug}#results`} className={linkClass}>{c.short}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-ivory/50 mb-4">For brands</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/submit" className={linkClass}>Submit a brand</Link></li>
            <li><Link href="/brand/login" className={linkClass}>Brand login</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-ivory/50 mb-4">About</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#how-it-works" className={linkClass}>How it works</Link></li>
            <li><Link href="/#categories" className={linkClass}>Categories</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-ivory/50 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Sounds Indian</span>
          <span>
            Sounds Indian is an independent directory. Prices are shown as listed by brands and
            stores and can change.
          </span>
        </div>
      </div>
    </footer>
  );
}
