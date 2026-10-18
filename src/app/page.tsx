import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Check, Scale, Search, ShieldCheck, ShoppingBag } from 'lucide-react';
import { supabase } from './lib/supabase';
import { CATEGORIES, LIVE_CATEGORIES, categoryLabel } from './lib/categories';
import { formatINR, savingsPercent } from './lib/format';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import ProductCard from './components/ProductCard';
import BrandMarquee from './components/BrandMarquee';
import VocalForLocal from './components/VocalForLocal';

export const dynamic = 'force-dynamic';

type SearchParams = {
  q?: string | string[];
  category?: string | string[];
};

const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? '';

function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 0C12 6.6 17.4 12 24 12C17.4 12 12 17.4 12 24C12 17.4 6.6 12 0 12C6.6 12 12 6.6 12 0Z" />
    </svg>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;

  // Clean the search text: characters with a special meaning in the filter syntax
  // are removed so they can't break the query.
  const q = first(sp.q)
    .replace(/[,()%*\\"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);

  const activeCategory = CATEGORIES.find((c) => c.slug === first(sp.category))?.slug;
  const hasFilters = Boolean(q || activeCategory);

  let query = supabase
    .from('products')
    .select('*, brand:brands(name, location)')
    .eq('verification_status', 'verified_by_team');

  if (activeCategory) query = query.eq('category', activeCategory);
  if (q) {
    query = query.or(`indian_product_name.ilike.%${q}%,foreign_replacement_name.ilike.%${q}%`);
  }

  // The results (affected by search and filters), and an overview of everything
  // verified (used for the stats, brand strip, category counts and hero card).
  const [resultsRes, overviewRes] = await Promise.all([
    query.order('indian_product_name'),
    supabase
      .from('products')
      .select(
        'id, indian_product_name, foreign_replacement_name, price_inr, foreign_price_inr, category, brand:brands(id, name, logo_url)'
      )
      .eq('verification_status', 'verified_by_team'),
  ]);

  // Print the real error directly to the screen
  if (resultsRes.error) {
    return (
      <div className="p-10 bg-red-50 text-red-600 font-mono">
        <h1 className="font-bold text-xl mb-4">Database Error:</h1>
        <pre>{JSON.stringify(resultsRes.error, null, 2)}</pre>
      </div>
    );
  }

  const products: any[] = resultsRes.data ?? [];
  const overview: any[] = overviewRes.data ?? [];

  // Everything below is calculated from real data. Nothing is made up.
  const brands = new Map<string, any>();
  const categoryCounts = new Map<string, number>();
  let featured: any = null;
  let bestSaving = -1;
  for (const p of overview) {
    if (p.brand?.id) brands.set(p.brand.id, p.brand);
    if (p.category) categoryCounts.set(p.category, (categoryCounts.get(p.category) ?? 0) + 1);
    const s = savingsPercent(p.price_inr, p.foreign_price_inr) ?? 0;
    if (!featured || s > bestSaving) {
      featured = p;
      bestSaving = s;
    }
  }
  const productCount = overview.length;
  const featuredSaving = featured ? savingsPercent(featured.price_inr, featured.foreign_price_inr) : null;

  // Category chips keep the current search text
  const hrefFor = (category?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    const qs = params.toString();
    return `${qs ? `/?${qs}` : '/'}#results`;
  };

  const chipBase = 'rounded-full px-5 py-2.5 text-sm font-medium border transition-colors';
  const chipOn = 'bg-ink text-ivory border-ink';
  const chipOff = 'border-ink/20 hover:border-ink hover:bg-ink/5';

  return (
    <div className="min-h-screen selection:bg-gold/30">
      <SiteHeader q={q} category={activeCategory} />

      <main>
        {/* HERO */}
        {/* The hero and the brand ticker together fill the first screen, so the ticker
            is visible without scrolling. 7.5rem is roughly the height of the header. */}
        <div className="flex min-h-[calc(100svh-7.5rem)] flex-col">
        <section className="flex flex-1 items-center">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-8 lg:grid-cols-2">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl short:lg:text-5xl leading-[0.95] uppercase">
              Find the Indian alternative to what you use
            </h1>
            <p className="mt-5 text-lg text-ink/70 max-w-lg">
              Compare global products with verified Indian alternatives: price, ingredients, ethics
              and the honest trade-off, side by side.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#results"
                className="rounded-full bg-ink text-ivory px-8 py-3.5 font-medium hover:bg-ink/90 transition-colors"
              >
                Browse alternatives
              </a>
              <a
                href="#how-it-works"
                className="rounded-full border border-ink/30 px-8 py-3.5 font-medium hover:bg-ink/5 transition-colors"
              >
                How it works
              </a>
            </div>

            {productCount > 0 && (
              <dl className="mt-8 flex divide-x divide-ink/15 short:hidden">
                {[
                  [productCount, productCount === 1 ? 'Verified alternative' : 'Verified alternatives'],
                  [brands.size, brands.size === 1 ? 'Indian brand' : 'Indian brands'],
                  [categoryCounts.size, categoryCounts.size === 1 ? 'Category live' : 'Categories live'],
                ].map(([value, label]) => (
                  <div key={label as string} className="px-5 first:pl-0 sm:px-8">
                    <dt className="font-display text-3xl md:text-4xl">{value}</dt>
                    <dd className="text-xs sm:text-sm text-ink/60 mt-1">{label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Hero art: a real comparison from your catalogue */}
          {featured && (
            <div className="relative hidden lg:block">
              <Sparkle className="absolute -top-4 left-6 h-10 w-10 text-ink" />
              <VocalForLocal className="absolute -top-6 -right-3 z-10 w-36" />
              <Sparkle className="absolute bottom-12 -left-3 h-8 w-8 text-ink" />
              <div className="rounded-[2rem] bg-gold/25 p-6 xl:p-8 short:p-4">
                <Link
                  href={`/product/${featured.id}`}
                  className="block rotate-1 rounded-3xl bg-white p-6 short:p-5 shadow-xl transition hover:rotate-0"
                >
                  <div className="text-xs font-mono uppercase tracking-wider text-ink/50">
                    Featured comparison
                  </div>

                  <div className="mt-4 opacity-60">
                    <div className="text-xs font-mono uppercase tracking-wider">Foreign</div>
                    <div className="font-display text-xl leading-tight mt-1">{featured.foreign_replacement_name}</div>
                    <div className="mt-1 text-lg line-through">{formatINR(featured.foreign_price_inr)}</div>
                  </div>

                  <div className="my-4 flex items-center gap-3 text-xs font-mono text-ink/50">
                    <span className="h-px flex-1 bg-ink/15" /> REPLACED BY <span className="h-px flex-1 bg-ink/15" />
                  </div>

                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-leaf">Indian alternative</div>
                    <div className="font-display text-2xl leading-tight mt-1">{featured.indian_product_name}</div>
                    <div className="mt-1 text-sm text-ink/70">by {featured.brand?.name}</div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="font-display text-3xl">{formatINR(featured.price_inr)}</span>
                      {featuredSaving !== null && (
                        <span className="rounded-full bg-leaf/15 px-2.5 py-1 text-xs font-bold text-leaf">
                          {featuredSaving}% lower price
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium">
                    See full comparison <ArrowUpRight className="h-4 w-4" />
                  </div>
                </Link>
              </div>
            </div>
          )}
          </div>
        </section>

        {/* BRAND STRIP (scrolling) */}
        <BrandMarquee brands={[...brands.values()]} />
        </div>

        {/* CATEGORY TILES */}
        <section id="categories" className="max-w-6xl mx-auto px-6 pt-20 scroll-mt-6">
          <h2 className="font-display text-4xl md:text-5xl uppercase text-center">Browse by category</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-6">
            {CATEGORIES.map((c, i) => {
              const count = categoryCounts.get(c.slug) ?? 0;
              const span = i === 0 ? 'md:col-span-4' : 'md:col-span-2';
              const base = `relative overflow-hidden rounded-3xl min-h-[15rem] md:min-h-[17rem] ${span}`;

              // Categories we haven't opened yet
              if (c.comingSoon) {
                return (
                  <div
                    key={c.slug}
                    className={`${base} flex flex-col justify-between border-2 border-dashed border-ink/20 bg-ink/[0.03] p-6 md:p-8`}
                  >
                    <div>
                      <h3 className="font-display text-2xl leading-tight text-ink/70 md:text-3xl">{c.label}</h3>
                      <p className="mt-2 text-sm text-ink/50">{c.description}</p>
                    </div>
                    <span className="self-start rounded-full bg-ink/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-ink/60">
                      Coming soon
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={c.slug}
                  href={`/?category=${c.slug}#results`}
                  className={`${base} group flex flex-col justify-end bg-ink p-6 text-ivory transition hover:shadow-xl md:p-8`}
                >
                  {c.image && (
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      sizes={i === 0 ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 100vw'}
                      className="object-cover transition duration-500 group-hover:scale-105"
                      style={{ objectPosition: c.imagePosition ?? 'center' }}
                    />
                  )}
                  {/* Dark fade so the text stays readable on any photo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />

                  <div className="relative">
                    <h3 className="font-display text-2xl leading-tight md:text-3xl">{c.label}</h3>
                    <p className="mt-2 text-sm text-ivory/80">{c.description}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="rounded-full bg-ivory/90 px-3 py-1 text-xs font-bold text-ink">
                        {count === 0 ? 'Products arriving soon' : `${count} verified`}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory text-ink transition group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* RESULTS */}
        <section id="results" className="max-w-6xl mx-auto px-6 pt-20 scroll-mt-6">
          <h2 className="font-display text-4xl md:text-5xl uppercase text-center">Verified alternatives</h2>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Link href={hrefFor()} className={`${chipBase} ${!activeCategory ? chipOn : chipOff}`}>
              All
            </Link>
            {LIVE_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={hrefFor(c.slug)}
                title={c.description}
                className={`${chipBase} ${activeCategory === c.slug ? chipOn : chipOff}`}
              >
                {c.short}
              </Link>
            ))}
          </div>

          {hasFilters && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-ink/70">
              <span>
                {products.length} {products.length === 1 ? 'alternative' : 'alternatives'}
                {q && <> for &ldquo;{q}&rdquo;</>}
                {activeCategory && <> in {categoryLabel(activeCategory)}</>}
              </span>
              <Link href="/#results" className="underline hover:opacity-60">Clear filters</Link>
            </div>
          )}

          {products.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-ink/10 bg-white p-10 text-center text-ink/70">
              {hasFilters ? (
                <>
                  <p className="font-medium text-ink mb-1">No verified alternatives match that yet.</p>
                  <p className="text-sm">
                    Try a different search, or{' '}
                    <Link href="/submit" className="underline hover:opacity-60">
                      submit an Indian brand
                    </Link>{' '}
                    that should be here.
                  </p>
                </>
              ) : (
                <p>No verified products yet.</p>
              )}
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-6 pt-24 scroll-mt-6">
          <h2 className="font-display text-4xl md:text-5xl uppercase text-center">How it works</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: 'Search what you use',
                text: 'Type the global product you buy today, or browse by category.',
              },
              {
                icon: Scale,
                title: 'Compare honestly',
                text: 'See price, ingredients and ethics side by side, plus where the Indian product falls short.',
              },
              {
                icon: ShoppingBag,
                title: 'Buy direct',
                text: "Go straight to the brand's own page to buy. We don't sell anything.",
              },
            ].map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="rounded-3xl border border-ink/10 bg-white p-8">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-ivory">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-4xl text-ink/15">0{i + 1}</span>
                </div>
                <h3 className="mt-6 font-display text-xl">{title}</h3>
                <p className="mt-2 text-sm text-ink/70">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl bg-leaf/10 p-8 md:p-10">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-leaf" />
              <h3 className="font-display text-xl">What &ldquo;verified&rdquo; means here</h3>
            </div>
            <ul className="mt-5 grid gap-4 text-sm md:grid-cols-3">
              {[
                "We check each brand's company registration (CIN) before listing it.",
                'We review the evidence behind a product’s claims before it goes live.',
                'Every comparison lists a trade-off, so you see the downsides too.',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="h-5 w-5 shrink-0 text-leaf mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* BRAND CTA */}
        <section className="max-w-6xl mx-auto px-6 pt-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink text-ivory p-10 md:p-14">
            <Sparkle className="absolute right-8 top-8 h-12 w-12 text-gold" />
            <Sparkle className="absolute right-24 bottom-8 h-6 w-6 text-ivory/60" />
            <h2 className="font-display text-3xl md:text-5xl uppercase max-w-xl leading-tight">
              Run an Indian brand? Get listed.
            </h2>
            <p className="mt-4 max-w-lg text-ivory/70">
              Submit your brand and the products that replace a foreign alternative. We verify
              everything before it appears.
            </p>
            <Link
              href="/submit"
              className="mt-8 inline-flex rounded-full bg-ivory text-ink px-8 py-3.5 font-medium hover:bg-white transition-colors"
            >
              Submit your brand
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
