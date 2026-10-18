'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MIN_SCORE,
  SIZE_UNITS,
  cleanSpecs,
  countKnown,
  displayValue,
  getSpecFields,
  rankMatches,
  type SpecField,
  type SpecValue,
  type Specs,
} from '../../lib/specs';
import {
  analyseForeign,
  draftComparison,
  extractCatalogueSpecs,
  saveCatalogueSpecs,
  saveComparison,
  type AnalyseOutput,
  type DraftOutput,
} from './actions';

export type CatalogueRow = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  status: string;
  sizeValue: number | null;
  sizeUnit: string | null;
  specs: Record<string, unknown>;
};

type CategoryOption = { slug: string; label: string };

const inputClass =
  'w-full px-3 py-2.5 rounded-md border border-ink/20 bg-white text-sm focus:outline-none focus:border-ink';
const labelClass = 'block text-xs font-medium mb-1 text-ink/70';
const cardClass = 'rounded-2xl border border-ink/10 bg-white p-6 shadow-sm';
const primaryBtn =
  'rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-ivory hover:bg-ink/90 transition-colors disabled:opacity-50';
const secondaryBtn =
  'rounded-md border border-ink/30 px-4 py-2 text-sm font-medium hover:bg-ink/5 transition-colors disabled:opacity-50';

const toNum = (s: string): number | null => {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                  */
/* ------------------------------------------------------------------ */

function ListInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: SpecValue;
  onChange: (v: string[] | null) => void;
}) {
  // Keeps its own text so typing a comma doesn't get swallowed
  const [raw, setRaw] = useState(Array.isArray(value) ? value.join(', ') : '');
  return (
    <input
      id={id}
      className={inputClass}
      value={raw}
      placeholder="comma, separated"
      onChange={(e) => {
        setRaw(e.target.value);
        const items = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
        onChange(items.length ? items : null);
      }}
    />
  );
}

function FieldInput({
  field,
  value,
  onChange,
  idPrefix,
}: {
  field: SpecField;
  value: SpecValue;
  onChange: (v: SpecValue) => void;
  idPrefix: string;
}) {
  const id = `${idPrefix}-${field.key}`;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {field.label}
        {field.unit ? ` (${field.unit})` : ''}
      </label>
      {field.type === 'enum' && (
        <select id={id} className={inputClass} value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || null)}>
          <option value="">Unknown</option>
          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {field.type === 'boolean' && (
        <select id={id} className={inputClass}
          value={value === true ? 'yes' : value === false ? 'no' : ''}
          onChange={(e) => onChange(e.target.value === 'yes' ? true : e.target.value === 'no' ? false : null)}>
          <option value="">Unknown</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      )}
      {field.type === 'number' && (
        <input id={id} type="number" step="any" min="0" className={inputClass}
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
      )}
      {field.type === 'text' && (
        <input id={id} className={inputClass} maxLength={120}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || null)} />
      )}
      {field.type === 'list' && <ListInput id={id} value={value} onChange={onChange} />}
    </div>
  );
}

// "version" changes whenever the stats are replaced from outside (for example by the AI),
// which makes the inputs start fresh with the new values.
function SpecsEditor({
  category,
  specs,
  onChange,
  version,
  idPrefix,
}: {
  category: string;
  specs: Specs;
  onChange: (next: Specs) => void;
  version: number;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {getSpecFields(category).map((f) => (
        <FieldInput
          key={`${f.key}-${version}`}
          idPrefix={idPrefix}
          field={f}
          value={specs[f.key] ?? null}
          onChange={(v) => onChange({ ...specs, [f.key]: v })}
        />
      ))}
    </div>
  );
}

function SizeInputs({
  sizeValue,
  sizeUnit,
  onValue,
  onUnit,
}: {
  sizeValue: string;
  sizeUnit: string;
  onValue: (v: string) => void;
  onUnit: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <label className={labelClass}>Pack size</label>
        <input type="number" step="any" min="0" className={inputClass} value={sizeValue}
          onChange={(e) => onValue(e.target.value)} />
      </div>
      <div className="w-24">
        <label className={labelClass}>Unit</label>
        <select className={inputClass} value={sizeUnit} onChange={(e) => onUnit(e.target.value)}>
          <option value="">—</option>
          {SIZE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
    </div>
  );
}

function Sources({ sources, notes }: { sources: string[]; notes?: string }) {
  if (sources.length === 0 && !notes) return null;
  return (
    <div className="mt-4 rounded-lg bg-ink/[0.04] p-3 text-xs text-ink/70">
      {sources.length > 0 && (
        <div>
          <span className="font-medium">Pages the AI read: </span>
          {sources.map((s, i) => (
            <span key={s}>
              {i > 0 && ' · '}
              <a href={s} target="_blank" rel="noopener noreferrer" className="underline hover:text-madder">
                {new URL(s).hostname.replace(/^www\./, '')}
              </a>
            </span>
          ))}
        </div>
      )}
      {notes && <div className="mt-1">AI note: {notes}</div>}
    </div>
  );
}

function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-4 rounded-md border border-madder/30 bg-madder/5 p-3 text-sm text-madder">
      {message}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Compare: foreign product -> stats -> best match -> trade-off         */
/* ------------------------------------------------------------------ */

type Analysis = AnalyseOutput & { category: string };

function ComparePanel({ categories }: { categories: CategoryOption[] }) {
  const [category, setCategory] = useState(categories[0].slug);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [url, setUrl] = useState('');

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [foreignName, setForeignName] = useState('');
  const [price, setPrice] = useState('');
  const [sizeValue, setSizeValue] = useState('');
  const [sizeUnit, setSizeUnit] = useState('');
  const [specs, setSpecs] = useState<Specs>({});
  const [version, setVersion] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftOutput | null>(null);
  const [tradeOff, setTradeOff] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);

  const [busy, setBusy] = useState<'analyse' | 'draft' | 'save' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Step 2 runs right here in the browser, so editing a stat re-ranks instantly
  const ranking = useMemo(() => {
    if (!analysis) return null;
    return rankMatches(analysis.category, cleanSpecs(analysis.category, specs), analysis.candidates);
  }, [analysis, specs]);

  const selected = ranking?.matches.find((m) => m.id === selectedId) ?? ranking?.matches[0] ?? null;

  function runAnalyse() {
    setError(null);
    setBusy('analyse');
    startTransition(async () => {
      const res = await analyseForeign({ category, name, brand, url });
      setBusy(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const { extraction } = res.data;
      setAnalysis({ ...res.data, category });
      setForeignName(name.trim());
      setPrice(extraction.price !== null ? String(extraction.price) : '');
      setSizeValue(extraction.sizeValue !== null ? String(extraction.sizeValue) : '');
      setSizeUnit(extraction.sizeUnit ?? '');
      setSpecs(extraction.specs);
      setVersion((v) => v + 1);
      setSelectedId(null);
      setDraft(null);
      setTradeOff('');
      setSavedId(null);
    });
  }

  const payload = () => ({
    productId: selected?.id ?? '',
    category: analysis?.category ?? category,
    foreignName,
    foreignPrice: toNum(price),
    foreignSizeValue: toNum(sizeValue),
    foreignSizeUnit: sizeUnit || null,
    foreignSpecs: specs as Record<string, unknown>,
  });

  function runDraft() {
    if (!selected) return;
    setError(null);
    setBusy('draft');
    startTransition(async () => {
      const res = await draftComparison(payload());
      setBusy(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDraft(res.data);
      setTradeOff(res.data.tradeOff);
    });
  }

  function runSave() {
    if (!selected || !analysis) return;
    setError(null);
    setBusy('save');
    startTransition(async () => {
      const res = await saveComparison({ ...payload(), tradeOff, sources: analysis.extraction.sources });
      setBusy(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedId(res.data.id);
    });
  }

  return (
    <div className="space-y-8">
      {/* 1. Which foreign product */}
      <section className={cardClass}>
        <h2 className="font-serif text-xl mb-4">1. Which foreign product?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="c-category">Category</label>
            <select id="c-category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="c-name">Product name</label>
            <input id="c-name" className={inputClass} maxLength={150} value={name}
              placeholder="e.g. The Ordinary Glycolic Acid 7% Exfoliating Toner"
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="c-brand">Brand (optional)</label>
            <input id="c-brand" className={inputClass} maxLength={80} value={brand}
              onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="c-url">Product page link (optional, improves accuracy)</label>
            <input id="c-url" type="url" className={inputClass} value={url} placeholder="https://"
              onChange={(e) => setUrl(e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <button className={primaryBtn} disabled={busy !== null || name.trim().length < 2} onClick={runAnalyse}>
            {busy === 'analyse' ? 'Reading the web…' : 'Find stats and best match'}
          </button>
          {busy === 'analyse' && (
            <span className="text-sm text-ink/60">This can take up to a minute. Please keep this page open.</span>
          )}
        </div>
        <ErrorBox message={busy === null && !analysis ? error : null} />
      </section>

      {analysis && ranking && (
        <>
          {/* 2. Stats found */}
          <section className={cardClass}>
            <h2 className="font-serif text-xl mb-1">2. Stats found for the foreign product</h2>
            <p className="text-sm text-ink/60 mb-4">
              Check these against the sources. Fix anything wrong or blank. The matches below update
              as you edit.
            </p>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div>
                <label className={labelClass}>Name</label>
                <input className={inputClass} value={foreignName} maxLength={150}
                  onChange={(e) => setForeignName(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Listed price in India (₹)</label>
                <input type="number" step="any" min="0" className={inputClass} value={price}
                  onChange={(e) => setPrice(e.target.value)} />
              </div>
              <SizeInputs sizeValue={sizeValue} sizeUnit={sizeUnit} onValue={setSizeValue} onUnit={setSizeUnit} />
            </div>
            <SpecsEditor category={analysis.category} specs={specs} onChange={setSpecs} version={version} idPrefix="f" />
            <Sources sources={analysis.extraction.sources} notes={analysis.extraction.notes} />
          </section>

          {/* 3. Best matches */}
          <section className={cardClass}>
            <h2 className="font-serif text-xl mb-1">3. Closest products in your catalogue</h2>
            <p className="text-sm text-ink/60 mb-4">
              Ranked by how closely their stats match. Different product types are excluded, and
              missing stats lower the score.
            </p>

            {analysis.candidates.length === 0 && (
              <p className="text-sm">There are no products in this category yet.</p>
            )}

            {analysis.candidates.length > 0 && ranking.matches.length === 0 && (
              <p className="text-sm">
                No product has a matching product type ({ranking.excluded} excluded). Check the
                &ldquo;Product type&rdquo; stat above, or add more products.
              </p>
            )}

            {analysis.withoutSpecs > 0 && (
              <p className="mb-4 rounded-md border border-gold/60 bg-gold/10 p-3 text-sm">
                {analysis.withoutSpecs} product{analysis.withoutSpecs === 1 ? ' has' : 's have'} no stats yet,
                so {analysis.withoutSpecs === 1 ? 'it' : 'they'} can&apos;t be matched well. Fill them in on the
                &ldquo;Catalogue stats&rdquo; tab.
              </p>
            )}

            {ranking.matches.length > 0 && !ranking.bestIsGoodEnough && (
              <p className="mb-4 rounded-md border border-madder/30 bg-madder/5 p-3 text-sm text-madder">
                No close match yet. The best score is below {MIN_SCORE}% or is based on too few stats. Only
                compare if you agree it&apos;s the right pairing.
              </p>
            )}

            <ul className="space-y-3">
              {ranking.matches.map((m, i) => (
                <li key={m.id} className={`rounded-xl border p-4 ${selected?.id === m.id ? 'border-ink bg-ink/[0.03]' : 'border-ink/15'}`}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="radio" name="match" className="mt-1.5" checked={selected?.id === m.id}
                      onChange={() => { setSelectedId(m.id); setDraft(null); setTradeOff(''); }} />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{m.name}</span>
                        {m.brand && <span className="text-sm text-ink/60">by {m.brand}</span>}
                        {i === 0 && ranking.bestIsGoodEnough && (
                          <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-xs font-bold text-leaf">Best match</span>
                        )}
                        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs">
                          {m.status === 'verified_by_team' ? 'Live' : 'Not verified'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-ink/70">
                        Score <strong>{m.result.score}%</strong> · {Math.round(m.result.coverage * 100)}% of stats compared ·{' '}
                        {m.result.confidence} confidence
                      </div>
                      {m.result.warnings.map((w) => (
                        <div key={w} className="mt-1 text-xs text-madder">{w}</div>
                      ))}
                    </div>
                  </label>
                  <details className="mt-3 ml-7 text-sm">
                    <summary className="cursor-pointer text-ink/60 underline">See how it was scored</summary>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-ink/10 text-ink/60">
                            <th className="py-1 pr-3">Stat</th>
                            <th className="py-1 pr-3">Foreign</th>
                            <th className="py-1 pr-3">Indian</th>
                            <th className="py-1">Match</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.result.breakdown.map((b) => (
                            <tr key={b.key} className="border-b border-ink/5">
                              <td className="py-1 pr-3">{b.label}</td>
                              <td className="py-1 pr-3">{displayValue(b.foreign)}</td>
                              <td className="py-1 pr-3">{displayValue(b.indian)}</td>
                              <td className="py-1">{b.similarity === null ? 'not comparable' : `${Math.round(b.similarity * 100)}%`}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </li>
              ))}
            </ul>

            {selected && (
              <div className="mt-5">
                <button className={primaryBtn} disabled={busy !== null || !foreignName.trim()} onClick={runDraft}>
                  {busy === 'draft' ? 'Drafting…' : `Draft the trade-off vs ${selected.name}`}
                </button>
              </div>
            )}
            <ErrorBox message={busy === null && !draft ? error : null} />
          </section>

          {/* 4. Trade-off */}
          {draft && selected && (
            <section className={cardClass}>
              <h2 className="font-serif text-xl mb-1">4. Review the trade-off</h2>
              <p className="text-sm text-ink/60 mb-4">
                The AI wrote this using only the facts below. The numbers were worked out by code.
                Edit it freely: you are the one who verifies it.
              </p>

              <div className="rounded-lg bg-ink/[0.04] p-4 text-sm">
                <div className="mb-2 text-xs font-mono uppercase tracking-wider text-ink/50">Facts it was given</div>
                <ul className="list-disc space-y-1 pl-5">
                  {draft.facts.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>

              <label className={`${labelClass} mt-5`} htmlFor="tradeoff">Trade-off (shown publicly)</label>
              <textarea id="tradeoff" rows={3} maxLength={600} className={inputClass} value={tradeOff}
                onChange={(e) => setTradeOff(e.target.value)} />
              <div className="mt-1 text-xs text-ink/50">{tradeOff.length}/600</div>

              {selected.status === 'verified_by_team' && (
                <p className="mt-4 rounded-md border border-gold/60 bg-gold/10 p-3 text-sm">
                  This product is live. Saving updates the public page straight away.
                </p>
              )}

              {savedId ? (
                <p role="status" className="mt-5 rounded-md border border-leaf/30 bg-leaf/5 p-3 text-sm text-leaf">
                  Saved to {selected.name}.{' '}
                  <Link href={`/management/products/${savedId}`} className="font-medium underline">
                    Open the product to review and verify it
                  </Link>
                </p>
              ) : (
                <div className="mt-5 flex items-center gap-3">
                  <button className={primaryBtn} disabled={busy !== null || tradeOff.trim().length < 10} onClick={runSave}>
                    {busy === 'save' ? 'Saving…' : 'Save to this product'}
                  </button>
                  <span className="text-xs text-ink/60">
                    Saves the foreign product&apos;s name, price, stats and the trade-off. It does not verify anything.
                  </span>
                </div>
              )}
              <ErrorBox message={busy === null ? error : null} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Catalogue: fill in or correct the stats of your Indian products      */
/* ------------------------------------------------------------------ */

type Editing = {
  id: string;
  name: string;
  category: string;
  specs: Specs;
  sizeValue: string;
  sizeUnit: string;
  sources: string[];
  notes: string;
  version: number;
};

function CataloguePanel({ categories, rows }: { categories: CategoryOption[]; rows: CatalogueRow[] }) {
  const router = useRouter();
  const [category, setCategory] = useState(categories[0].slug);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const visible = rows.filter((r) => r.category === category);

  function open(row: CatalogueRow, withAi: boolean) {
    setError(null);
    setMessage(null);
    const base = cleanSpecs(row.category ?? '', row.specs);

    if (!withAi) {
      setEditing({
        id: row.id, name: row.name, category: row.category ?? '', specs: base,
        sizeValue: row.sizeValue !== null ? String(row.sizeValue) : '', sizeUnit: row.sizeUnit ?? '',
        sources: [], notes: '', version: Date.now(),
      });
      return;
    }

    setBusyId(row.id);
    startTransition(async () => {
      const res = await extractCatalogueSpecs(row.id);
      setBusyId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const ex = res.data.extraction;
      // Keep what you already entered wherever the AI found nothing
      const merged: Specs = { ...base };
      for (const [k, v] of Object.entries(ex.specs)) if (v !== null) merged[k] = v;
      setEditing({
        id: row.id, name: row.name, category: row.category ?? '', specs: merged,
        sizeValue: ex.sizeValue !== null ? String(ex.sizeValue) : row.sizeValue !== null ? String(row.sizeValue) : '',
        sizeUnit: ex.sizeUnit ?? row.sizeUnit ?? '',
        sources: ex.sources, notes: ex.notes, version: Date.now(),
      });
    });
  }

  function save() {
    if (!editing) return;
    setError(null);
    setSaving(true);
    startTransition(async () => {
      const res = await saveCatalogueSpecs({
        productId: editing.id,
        specs: editing.specs as Record<string, unknown>,
        sizeValue: toNum(editing.sizeValue),
        sizeUnit: editing.sizeUnit || null,
        sources: editing.sources,
      });
      setSaving(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage(`Saved stats for ${editing.name}.`);
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="max-w-sm">
        <label className={labelClass} htmlFor="cat-category">Category</label>
        <select id="cat-category" className={inputClass} value={category}
          onChange={(e) => { setCategory(e.target.value); setEditing(null); }}>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
        </select>
      </div>

      {message && (
        <p role="status" className="rounded-md border border-leaf/30 bg-leaf/5 p-3 text-sm text-leaf">{message}</p>
      )}

      {editing && (
        <section className={cardClass}>
          <h2 className="font-serif text-xl mb-1">Stats for {editing.name}</h2>
          <p className="text-sm text-ink/60 mb-4">
            Check against the brand&apos;s own page. Blank means unknown, and unknown stats are never guessed.
          </p>
          <div className="mb-4 max-w-xs">
            <SizeInputs
              sizeValue={editing.sizeValue} sizeUnit={editing.sizeUnit}
              onValue={(v) => setEditing({ ...editing, sizeValue: v })}
              onUnit={(v) => setEditing({ ...editing, sizeUnit: v })}
            />
          </div>
          <SpecsEditor
            category={editing.category} specs={editing.specs} version={editing.version} idPrefix="e"
            onChange={(next) => setEditing({ ...editing, specs: next })}
          />
          <Sources sources={editing.sources} notes={editing.notes} />
          <div className="mt-5 flex gap-3">
            <button className={primaryBtn} disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save stats'}
            </button>
            <button className={secondaryBtn} disabled={saving} onClick={() => setEditing(null)}>Cancel</button>
          </div>
          <ErrorBox message={error} />
        </section>
      )}
      {!editing && <ErrorBox message={error} />}

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/5 font-medium">
              <th className="p-4">Product</th>
              <th className="p-4">Status</th>
              <th className="p-4">Stats</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-ink/50">No products in this category yet.</td></tr>
            )}
            {visible.map((r) => {
              const { known, total } = countKnown(r.category ?? '', r.specs as Specs);
              return (
                <tr key={r.id} className="border-b border-ink/5">
                  <td className="p-4">
                    <div className="font-medium">{r.name}</div>
                    {r.brand && <div className="text-xs text-ink/60">{r.brand}</div>}
                  </td>
                  <td className="p-4 text-ink/70">{r.status === 'verified_by_team' ? 'Live' : 'Not verified'}</td>
                  <td className="p-4">
                    <span className={known === 0 ? 'text-madder' : known === total ? 'text-leaf' : ''}>
                      {known} of {total} stats
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button className={secondaryBtn} disabled={busyId !== null} onClick={() => open(r, false)}>Edit</button>
                      <button className={primaryBtn} disabled={busyId !== null} onClick={() => open(r, true)}>
                        {busyId === r.id ? 'Reading the web…' : 'Fill with AI'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function AssistantClient({
  categories,
  rows,
}: {
  categories: CategoryOption[];
  rows: CatalogueRow[];
}) {
  const [tab, setTab] = useState<'compare' | 'catalogue'>('compare');
  const tabClass = (active: boolean) =>
    `rounded-full px-5 py-2.5 text-sm font-medium border transition-colors ${
      active ? 'bg-ink text-ivory border-ink' : 'border-ink/20 hover:bg-ink/5'
    }`;

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        <button className={tabClass(tab === 'compare')} onClick={() => setTab('compare')}>
          Compare a foreign product
        </button>
        <button className={tabClass(tab === 'catalogue')} onClick={() => setTab('catalogue')}>
          Catalogue stats
        </button>
      </div>
      {tab === 'compare' ? (
        <ComparePanel categories={categories} />
      ) : (
        <CataloguePanel categories={categories} rows={rows} />
      )}
    </div>
  );
}