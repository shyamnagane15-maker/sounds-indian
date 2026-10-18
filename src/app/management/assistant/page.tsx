import Link from 'next/link';
import { admin } from '../../lib/supabaseAdmin';
import { CATEGORIES } from '../../lib/categories';
import AssistantClient, { type CatalogueRow } from './AssistantClient';

export const dynamic = 'force-dynamic';
// The AI step reads the web, so it can take a while. This lets it run up to a minute when deployed.
export const maxDuration = 60;

type Row = {
  id: string;
  indian_product_name: string;
  category: string | null;
  verification_status: string;
  size_value: number | null;
  size_unit: string | null;
  specs: unknown;
  brand: { name: string } | { name: string }[] | null;
};

export default async function AssistantPage() {
  const { data, error } = await admin
    .from('products')
    .select('id, indian_product_name, category, verification_status, size_value, size_unit, specs, brand:brands(name)')
    .order('indian_product_name');

  if (error) {
    return (
      <div className="p-10 bg-red-50 text-red-600 font-mono">
        <h1 className="font-bold text-xl mb-4">Database Error:</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
        <p className="mt-4 text-sm">
          If this mentions a missing column, run assistant-migration.sql in the Supabase SQL Editor first.
        </p>
      </div>
    );
  }

  const rows: CatalogueRow[] = ((data ?? []) as unknown as Row[]).map((p) => ({
    id: p.id,
    name: p.indian_product_name,
    brand: (Array.isArray(p.brand) ? p.brand[0]?.name : p.brand?.name) ?? null,
    category: p.category,
    status: p.verification_status,
    sizeValue: p.size_value,
    sizeUnit: p.size_unit,
    specs: (p.specs && typeof p.specs === 'object' ? p.specs : {}) as Record<string, unknown>,
  }));

  const keyMissing = !process.env.ANTHROPIC_API_KEY;

  return (
    <div className="min-h-screen bg-ivory text-ink font-sans">
      <nav className="max-w-6xl mx-auto px-6 py-6 border-b border-ink/10 flex flex-wrap justify-between items-center gap-3">
        <div className="text-xl font-serif font-black tracking-tight">
          Sounds Indian{' '}
          <span className="text-leaf ml-2 font-sans font-medium text-sm border border-leaf px-2 py-1 rounded-full">
            Admin
          </span>
        </div>
        <div className="flex gap-6 text-sm font-medium">
          <Link href="/management/submissions" className="hover:text-madder transition-colors">Brand submissions</Link>
          <span className="border-b border-ink">AI assistant</span>
          <Link href="/management" className="hover:text-madder transition-colors">Product queue</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-serif mb-2">AI assistant</h1>
        <p className="text-ink/70 mb-8 max-w-3xl">
          Name a foreign product. The assistant reads the web for its stats, finds the closest
          Indian product in your catalogue, and drafts the trade-off. Nothing is published: you
          review and edit everything, then verify the product yourself as usual.
        </p>

        {keyMissing && (
          <p className="mb-8 rounded-md border border-madder/30 bg-madder/5 p-4 text-sm text-madder">
            The AI isn&apos;t connected yet. Add <code className="font-mono">ANTHROPIC_API_KEY</code> to{' '}
            <code className="font-mono">.env.local</code> and restart <code className="font-mono">npx next dev</code>.
            Without it, you can still edit stats by hand and use the matching.
          </p>
        )}

        <AssistantClient
          categories={CATEGORIES.map((c) => ({ slug: c.slug, label: c.label }))}
          rows={rows}
        />
      </main>
    </div>
  );
}