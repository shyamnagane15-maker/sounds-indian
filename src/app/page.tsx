import Link from 'next/link';
import { Search, Check, FlaskConical, Leaf, Tag, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from './lib/supabase';
import { CATEGORIES, categoryLabel } from './lib/categories';

export const dynamic = 'force-dynamic';

type SearchParams = {
  q?: string | string[];
  category?: string | string[];
};

const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? '';

// Helper to map DB tags to Lucide icons
const getIconForTag = (tag: string) => {
  switch (tag) {
    case 'ingredients': return <FlaskConical className="w-5 h-5 text-ink/50 shrink-0 mt-0.5" />;
    case 'ethics': return <Leaf className="w-5 h-5 text-ink/50 shrink-0 mt-0.5" />;
    case 'price': return <Tag className="w-5 h-5 text-ink/50 shrink-0 mt-0.5" />;
    default: return <Check className="w-5 h-5 text-ink/50 shrink-0 mt-0.5" />;
  }
};

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;

  // Clean the search text: characters that have a special meaning in the filter
  // syntax are removed so they can't break the query.
  const q = first(sp.q)
    .replace(/[,()%*\\"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);

  const activeCategory = CATEGORIES.find((c) => c.slug === first(sp.category))?.slug;
  const hasFilters = Boolean(q || activeCategory);

  let query = supabase
    .from('products')
    .select(`
      *,
      brand:brands(name, location),
      points:comparison_points(id, tag, content)
    `)
    .eq('verification_status', 'verified_by_team');

  if (activeCategory) query = query.eq('category', activeCategory);
  if (q) {
    query = query.or(`indian_product_name.ilike.%${q}%,foreign_replacement_name.ilike.%${q}%`);
  }

  const { data: products, error } = await query.order('indian_product_name');

  // Print the real error directly to the screen
  if (error) {
    return (
      <div className="p-10 bg-red-50 text-red-600 font-mono">
        <h1 className="font-bold text-xl mb-4">Database Error:</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  // Category chips keep the current search text
  const hrefFor = (category?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  };

  const chipBase = 'px-4 py-2 rounded-full text-sm font-medium border transition-colors';
  const chipOn = 'bg-ink text-ivory border-ink';
  const chipOff = 'border-ink/20 hover:border-ink hover:bg-ink/5';

  return (
    <div className="min-h-screen bg-ivory text-ink font-sans selection:bg-gold/30">
      <nav className="max-w-5xl mx-auto px-6 py-8 flex justify-between items-center">
        <Link href="/" className="text-2xl font-serif font-black tracking-tight">Sounds Indian.</Link>
        <Link
          href="/submit"
          className="text-sm font-medium border-b border-ink hover:text-madder transition-colors"
        >
          Submit a Brand
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pb-20">
        <header className="py-12 md:py-20 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-serif leading-tight mb-6">
            Discover verified Indian alternatives to global brands.
          </h1>
          <p className="text-lg text-ink/80 mb-8 max-w-xl">
            Search for a foreign product you use. We&apos;ll show you the closest Indian equivalent, backed by verified ingredient, sourcing, and spec comparisons.
          </p>

          <form action="/" method="get" className="flex flex-col sm:flex-row gap-3">
            {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-ink/40" />
              <input
                key={q}
                type="text"
                name="q"
                defaultValue={q}
                maxLength={60}
                aria-label="Search for a product"
                placeholder="e.g. Nescafé, AirPods, CeraVe..."
                className="w-full pl-10 pr-4 py-3 rounded-md border border-ink/20 focus:outline-none focus:border-ink bg-white shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-ink text-ivory px-6 py-3 rounded-md font-medium hover:bg-ink/90 transition-colors"
            >
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={hrefFor()} className={`${chipBase} ${!activeCategory ? chipOn : chipOff}`}>
              All
            </Link>
            {CATEGORIES.map((c) => (
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
        </header>

        {hasFilters && (
          <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/70">
            <span>
              {products?.length ?? 0} {products?.length === 1 ? 'alternative' : 'alternatives'}
              {q && <> for &ldquo;{q}&rdquo;</>}
              {activeCategory && <> in {categoryLabel(activeCategory)}</>}
            </span>
            <Link href="/" className="underline hover:text-madder">Clear filters</Link>
          </div>
        )}

        {products?.length === 0 && (
          <div className="rounded-xl border border-ink/10 bg-white p-8 text-ink/70">
            {hasFilters ? (
              <>
                <p className="font-medium text-ink mb-1">No verified alternatives match that yet.</p>
                <p className="text-sm">
                  Try a different search, or{' '}
                  <Link href="/submit" className="underline hover:text-madder">
                    submit an Indian brand
                  </Link>{' '}
                  that should be here.
                </p>
              </>
            ) : (
              <p>No verified products yet.</p>
            )}
          </div>
        )}

        {/* Dynamic Comparison Cards */}
        {products?.map((product: any) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-ink/10 shadow-sm p-6 md:p-8 flex flex-col lg:flex-row gap-8 relative overflow-hidden mb-12"
          >
            {/* LEFT: Foreign Product (faded) */}
            <div className="flex-1 opacity-60 border-2 border-dashed border-ink/20 rounded-xl p-6 bg-ink/[0.02]">
              <div className="text-xs font-mono text-ink/60 uppercase tracking-wider mb-2">Foreign Counterpart</div>
              <h3 className="text-2xl font-serif mb-1">{product.foreign_replacement_name}</h3>

              <div className="flex items-end gap-3 my-6">
                <span className="text-xl font-bold">₹{product.foreign_price_inr}</span>
              </div>

              <div className="text-sm text-ink/70 font-mono">
                <strong>Why it&apos;s replaced:</strong>
                <br />
                <br />
                Imported products often face massive markups in India due to customs duties. Sounds Indian verifies local alternatives that match the core specifications without the import premium.
              </div>
            </div>

            {/* Divider (desktop) */}
            <div className="hidden lg:flex flex-col items-center justify-center px-4">
              <div className="w-px h-full bg-ink/10"></div>
              <div className="py-2 text-xs font-mono text-ink/40 bg-white z-10 whitespace-nowrap">REPLACED BY</div>
              <div className="w-px h-full bg-ink/10"></div>
            </div>

            {/* Divider (mobile) */}
            <div className="flex lg:hidden items-center justify-center py-4">
              <div className="h-px w-full bg-ink/10"></div>
              <div className="px-2 text-xs font-mono text-ink/40 bg-white z-10 whitespace-nowrap">REPLACED BY</div>
              <div className="h-px w-full bg-ink/10"></div>
            </div>

            {/* RIGHT: Indian Hero Product */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs font-mono text-ink/60 uppercase tracking-wider mb-1">
                    Indian Alternative
                    {categoryLabel(product.category) && <> · {categoryLabel(product.category)}</>}
                  </div>
                  <h2 className="text-3xl font-serif mb-1">{product.indian_product_name}</h2>
                  <p className="text-sm font-medium text-ink/80">
                    by {product.brand?.name} ({product.brand?.location})
                  </p>
                </div>
                {product.verification_status.includes('verified') && (
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-dashed border-leaf bg-leaf/5 shrink-0">
                    <Check className="text-leaf w-5 h-5" />
                    <span className="text-[9px] font-mono font-bold text-leaf uppercase mt-0.5">Verified</span>
                  </div>
                )}
              </div>

              <div className="flex items-end gap-3 mb-6">
                <span className="text-2xl font-bold">₹{product.price_inr}</span>
              </div>

              <ul className="space-y-4 text-sm mb-8">
                {product.points?.map((point: any) => (
                  <li key={point.id} className="flex gap-3">
                    {getIconForTag(point.tag)}
                    <div>
                      <span className="font-bold capitalize">{point.tag}:</span> {point.content}
                    </div>
                  </li>
                ))}

                {/* Mandatory Trade-off */}
                <li className="flex gap-3 bg-madder/5 p-3 rounded-md border border-madder/20 mt-4">
                  <AlertCircle className="w-5 h-5 text-madder shrink-0 mt-0.5" />
                  <div className="text-madder">
                    <span className="font-bold">Trade-off:</span> {product.trade_off}
                  </div>
                </li>
              </ul>

              <a
                href={product.buy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto bg-ink text-ivory px-6 py-3 rounded-md font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2 inline-flex"
              >
                Buy on {product.brand?.name} <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}