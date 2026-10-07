import Link from 'next/link';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { admin } from '../../lib/supabaseAdmin';
import { approveSubmission, rejectSubmission } from './actions';
import { categoryLabel } from '../../lib/categories';

export const dynamic = 'force-dynamic';

type SubmittedProduct = {
  indian_product_name: string;
  foreign_replacement_name: string;
  buy_url: string;
  category?: string;
};

type Submission = {
  id: string;
  created_at: string;
  brand_name: string;
  location: string;
  founding_story: string | null;
  contact_email: string;
  website: string | null;
  cin: string;
  logo_url: string;
  products: SubmittedProduct[];
  notes: string | null;
};

export default async function SubmissionsPage() {
  const { data, error } = await admin
    .from('brand_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true }); // oldest first

  if (error) {
    return (
      <div className="p-10 bg-red-50 text-red-600 font-mono">
        <h1 className="font-bold text-xl mb-4">Database Error:</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  const { data: existingBrands } = await admin
    .from('brands')
    .select('cin')
    .not('cin', 'is', null);

  const submissions = (data ?? []) as Submission[];

  // Used to flag a CIN that is already a brand, or submitted twice
  const existingCins = new Set((existingBrands ?? []).map((b) => b.cin as string));
  const pendingCounts = new Map<string, number>();
  for (const s of submissions) {
    pendingCounts.set(s.cin, (pendingCounts.get(s.cin) ?? 0) + 1);
  }

  return (
    <div className="min-h-screen bg-ivory text-ink font-sans selection:bg-gold/30">
      <nav className="max-w-4xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="text-2xl font-serif font-black tracking-tight">Sounds Indian.</div>
        <div className="flex gap-6 text-sm font-medium">
          <span className="border-b border-ink">Brand submissions</span>
          <Link href="/management" className="hover:text-madder transition-colors">
            Product queue
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pb-20">
        <h1 className="text-3xl font-serif mb-2">Brand submissions</h1>
        <p className="text-ink/70 mb-2">
          {submissions.length} pending. Check each CIN against the government&apos;s company
          records before approving.
        </p>
        <p className="text-sm text-ink/60 mb-10">
          Approving creates the brand and its products. The products start as self-reported and
          only go public once you fill in the details and verify them.
        </p>

        {submissions.length === 0 && (
          <p className="text-ink/60">No pending submissions.</p>
        )}

        {submissions.map((s) => {
          const isDuplicate = existingCins.has(s.cin) || (pendingCounts.get(s.cin) ?? 0) > 1;
          const submitted = new Date(s.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <article
              key={s.id}
              className="bg-white rounded-xl border border-ink/10 shadow-sm p-6 md:p-8 mb-8"
            >
              <div className="flex gap-5 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.logo_url}
                  alt={`${s.brand_name} logo`}
                  className="w-20 h-20 object-contain rounded-md border border-ink/10 bg-white p-1 shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-2xl font-serif">{s.brand_name}</h2>
                  <p className="text-sm text-ink/70">
                    {s.location} · submitted {submitted}
                  </p>
                </div>
              </div>

              {isDuplicate && (
                <div className="flex gap-3 bg-madder/5 p-3 rounded-md border border-madder/20 mt-5 text-sm text-madder">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    This CIN already belongs to an existing brand or appears in another
                    submission. Check for a duplicate before approving.
                  </div>
                </div>
              )}

              <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-ink/60 mb-1">CIN</dt>
                  <dd className="font-mono break-all">{s.cin}</dd>
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-ink/60 mb-1">Contact</dt>
                  <dd className="break-all">
                    <a href={`mailto:${s.contact_email}`} className="underline hover:text-madder">
                      {s.contact_email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase tracking-wider text-ink/60 mb-1">Website</dt>
                  <dd className="break-all">
                    {s.website ? (
                      <a
                        href={s.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-madder"
                      >
                        {s.website}
                      </a>
                    ) : (
                      <span className="text-ink/50">Not provided</span>
                    )}
                  </dd>
                </div>
              </dl>

              {s.founding_story && (
                <div className="mt-6 text-sm">
                  <div className="text-xs font-mono uppercase tracking-wider text-ink/60 mb-1">
                    Founding story
                  </div>
                  <p className="whitespace-pre-line">{s.founding_story}</p>
                </div>
              )}

              <div className="mt-6 text-sm">
                <div className="text-xs font-mono uppercase tracking-wider text-ink/60 mb-2">
                  Products ({s.products.length})
                </div>
                <ul className="space-y-2">
                  {s.products.map((p, i) => (
                    <li key={i} className="rounded-md border border-ink/10 bg-ink/[0.02] p-3">
                      <span className="font-medium">{p.indian_product_name}</span>
                      <span className="text-ink/60"> replaces </span>
                      <span className="font-medium">{p.foreign_replacement_name}</span>
                      <span className="ml-2 text-xs font-mono text-ink/50">
  {categoryLabel(p.category) ?? 'No category'}
</span>
                      <a
                        href={p.buy_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 inline-flex items-center gap-1 underline hover:text-madder"
                      >
                        Buy link <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {s.notes && (
                <div className="mt-6 text-sm">
                  <div className="text-xs font-mono uppercase tracking-wider text-ink/60 mb-1">
                    Notes from the brand
                  </div>
                  <p className="whitespace-pre-line">{s.notes}</p>
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <form action={approveSubmission}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="bg-leaf text-ivory px-5 py-2.5 rounded-md font-medium hover:bg-leaf/90 transition-colors">
                    Approve brand and products
                  </button>
                </form>
                <form action={rejectSubmission}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="border border-madder text-madder px-5 py-2.5 rounded-md font-medium hover:bg-madder/5 transition-colors">
                    Reject
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
}