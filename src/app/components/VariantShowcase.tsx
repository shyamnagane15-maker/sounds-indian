'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import ProductImage from './ProductImage';
import { formatINR, savingsPercent } from '../lib/format';
import type { ProductVariant } from '../lib/productTypes';

type Props = {
  name: string;
  category: string | null;
  variants: ProductVariant[];
  fallbackImage: string | null;
  fallbackPrice: number | null;
  foreignPrice: number | null;
  fallbackBuyUrl: string | null;
  brandName?: string | null;
};

export default function VariantShowcase({
  name, category, variants, fallbackImage, fallbackPrice, foreignPrice, fallbackBuyUrl, brandName,
}: Props) {
  const [index, setIndex] = useState(0);
  const [size, setSize] = useState<string | null>(null);

  const hasVariants = variants.length > 0;
  const current = hasVariants ? variants[Math.min(index, variants.length - 1)] : null;

  const image = current?.image_url ?? fallbackImage;
  const priceNum = current?.price_inr ?? fallbackPrice;
  const mrp = current?.mrp_inr ?? null;
  const buyUrl = current?.buy_url ?? fallbackBuyUrl;
  const sizes = current?.sizes ?? [];
  const saving = savingsPercent(priceNum, foreignPrice);
  const mrpOff = priceNum && mrp && mrp > priceNum ? Math.round(((mrp - priceNum) / mrp) * 100) : null;

  function pick(i: number) {
    setIndex(i);
    setSize(null); // sizes can differ per colour
  }

  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-6 md:p-8 shadow-sm">
      {/* Thumbnails beside the main image */}
      <div className={hasVariants && variants.length > 1 ? 'flex flex-col-reverse gap-3 md:flex-row' : ''}>
        {hasVariants && variants.length > 1 && (
          <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
            {variants.map((v, i) => (
              <button
                key={v.color}
                type="button"
                onClick={() => pick(i)}
                onMouseEnter={() => pick(i)}
                aria-label={`Show ${v.color}`}
                aria-pressed={i === index}
                className={`shrink-0 overflow-hidden rounded-xl border-2 ${i === index ? 'border-ink' : 'border-ink/10 hover:border-ink/40'}`}
              >
                <ProductImage src={v.image_url} alt={v.color} category={category} sizes="64px" className="h-16 w-16" />
              </button>
            ))}
          </div>
        )}
        <ProductImage
          src={image}
          alt={`${name}${current ? ` in ${current.color}` : ''}`}
          category={category}
          sizes="(min-width: 1024px) 40vw, 100vw"
          priority
          className="aspect-[4/3] flex-1 rounded-2xl"
        />
      </div>

      <div className="mt-6 text-xs font-mono uppercase tracking-wider text-leaf mb-2">Indian alternative</div>
      <h2 className="font-display text-2xl md:text-3xl leading-tight">{name}</h2>

      {/* Colour cards, Amazon style */}
      {hasVariants && (
        <div className="mt-5">
          <p className="text-sm text-ink/60">
            Colour: <span className="font-bold text-ink">{current?.color}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {variants.map((v, i) => {
              const p = v.price_inr ?? fallbackPrice;
              return (
                <button
                  key={v.color}
                  type="button"
                  onClick={() => pick(i)}
                  aria-pressed={i === index}
                  className={`w-28 overflow-hidden rounded-xl border-2 bg-white text-left ${i === index ? 'border-leaf' : 'border-ink/15 hover:border-ink/40'}`}
                >
                  <ProductImage src={v.image_url} alt={v.color} category={category} sizes="112px" className="h-24 w-full" />
                  <div className="border-t border-ink/10 px-2 py-1.5">
                    {p !== null && p !== undefined && <div className="text-sm font-bold">{formatINR(p)}</div>}
                    {v.mrp_inr ? <div className="text-xs text-ink/45 line-through">{formatINR(v.mrp_inr)}</div> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sizes */}
      {sizes.length > 0 && (
        <div className="mt-5">
          <p className="text-sm text-ink/60">
            Size: <span className="font-bold text-ink">{size ?? 'Select'}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={s === size}
                className={`min-w-14 rounded-lg border px-3 py-2 text-sm ${s === size ? 'border-leaf bg-leaf/10 font-bold' : 'border-ink/20 hover:border-ink/50'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="font-display text-4xl">{formatINR(priceNum) || 'Price not listed'}</span>
        {mrp && priceNum && mrp > priceNum && (
          <span className="text-ink/45 line-through">{formatINR(mrp)}</span>
        )}
        {mrpOff !== null && <span className="text-sm font-medium text-leaf">{mrpOff}% off</span>}
        {saving !== null && (
          <span className="rounded-full bg-leaf/15 px-3 py-1 text-sm font-bold text-leaf">
            {saving}% lower price
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-ink/50">Listed price</p>

      {/* Buy button for the chosen colour (only when there are variants) */}
      {hasVariants && buyUrl && (
        <a
          href={buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 font-medium text-ivory"
        >
          Buy on {brandName ?? 'the brand site'} <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}