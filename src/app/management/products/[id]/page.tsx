import Link from 'next/link';
import { CATEGORIES } from '../../../lib/categories';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { admin } from '../../../lib/supabaseAdmin';
import { saveProduct, deleteProduct } from './actions';

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

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error: errorMessage, saved } = await searchParams;

  const { data: product } = await admin
    .from('products')
    .select('*, brand:brands(name, location, cin, website), points:comparison_points(id, tag, content)')
    .eq('id', id)
    .single();

  if (!product) notFound();

  const isVerified = product.verification_status === 'verified_by_team';
  const existingPoints = [...(product.points ?? [])].sort(
    (a: any, b: any) => tagOrder(a.tag) - tagOrder(b.tag)
  );
  const slots = Math.max(5, existingPoints.length + 1);

  return (
    <div className="min-h-screen bg-ivory text-ink font-sans selection:bg-gold/30">
      <nav className="max-w-3xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="text-2xl font-serif font-black tracking-tight">Sounds Indian.</div>
        <Link href="/management" className="text-sm font-medium hover:text-madder transition-colors">
          ← Back to product queue
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pb-20">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-serif">{product.indian_product_name}</h1>
          <span
            className={`shrink-0 text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              isVerified ? 'border-leaf text-leaf bg-leaf/5' : 'border-gold text-ink bg-gold/20'
            }`}
          >
            {isVerified ? 'Live' : 'Not verified'}
          </span>
        </div>
        <p className="text-sm text-ink/70 mb-1">
          {product.brand?.name} · {product.brand?.location}
        </p>
        <p className="text-sm text-ink/70 mb-8">
          CIN: <span className="font-mono">{product.brand?.cin ?? 'not recorded'}</span>
          {product.brand?.website && (
            <>
              {' · '}
              <a href={product.brand.website} target="_blank" rel="noopener noreferrer" className="underline hover:text-madder">
                Brand website
              </a>
            </>
          )}
        </p>

        {saved && (
          <p role="status" className="mb-6 rounded-md border border-leaf/30 bg-leaf/5 p-3 text-sm text-leaf">
            Saved.
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="mb-6 rounded-md border border-madder/30 bg-madder/5 p-3 text-sm text-madder">
            {errorMessage}
          </p>
        )}

        <form action={saveProduct} className="space-y-10">
          <input type="hidden" name="id" value={product.id} />

          {/* Foreign product */}
          <section className="space-y-5">
            <h2 className="text-xl font-serif">Foreign product</h2>
            <div>
              <label htmlFor="foreign_replacement_name" className={labelClass}>Name</label>
              <input id="foreign_replacement_name" name="foreign_replacement_name" required
                defaultValue={product.foreign_replacement_name} className={inputClass} />
            </div>
            <div>
              <label htmlFor="foreign_price_inr" className={labelClass}>Price in India (₹)</label>
              <input id="foreign_price_inr" name="foreign_price_inr" type="number" step="any" min="0"
                defaultValue={product.foreign_price_inr ?? ''} className={inputClass} />
              <p className={hintClass}>Check this against the current listing on an Indian store.</p>
            </div>
          </section>

          {/* Indian product */}
          <section className="space-y-5">
            <h2 className="text-xl font-serif">Indian alternative</h2>
            <div>
              <label htmlFor="indian_product_name" className={labelClass}>Name</label>
              <input id="indian_product_name" name="indian_product_name" required
                defaultValue={product.indian_product_name} className={inputClass} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
             <div>
  <label htmlFor="category" className={labelClass}>Category</label>
  <select id="category" name="category" defaultValue={product.category ?? ''} className={inputClass}>
    <option value="">Choose a category</option>
    {CATEGORIES.map((c) => (
      <option key={c.slug} value={c.slug}>{c.label}</option>
    ))}
  </select>
</div>
              <div>
                <label htmlFor="price_inr" className={labelClass}>Price (₹)</label>
                <input id="price_inr" name="price_inr" type="number" step="any" min="0"
                  defaultValue={product.price_inr ?? ''} className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="buy_url" className={labelClass}>Buy link</label>
              <input id="buy_url" name="buy_url" type="url" placeholder="https://"
                defaultValue={product.buy_url ?? ''} className={inputClass} />
              {product.buy_url && (
                <a href={product.buy_url} target="_blank" rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs underline hover:text-madder">
                  Open listing <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </section>

          {/* Comparison points */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-serif">Comparison points</h2>
              <p className={hintClass}>
                What you verified: ingredients, certifications, price difference. Leave a row
                empty to skip it, or clear its text to remove it.
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
              Required to verify. Be honest about where the Indian product falls short.
            </p>
            <textarea id="trade_off" name="trade_off" rows={3} maxLength={600}
              defaultValue={product.trade_off ?? ''} className={inputClass} />
          </section>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-8">
            <button name="intent" value="save"
              className="border border-ink px-5 py-2.5 rounded-md font-medium hover:bg-ink/5 transition-colors">
              Save changes
            </button>
            {isVerified ? (
              <button name="intent" value="unpublish"
                className="border border-madder text-madder px-5 py-2.5 rounded-md font-medium hover:bg-madder/5 transition-colors">
                Save &amp; unpublish
              </button>
            ) : (
              <button name="intent" value="verify"
                className="bg-leaf text-ivory px-5 py-2.5 rounded-md font-medium hover:bg-leaf/90 transition-colors">
                Save &amp; verify
              </button>
            )}
          </div>
        </form>

        {/* Delete lives outside the main form (forms can't be nested) */}
        <details className="mt-12 rounded-md border border-madder/30 p-4">
          <summary className="cursor-pointer font-medium text-madder">Delete this product</summary>
          <p className="text-sm text-ink/70 my-3">
            This permanently removes the product and its comparison points. The brand stays.
          </p>
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <button className="bg-madder text-ivory px-5 py-2.5 rounded-md font-medium hover:bg-madder/90 transition-colors">
              Yes, delete permanently
            </button>
          </form>
        </details>
      </main>
    </div>
  );
}