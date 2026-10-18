import Link from 'next/link';
import { Check, ArrowUpRight } from 'lucide-react';
import { categoryLabel } from '../lib/categories';
import { formatINR, savingsPercent } from '../lib/format';

export default function ProductCard({ product }: { product: any }) {
  const saving = savingsPercent(product.price_inr, product.foreign_price_inr);
  const price = formatINR(product.price_inr);
  const foreignPrice = formatINR(product.foreign_price_inr);

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col rounded-3xl border border-ink/10 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-medium">
          {categoryLabel(product.category) ?? 'Uncategorised'}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-leaf">
          <Check className="h-4 w-4" /> Verified
        </span>
      </div>

      <h3 className="font-display text-2xl leading-tight mt-5">{product.indian_product_name}</h3>
      <p className="text-sm text-ink/70 mt-1">by {product.brand?.name}</p>

      <div className="mt-5 rounded-2xl bg-ink/[0.04] p-4">
        <div className="text-xs font-mono uppercase tracking-wider text-ink/50 mb-1">Replaces</div>
        <div className="text-sm font-medium">{product.foreign_replacement_name}</div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-2">
        <span className="font-display text-3xl">{price || 'Price n/a'}</span>
        {foreignPrice && <span className="text-lg text-ink/40 line-through">{foreignPrice}</span>}
        {saving !== null && (
          <span className="rounded-full bg-leaf/15 px-2.5 py-1 text-xs font-bold text-leaf">
            {saving}% lower price
          </span>
        )}
      </div>

      <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium group-hover:opacity-60 transition-colors">
        See full comparison <ArrowUpRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
