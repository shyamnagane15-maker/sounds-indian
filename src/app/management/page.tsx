import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { admin } from '../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// Works out what still has to be filled in before a product can be verified
function missingDetails(p: any): string[] {
  const missing: string[] = [];
  if (p.price_inr === null) missing.push('price');
  if (!p.category) missing.push('category');
  if (p.foreign_price_inr === null) missing.push('foreign price');
  if (!p.trade_off) missing.push('trade-off');
  if (!p.points || p.points.length === 0) missing.push('comparison points');
  return missing;
}

export default async function ManagementDashboard() {
  const { data: products, error } = await admin
    .from('products')
    .select(
      'id, indian_product_name, foreign_replacement_name, buy_url, verification_status, price_inr, foreign_price_inr, trade_off, brand:brands(name), category, points:comparison_points(id)'
    )
    .order('indian_product_name');

  // Print the real error directly to the screen
  if (error) {
    return (
      <div className="p-10 bg-red-50 text-red-600 font-mono">
        <h1 className="font-bold text-xl mb-4">Database Error:</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  const pending = (products ?? []).filter((p: any) => p.verification_status === 'self_reported');
  const live = (products ?? []).filter((p: any) => p.verification_status === 'verified_by_team');

  return (
    <div className="min-h-screen bg-ivory text-ink font-sans">
      <nav className="max-w-6xl mx-auto px-6 py-6 border-b border-ink/10 flex justify-between items-center">
        <div className="text-xl font-serif font-black tracking-tight text-ink">
          Sounds Indian{' '}
          <span className="text-leaf ml-2 font-sans font-medium text-sm border border-leaf px-2 py-1 rounded-full">
            Admin
          </span>
        </div>
        <div className="flex gap-6 text-sm font-medium">
          <Link href="/management/submissions" className="hover:text-madder transition-colors">
            Brand submissions
          </Link>
          <span className="border-b border-ink">Product queue</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-serif mb-2">Verification Queue</h1>
        <p className="text-ink/70 mb-8">
          Fill in the details, check the claims against certificates and the brand&apos;s own
          listing, then verify to publish.
        </p>

        <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm mb-16">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ink/5 border-b border-ink/10 text-sm font-medium">
                <th className="p-4">Indian Product</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Replaces</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink/50 font-medium">
                    The verification queue is currently empty.
                  </td>
                </tr>
              ) : (
                pending.map((product: any) => {
                  const missing = missingDetails(product);
                  return (
                    <tr key={product.id} className="border-b border-ink/5 hover:bg-ink/[0.02]">
                      <td className="p-4 font-medium">
                        {product.indian_product_name}
                        {product.buy_url && (
                          <a
                            href={product.buy_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex align-middle text-ink/40 hover:text-ink"
                            title="Open listing"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                      <td className="p-4 text-ink/70">{product.brand?.name}</td>
                      <td className="p-4 text-ink/70">{product.foreign_replacement_name}</td>
                      <td className="p-4 text-sm">
                        {missing.length > 0 ? (
                          <span className="text-madder">Missing: {missing.join(', ')}</span>
                        ) : (
                          <span className="text-leaf">Ready to review</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/management/products/${product.id}`}
                          className="inline-block bg-ink text-ivory px-4 py-2 rounded-md text-sm font-medium hover:bg-ink/90 transition-colors"
                        >
                          Edit &amp; verify
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-serif mb-2">Live products</h2>
        <p className="text-ink/70 mb-6">Verified and visible on the public site.</p>

        <div className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ink/5 border-b border-ink/10 text-sm font-medium">
                <th className="p-4">Indian Product</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Replaces</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {live.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-ink/50 font-medium">
                    Nothing is live yet.
                  </td>
                </tr>
              ) : (
                live.map((product: any) => (
                  <tr key={product.id} className="border-b border-ink/5 hover:bg-ink/[0.02]">
                    <td className="p-4 font-medium">{product.indian_product_name}</td>
                    <td className="p-4 text-ink/70">{product.brand?.name}</td>
                    <td className="p-4 text-ink/70">{product.foreign_replacement_name}</td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/management/products/${product.id}`}
                        className="text-sm font-medium underline hover:text-madder"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
} 