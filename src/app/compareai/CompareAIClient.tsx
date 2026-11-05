'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { Camera, ExternalLink, Search, Sparkles, Upload } from 'lucide-react';
import { analyseProduct, compareWithIndianProduct, identifyPhoto } from './actions';
import {
  cleanSpecs,
  displayValue,
  getSpecFields,
  rankMatches,
  type RankedMatch,
  type Specs,
} from '../lib/specs';
import ProductImage from '../components/ProductImage';

type CategoryOption = { slug: string; label: string };

export default function CompareAIClient({ categories }: { categories: CategoryOption[] }) {
  const [category, setCategory] = useState(categories[0]?.slug ?? '');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [url, setUrl] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [busy, setBusy] = useState<'photo' | 'analyse' | 'tradeoff' | null>(null);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<Awaited<ReturnType<typeof analyseProduct>> | null>(null);
  const [foreignSpecs, setForeignSpecs] = useState<Specs>({});
  const [foreignPrice, setForeignPrice] = useState<number | null>(null);
  const [foreignSize, setForeignSize] = useState<number | null>(null);
  const [foreignUnit, setForeignUnit] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [tradeOff, setTradeOff] = useState('');
  const [facts, setFacts] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const ranked = useMemo(() => {
    if (!analysis || !analysis.ok) return null;
    return rankMatches(category, cleanSpecs(category, foreignSpecs), analysis.data.candidates, 6);
  }, [analysis, category, foreignSpecs]);

  const selected = ranked?.matches.find((product) => product.id === selectedId) ?? ranked?.matches[0] ?? null;
  const extraction = analysis?.ok ? analysis.data.extraction : null;

  function choosePhoto(file?: File) {
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError('');
  }

  function runPhoto() {
    if (!photo) return;
    setBusy('photo');
    setError('');
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set('photo', photo);
        const result = await identifyPhoto(formData, category);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setName(result.data.name);
        setBrand(result.data.brand);
      } catch {
        setError('Could not read the photo. It may be too large, or the AI service is unavailable. Try again.');
      } finally {
        setBusy(null);
      }
    });
  }

  function runAnalyse() {
    setBusy('analyse');
    setError('');
    setTradeOff('');
    setFacts([]);
    setSelectedId('');
    startTransition(async () => {
      try {
        const result = await analyseProduct({ category, name, brand, url });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setAnalysis(result);
        setForeignSpecs(result.data.extraction.specs);
        setForeignPrice(result.data.extraction.price);
        setForeignSize(result.data.extraction.sizeValue);
        setForeignUnit(result.data.extraction.sizeUnit);
      } catch {
        setError('The request failed or timed out. Please try again.');
      } finally {
        setBusy(null);
      }
    });
  }

  function runTradeOff() {
    if (!selected || !extraction) return;
    setBusy('tradeoff');
    setError('');
    startTransition(async () => {
      try {
        const result = await compareWithIndianProduct({
          category,
          foreignName: name.trim(),
          foreignSpecs,
          foreignPrice,
          foreignSizeValue: foreignSize,
          foreignSizeUnit: foreignUnit,
          productId: selected.id,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setTradeOff(result.data.tradeOff);
        setFacts(result.data.facts);
      } catch {
        setError('Could not write the trade-off. Please try again.');
      } finally {
        setBusy(null);
      }
    });
  }

  const specFields = getSpecFields(category);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-10">
      <div className="max-w-3xl">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-leaf">AI product comparison</div>
        <h1 className="mt-3 font-display text-5xl uppercase leading-none md:text-7xl">Find its Indian match</h1>
        <p className="mt-5 max-w-2xl text-lg text-ink/65">
          Enter or photograph a product you already use. We will research its specifications, compare them with verified Indian brands, and show the trade-offs honestly.
        </p>
      </div>

      <section className="mt-10 rounded-3xl border border-ink/10 bg-white p-5 shadow-sm md:p-8">
        <div className="grid gap-5 md:grid-cols-[1fr_220px]">
          <div>
            <label htmlFor="compare-category" className="mb-2 block text-xs font-medium text-ink/60">Category</label>
            <select id="compare-category" value={category} onChange={(event) => { setCategory(event.target.value); setAnalysis(null); }}
              className="w-full rounded-full border border-ink/15 px-5 py-3 outline-none focus:border-ink">
              {categories.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-ink/25 px-5 py-3 text-sm font-medium hover:bg-ink/5">
              <Camera className="h-4 w-4" /> Upload photo
            </button>
            <input ref={fileRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"
              onChange={(event) => choosePhoto(event.target.files?.[0])} />
          </div>
        </div>

        {photoPreview && (
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-ink/[0.03] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Product photo preview" className="h-20 w-20 rounded-xl object-contain" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Photo ready to identify</div>
              <div className="truncate text-xs text-ink/50">{photo?.name}</div>
            </div>
            <button type="button" onClick={runPhoto} disabled={busy !== null}
              className="rounded-full bg-ink px-5 py-2.5 text-sm text-ivory disabled:opacity-50">
              {busy === 'photo' ? 'Reading…' : 'Read photo'}
            </button>
          </div>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" />
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={150}
              placeholder="Foreign product, e.g. CeraVe Foaming Facial Cleanser"
              className="w-full rounded-full border border-ink/15 py-3.5 pl-12 pr-5 outline-none focus:border-ink" />
          </div>
          <input value={brand} onChange={(event) => setBrand(event.target.value)} maxLength={80}
            placeholder="Brand (optional)" className="w-full rounded-full border border-ink/15 px-5 py-3.5 outline-none focus:border-ink" />
        </div>
        <input value={url} onChange={(event) => setUrl(event.target.value)} type="url" placeholder="Official product page (optional)"
          className="mt-3 w-full rounded-full border border-ink/15 px-5 py-3.5 outline-none focus:border-ink" />
        <button type="button" onClick={runAnalyse} disabled={busy !== null || name.trim().length < 2}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-medium text-ivory disabled:opacity-50">
          <Sparkles className="h-4 w-4" /> {busy === 'analyse' ? 'Researching product…' : 'Compare with India'}
        </button>
        {busy === 'analyse' && <span className="ml-3 text-sm text-ink/50">This may take up to a minute.</span>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-madder/10 px-4 py-3 text-sm text-madder">{error}</p>}
      </section>

      {ranked && selected && (
        <>
          <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
            <ProductCardSide title="Foreign product" name={name} brand={brand} category={category} price={foreignPrice} />
            <div className="flex items-center justify-center font-mono text-xs text-ink/40 lg:px-3">VS</div>
            <IndianProductSide product={selected} category={category} />
          </section>

          <section className="mt-12">
            <h2 className="font-display text-3xl uppercase">Specification comparison</h2>
            <div className="mt-5 overflow-hidden rounded-3xl border border-ink/10 bg-white">
              <div className="hidden grid-cols-[1fr_1fr_1fr] border-b border-ink/10 bg-ink/[0.025] px-6 py-3 text-xs font-mono uppercase text-ink/50 md:grid">
                <span>Specification</span><span>{name}</span><span>{selected.name}</span>
              </div>
              {specFields.map((field, index) => (
                <div key={field.key} className={`grid gap-2 px-5 py-4 md:grid-cols-[1fr_1fr_1fr] md:px-6 ${index ? 'border-t border-ink/10' : ''}`}>
                  <div className="text-sm font-medium">{field.label}</div>
                  <div className="text-sm text-ink/65"><span className="md:hidden">Foreign: </span>{displayValue(foreignSpecs[field.key] ?? null)}{field.unit ? ` ${field.unit}` : ''}</div>
                  <div className="text-sm text-ink/65"><span className="md:hidden">Indian: </span>{displayValue(selected.specs[field.key] ?? null)}{field.unit ? ` ${field.unit}` : ''}</div>
                </div>
              ))}
            </div>
            {extraction?.sources.length ? (
              <p className="mt-3 text-xs text-ink/50">Web sources: {extraction.sources.map((source, index) => (
                <a key={source} href={source} target="_blank" rel="noopener noreferrer" className="mr-2 underline">
                  {index + 1}
                </a>
              ))}</p>
            ) : null}
          </section>

          <button type="button" onClick={runTradeOff} disabled={busy !== null}
            className="mt-7 rounded-full border border-ink px-7 py-3 font-medium hover:bg-ink hover:text-ivory disabled:opacity-50">
            {busy === 'tradeoff' ? 'Writing trade-off…' : 'Generate final trade-off'}
          </button>

          {tradeOff && (
            <section className="mt-8 rounded-3xl bg-leaf/10 p-7 md:p-9">
              <h2 className="font-display text-3xl uppercase">The trade-off</h2>
              <p className="mt-4 text-lg leading-relaxed">{tradeOff}</p>
              {facts.length > 0 && (
                <details className="mt-5 text-sm">
                  <summary className="cursor-pointer font-medium">Facts used in this conclusion</summary>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-ink/65">{facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
                </details>
              )}
            </section>
          )}

          {ranked.matches.length > 1 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl uppercase">Other close Indian alternatives</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {ranked.matches.slice(1).map((product) => (
                  <button key={product.id} type="button" onClick={() => { setSelectedId(product.id); setTradeOff(''); }}
                    className={`rounded-2xl border p-5 text-left ${selected.id === product.id ? 'border-leaf' : 'border-ink/10 bg-white hover:border-ink'}`}>
                    <div className="text-lg font-medium">{product.name}</div>
                    <div className="mt-1 text-sm text-ink/55">{product.brand ?? 'Indian startup'}</div>
                    <div className="mt-3 text-xs font-mono text-leaf">{product.result.score}% match</div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ProductCardSide({ title, name, brand, category, price }: { title: string; name: string; brand: string; category: string; price: number | null }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-ink/20 bg-white/60 p-6 opacity-85 md:p-8">
      <div className="text-xs font-mono uppercase tracking-wider text-ink/50">{title}</div>
      <div className="mt-3 flex aspect-[4/3] items-center justify-center rounded-2xl bg-ink/[0.03] text-ink/20">
        <Upload className="h-10 w-10" />
      </div>
      <h2 className="mt-5 font-display text-3xl leading-tight">{name || 'Foreign product'}</h2>
      {brand && <p className="mt-1 text-sm text-ink/60">{brand}</p>}
      {price !== null && <p className="mt-5 font-display text-3xl">₹{price.toLocaleString('en-IN')}</p>}
      <p className="mt-1 text-xs text-ink/50">Category: {category}</p>
    </div>
  );
}

function IndianProductSide({ product, category }: { product: RankedMatch; category: string }) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm md:p-8">
      <div className="text-xs font-mono uppercase tracking-wider text-leaf">Best Indian alternative</div>
      {product.imageUrl ? (
        <ProductImage src={product.imageUrl} alt={product.name} category={category} sizes="(min-width: 1024px) 30vw, 80vw" className="mt-3 aspect-[4/3] rounded-2xl" />
      ) : (
        <div className="mt-3 flex aspect-[4/3] items-center justify-center rounded-2xl bg-leaf/10 text-leaf"><Sparkles className="h-10 w-10" /></div>
      )}
      <h2 className="mt-5 font-display text-3xl leading-tight">{product.name}</h2>
      <p className="mt-1 text-sm text-ink/60">{product.brand ?? 'Indian brand'}</p>
      {product.price !== null && <p className="mt-5 font-display text-3xl">₹{product.price.toLocaleString('en-IN')}</p>}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-leaf/10 px-3 py-1 text-xs font-medium text-leaf">{product.result.score}% match</span>
        {product.buyUrl && <a href={product.buyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium underline">Buy brand <ExternalLink className="h-3.5 w-3.5" /></a>}
      </div>
    </div>
  );
}