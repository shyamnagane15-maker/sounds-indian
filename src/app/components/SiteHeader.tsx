import Link from 'next/link';
import { Search, Menu } from 'lucide-react';
import Logo from './Logo';

function SearchPill({
  q,
  category,
  className = '',
}: {
  q: string;
  category?: string;
  className?: string;
}) {
  return (
    <form action="/#results" method="get" className={`relative ${className}`}>
      {category && <input type="hidden" name="category" value={category} />}
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink/40" />
      <input
        key={q}
        type="text"
        name="q"
        defaultValue={q}
        maxLength={60}
        aria-label="Search for a product you use"
        placeholder="Search a product you use, e.g. CeraVe"
        className="w-full rounded-full bg-ink/[0.06] pl-12 pr-4 py-3 text-sm placeholder:text-ink/45 focus:outline-none focus:ring-2 focus:ring-ink/30"
      />
    </form>
  );
}

export default function SiteHeader({ q = '', category }: { q?: string; category?: string }) {
  const linkClass = 'text-sm font-medium hover:text-madder transition-colors';

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-ink text-ivory text-center text-xs sm:text-sm py-2.5 px-4">
        Every alternative is checked by our team before it goes live.{' '}
        <Link href="/submit" className="underline font-medium">
          Submit a brand
        </Link>
      </div>

      <header className="border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4 md:gap-8">
          <Link href="/" aria-label="Sounds Indian, home" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#categories" className={linkClass}>Categories</Link>
            <Link href="/#how-it-works" className={linkClass}>How it works</Link>
            <Link href="/submit" className={linkClass}>Submit a brand</Link>
          </nav>

          <SearchPill q={q} category={category} className="hidden md:block flex-1" />

          <Link
            href="/brand/login"
            className="hidden md:inline-flex shrink-0 rounded-full bg-ink text-ivory px-5 py-2.5 text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            Brand login
          </Link>

          {/* Mobile menu (no JavaScript needed) */}
          <details className="md:hidden ml-auto relative">
            <summary
              aria-label="Menu"
              className="list-none cursor-pointer p-2 rounded-full hover:bg-ink/5 [&::-webkit-details-marker]:hidden"
            >
              <Menu className="h-6 w-6" />
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-ink/10 shadow-lg p-2 z-20">
              {[
                ['/#categories', 'Categories'],
                ['/#how-it-works', 'How it works'],
                ['/submit', 'Submit a brand'],
                ['/brand/login', 'Brand login'],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-ink/5">
                  {label}
                </Link>
              ))}
            </div>
          </details>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-6 pb-4">
          <SearchPill q={q} category={category} />
        </div>
      </header>
    </>
  );
}
