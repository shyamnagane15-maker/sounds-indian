import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabaseServer';
import { categoryLabel } from '../../lib/categories';
import { signOut } from '../actions';

export const dynamic = 'force-dynamic';

export default async function BrandDashboard({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const { saved, deleted } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/brand/login');

  const { data: brand } = await supabase
    .from('brands')
    .select('id, name, location, logo_url')
    .eq('owner_id', user.id)
    .maybeSingle();

  const logoutButton = (
    <form action={signOut}>
      <button className="text-sm font-medium underline hover:text-madder">Log out</button>
    </form>
  );

  // Logged in, but no brand is linked to this email yet
  if (!brand) {
    return (
      <div className="min-h-screen bg-ivory text-ink font-sans">
        <nav className="max-w-4xl mx-auto px-6 py-8 flex justify-between items-center">
          <Link href="/" className="text-2xl font-serif font-black tracking-tight">Sounds Indian.</Link>
          {logoutButton}
        </nav>
        <main className="max-w-4xl mx-auto px-6 pb-20">
          <h1 className="text-3xl font-serif mb-3">No brand linked yet</h1>
          <p className="text-ink/80 max-w-xl">
            You&apos;re logged in as {user.email}, but this email isn&apos;t linked to a brand yet.
            Contact the Sounds Indian team and we&apos;ll connect it.
          </p>
        </main>
      </div>
    );
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, indian_product_name, foreign_replacement_name, category, verification_status')
    .eq('brand_id', brand.id)
    .order('indian_product_name');

  return (
    <div className="min-h-screen bg-ivory text-ink font-sans selection:bg-gold/30">
      <nav className="max-w-4xl mx-auto px-6 py-8 flex justify-between items-center">
        <Link href="/" className="text-2xl font-serif font-black tracking-tight">Sounds Indian.</Link>
        {logoutButton}
      </nav>

      <main className="max-w-4xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-5 mb-10">
          {brand.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logo_url}
              alt={`${brand.name} logo`}
              className="w-16 h-16 object-contain rounded-md border border-ink/10 bg-white p-1 shrink-0"
            />
          )}
          <div>
            <h1 className="text-3xl font-serif">{brand.name}</h1>
            <p className="text-sm text-ink/70">{brand.location} · Brand dashboard</p>
          </div>
        </div>

        {saved && (
          <p role="status" className="mb-6 rounded-md border border-leaf/30 bg-leaf/5 p-3 text-sm text-leaf">
            Saved. Our team reviews every change before it appears on the public site.
          </p>
        )}
        {deleted && (
          <p role="status" className="mb-6 rounded-md border border-ink/20 bg-white p-3 text-sm">
            Product deleted.
          </p>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif">Your products</h2>
          <Link
            href="/brand/products/new"
            className="bg-ink text-ivory px-5 py-2.5 rounded-md text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            Add a product
          </Link>
        </div>

        {(!products || products.length === 0) && (
          <div className="rounded-xl border border-ink/10 bg-white p-8 text-ink/70">
            You haven&apos;t added any products yet.
          </div>
        )}

        <ul className="space-y-4">
          {products?.map((p) => {
            const live = p.verification_status === 'verified_by_team';
            return (
              <li
                key={p.id}
                className="bg-white rounded-xl border border-ink/10 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="font-serif text-xl">{p.indian_product_name}</div>
                  <div className="text-sm text-ink/70">
                    Replaces {p.foreign_replacement_name}
                    {categoryLabel(p.category) && <> · {categoryLabel(p.category)}</>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      live ? 'border-leaf text-leaf bg-leaf/5' : 'border-gold text-ink bg-gold/20'
                    }`}
                  >
                    {live ? 'Live' : 'In review'}
                  </span>
                  <Link href={`/brand/products/${p.id}`} className="text-sm font-medium underline hover:text-madder">
                    Edit
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-sm text-ink/60">
          Products marked &ldquo;In review&rdquo; aren&apos;t public yet. We check every claim before
          anything goes live.
        </p>
      </main>
    </div>
  );
}