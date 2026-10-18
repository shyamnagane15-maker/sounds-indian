import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertCircle, Check, ExternalLink, FlaskConical, Leaf, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { categoryLabel } from '../../lib/categories';
import { formatINR, savingsPercent } from '../../lib/format';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import ProductCard from '../../components/ProductCard';

export const dynamic = 'force-dynamic';

const TAG_ORDER = ['ingredients', 'ethics', 'price', 'sourcing', 'certification', 'other'];

const getIconForTag = (tag: string) => {
  const cls = 'h-5 w-5 shrink-0 mt-0.5 text-ink/50';
  switch (tag) {
    case 'ingredients': return <FlaskConical className={cls} />;
    case 'ethics': return <Leaf className={cls} />;
    case 'price': return <Tag className={cls} />;
    default: return <Check className={cls} />;
  }
};

// Only verified products are returned. Anything else is "not found",
// both here and through the database's row-level security.
const getProduct = cache(async (id: string) => {
  const { data } = await supabase
    .from('products')
    .select(
      '*, brand:brands(id, name, location, logo_url, founding_story, website), points:comparison_points(id, tag, content)'
    )
    .eq('id', id)
    .eq('verification_status', 'verified_by_team')
    .maybeSingle();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: 'Product not found' };
  return {
    title: `${product.indian_product_name}: Indian alternative to ${product.foreign_replacement_name}`,
    description: `Compare ${product.indian_product_name} by ${product.brand?.name} with ${product.foreign_replacement_name}: price, ingredients, ethics and the honest trade-off.`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product: any = await getProduct(id);
  if (!product) notFound();

  const brand = product.brand;
  const saving = savingsPercent(product.price_inr, product.foreign_price_inr);
  const price = formatINR(product.price_inr);
  const foreignPrice = formatINR(product.foreign_price_inr);

  const points = [...(product.points ?? [])].sort((a: any, b: any) => {
    const ai = TAG_ORDER.indexOf(a.tag);
    const bi = TAG_ORDER.indexOf(b.tag);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // More verified alternatives from the same category
  let related: any[] = [];
  if (product.category) {
    const { data } = await supabase
      .from('products')
      .select('*, brand:brands(name)')
      .eq('verification_status', 'verified_by_team')
      .eq('category', product.category)
      .neq('id', product.id)
      .limit(3);
    related = data ?? [];
  }

  return (
    <div className="min-h-screen selection:bg-gold/30">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 pt-8 pb-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-ink/60 flex flex-wrap gap-x-2">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/?category=${product.category}#results`} className="hover:text-ink">
                {categoryLabel(product.category) ?? 'Category'}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-ink">{product.indian_product_name}</span>
        </nav>

        {/* Title */}
        <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-6xl uppercase leading-[0.95]">
              {product.indian_product_name}
            </h1>
            <p className="mt-4 text-lg text-ink/70">
              Indian alternative to {product.foreign_replacement_name}
              {brand?.name && <> · by {brand.name}</>}
              {brand?.location && <> ({brand.location})</>}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-leaf bg-leaf/5 px-4 py-2 text-sm font-bold text-leaf">
            <Check className="h-4 w-4" /> Verified by our team
          </span>
        </header>

        {/* Side-by-side comparison */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-3xl border-2 border-dashed border-ink/20 bg-ink/[0.02] p-6 md:p-8 opacity-80">
            <div className="text-xs font-mono uppercase tracking-wider text-ink/60 mb-2">Foreign counterpart</div>
            <h2 className="font-display text-2xl md:text-3xl leading-tight">{product.foreign_replacement_name}</h2>
            <div className="mt-8 text-4xl font-bold text-ink/60">{foreignPrice || 'Price not listed'}</div>
            <p className="mt-1 text-xs text-ink/50">Listed price in India</p>
          </div>

          <div className="flex items-center justify-center gap-3 text-xs font-mono text-ink/50 whitespace-nowrap lg:flex-col">
            <span className="h-px w-10 bg-ink/20 lg:h-10 lg:w-px" />
            REPLACED BY
            <span className="h-px w-10 bg-ink/20 lg:h-10 lg:w-px" />
          </div>

          <div className="rounded-3xl border border-ink/10 bg-white p-6 md:p-8 shadow-sm">
            <div className="text-xs font-mono uppercase tracking-wider text-leaf mb-2">Indian alternative</div>
            <h2 className="font-display text-2xl md:text-3xl leading-tight">{product.indian_product_name}</h2>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="font-display text-4xl">{price || 'Price not listed'}</span>
              {saving !== null && (
                <span className="rounded-full bg-leaf/15 px-3 py-1 text-sm font-bold text-leaf">
                  {saving}% lower price
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-ink/50">Listed price</p>
          </div>
        </section>
        <p className="mt-3 text-xs text-ink/50">
          Prices are the listed prices from the brand and stores, and can change. Pack sizes can
          differ, so check the comparison points below for per-unit costs.
        </p>

        {/* Details */}
        <section className="mt-12 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="font-display text-3xl uppercase">How they compare</h2>

            {points.length > 0 ? (
              <ul className="mt-6 space-y-4 rounded-3xl border border-ink/10 bg-white p-6 md:p-8">
                {points.map((point: any) => (
                  <li key={point.id} className="flex gap-3 text-sm md:text-base">
                    {getIconForTag(point.tag)}
                    <div>
                      <span className="font-bold capitalize">{point.tag}:</span> {point.content}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-ink/60">No comparison points yet.</p>
            )}

            {product.trade_off && (
              <div className="mt-6 flex gap-3 rounded-3xl border border-madder/20 bg-madder/5 p-6">
                <AlertCircle className="h-5 w-5 shrink-0 text-madder mt-0.5" />
                <div className="text-madder">
                  <div className="font-bold">The trade-off</div>
                  <p className="mt-1">{product.trade_off}</p>
                </div>
              </div>
            )}
          </div>

          {/* Buy + brand */}
          <aside className="space-y-6">
            {product.buy_url && (
              <div className="rounded-3xl bg-ink p-6 text-ivory">
                <div className="font-display text-3xl">{price}</div>
                <a
                  href={product.buy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 rounded-full bg-ivory px-6 py-3.5 font-medium text-ink hover:bg-white transition-colors"
                >
                  Buy on {brand?.name ?? 'the brand site'} <ExternalLink className="h-4 w-4" />
                </a>
                <p className="mt-3 text-xs text-ivory/60">Opens the brand&apos;s own page. We don&apos;t sell anything.</p>
              </div>
            )}

            {brand && (
              <div className="rounded-3xl border border-ink/10 bg-white p-6">
                <div className="text-xs font-mono uppercase tracking-wider text-ink/50 mb-4">About the brand</div>
                <div className="flex items-center gap-4">
                  {brand.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brand.logo_url}
                      alt={`${brand.name} logo`}
                      className="h-14 w-14 shrink-0 rounded-xl border border-ink/10 bg-white object-contain p-1"
                    />
                  )}
                  <div>
                    <div className="font-display text-xl">{brand.name}</div>
                    {brand.location && <div className="text-sm text-ink/60">{brand.location}</div>}
                  </div>
                </div>
                {brand.founding_story && (
                  <p className="mt-4 whitespace-pre-line text-sm text-ink/80">{brand.founding_story}</p>
                )}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium underline hover:text-madder"
                  >
                    Brand website <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </aside>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-3xl uppercase">More in {categoryLabel(product.category)}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}