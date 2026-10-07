import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabaseServer';
import { CATEGORIES } from '../../../lib/categories';
import { saveBrandProduct, deleteBrandProduct } from '../../actions';

export const dynamic = 'force-dynamic';

const TAG_OPTIONS = ['ingredients', 'ethics', 'price', 'sourcing', 'certification', 'other'];
// Suggested type for each empty row, in order
const DEFAULT_TAGS = ['ingredients', 'ethics', 'price', 'sourcing', 'certification'];

const inputClass =
  'w-full px-3 py-2.5 rounded-md border border-ink/20 bg-white focus:outline-none focus:border-ink';
const labelClass = 'block text-sm font-medium mb-1';
const hintClass = 'text-xs text-ink/60 mt-1';

const tagOrder = (tag: string) => {
  const i = TAG_OPTIONS.indexOf(tag);
  return i === -1 ? 99 : i;
};

// This one page handles both /brand/products/new and /brand/products/<id>
export default async function BrandProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorMessage } = await searchParams;
  const isNew = id === 'new';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/brand/login');

  const { data: brand } = await supabase
    .from('brands')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!brand) redirect('/brand/dashboard');

  let product: any = null;
  if (!isNew) {
    // Only this brand's own products; anything else is a 404
    const { data } = await supabase
      .from('products')
      .select('*, points:comparison_points(id, tag, content)')
      .eq('id', id)
      .eq('brand_id', brand.id)
      .maybeSingle();
    if (!data) notFound();
    product = data;
  }

  const isLive = product?.verification_status === 'verified_by_team';
  const existingPoints = [...(product?.points ?? [])].sort(
    (a: any, b: any) => tagOrder(a.tag) - tagOrder(b.tag)
  );
  const slots = Math.max(5, existingPoints.length + 1);

  return (
    <div className="min-h-screen bg-ivory text-ink font-sans selection:bg-gold/30">
      <nav className="max-w-3xl mx-auto px-6 py-8 flex justify-between items-center">
        <Link href="/" className="text-2xl font-serif font-black tracking-tight">Sounds Indian.</Link>
        <Link href="/brand/dashboard" className="text-sm font-medium hover:text-madder transition-colors">
          ← Back to dashboard
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pb-20">
        <h1 className="text-3xl font-serif mb-2">
          {isNew ? 'Add a product' : product.indian_product_name}
        </h1>
        <p className="text-sm text-ink/70 mb-8">
          {brand.name} · Our team checks every claim before a product goes live.
        </p>

        {isLive && (
          <p className="mb-6 rounded-md border border-gold/60 bg-gold/10 p-3 text-sm">
            This product is live. Saving changes sends it back to review, and it will be hidden from
            the public site until our team verifies it again.
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="mb-6 rounded-md border border-madder/30 bg-madder/5 p-3 text-sm text-madder">
            {errorMessage}
          </p>
        )}

        <form action={saveBrandProduct} className="space-y-10">
          <input type="hidden" name="id" value={isNew ? '' : product.id} />

          {/* Your product */}
          <section className="space-y-5">
            <h2 className="text-xl font-serif">Your product</h2>
            <div>
              <label htmlFor="indian_product_name" className={labelClass}>Name</label>
              <input id="indian_product_name" name="indian_product_name" required maxLength={150}
                defaultValue={product?.indian_product_name ?? ''} className={inputClass} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className={labelClass}>Category</label>
                <select id="category" name="category" required
                  defaultValue={product?.category ?? ''} className={inputClass}>
                  <option value="">Choose a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.label}</option>
                  ))}
                </select>
                <p className={hintClass}>
                  Pick Ayurvedic / natural only if you position the product as Ayurvedic or herbal.
                </p>
              </div>
              <div>
                <label htmlFor="price_inr" className={labelClass}>Price (₹)</label>
                <input id="price_inr" name="price_inr" type="number" step="any" min="0"
                  defaultValue={product?.price_inr ?? ''} className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="buy_url" className={labelClass}>Link to buy</label>
              <input id="buy_url" name="buy_url" type="url" required placeholder="https://"
                defaultValue={product?.buy_url ?? ''} className={inputClass} />
            </div>
          </section>

          {/* Foreign product */}
          <section className="space-y-5">
            <h2 className="text-xl font-serif">The foreign product it replaces</h2>
            <div>
              <label htmlFor="foreign_replacement_name" className={labelClass}>Name</label>
              <input id="foreign_replacement_name" name="foreign_replacement_name" required maxLength={150}
                defaultValue={product?.foreign_replacement_name ?? ''} className={inputClass} />
            </div>
            <div>
              <label htmlFor="foreign_price_inr" className={labelClass}>Price in India (₹)</label>
              <input id="foreign_price_inr" name="foreign_price_inr" type="number" step="any" min="0"
                defaultValue={product?.foreign_price_inr ?? ''} className={inputClass} />
              <p className={hintClass}>What it costs on a major Indian store today.</p>
            </div>
          </section>

          {/* Comparison points */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-serif">Comparison points</h2>
              <p className={hintClass}>
                How your product compares: ingredients, certifications, price. Include a link to the
                certificate or test report where you can. Leave a row empty to skip it.
              </p>
            </div>
            {Array.from({ length: slots }).map((_, i) => {
              const point = existingPoints[i];
              return (
                <div key={i} className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                  <select name={`point_tag_${i}`} aria-label={`Point ${i + 1} type`}
                    defaultValue={point?.tag ?? DEFAULT_TAGS[i] ?? 'other'} className={inputClass}>
                    {TAG_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <textarea name={`point_content_${i}`} rows={2} maxLength={500}
                    aria-label={`Point ${i + 1} text`}
                    defaultValue={point?.content ?? ''} className={inputClass} />
                </div>
              );
            })}
          </section>

          {/* Trade-off */}
          <section>
            <label htmlFor="trade_off" className="block text-xl font-serif mb-1">Trade-off</label>
            <p className={`${hintClass} mb-2`}>
              Where does your product fall short of the foreign one? Visitors trust honest answers.
            </p>
            <textarea id="trade_off" name="trade_off" rows={3} maxLength={600}
              defaultValue={product?.trade_off ?? ''} className={inputClass} />
          </section>

          <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-8">
            <button
              type="submit"
              className="bg-ink text-ivory px-5 py-2.5 rounded-md font-medium hover:bg-ink/90 transition-colors"
            >
              {isNew ? 'Submit for review' : 'Save changes'}
            </button>
            <Link
              href="/brand/dashboard"
              className="border border-ink/30 px-5 py-2.5 rounded-md font-medium hover:bg-ink/5 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Delete lives outside the main form (forms can't be nested) */}
        {!isNew && (
          <details className="mt-12 rounded-md border border-madder/30 p-4">
            <summary className="cursor-pointer font-medium text-madder">Delete this product</summary>
            <p className="text-sm text-ink/70 my-3">
              This permanently removes the product and its comparison points.
            </p>
            <form action={deleteBrandProduct}>
              <input type="hidden" name="id" value={product.id} />
              <button className="bg-madder text-ivory px-5 py-2.5 rounded-md font-medium hover:bg-madder/90 transition-colors">
                Yes, delete permanently
              </button>
            </form>
          </details>
        )}
      </main>
    </div>
  );
}