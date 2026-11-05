import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

/**
 * Hero feature for a verified partner brand.
 *
 * Deliberately borderless: the product shots sit straight on the page with only
 * a soft drop shadow, overlapping each other like a press kit spread rather
 * than sitting inside a card. The blue side view is the front layer; the pink
 * detail crop tucks behind and to the left of it.
 */
export default function FeaturedPartner({ productId }: { productId?: string }) {
  return (
    <div className="relative w-full">
      {/* Brand line above the shots, still open — no panel, no rule. */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <div className="text-[12px] font-mono uppercase tracking-[0.22em] text-ink/45">
            Featured verified brand
          </div>
          <div className="mt-1 font-display text-4xl uppercase leading-none md:text-5xl">Aretto</div>
          <p className="mt-2 max-w-sm text-sm text-ink/60">
            Kids&rsquo; knit sneakers, assessed against our certification checklist.
          </p>
        </div>
        <Link
          href={productId ? `/product/${productId}` : '/?category=footwear#results'}
          className="group inline-flex items-center gap-1.5 rounded-full border border-ink/25 px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink hover:bg-ink/5"
        >
          {productId ? 'See the full assessment' : 'See certified footwear'}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Product shots. The square detail crop sits behind the toe of the side view. */}
      <div className="relative mt-8 aspect-[5/4] w-full sm:aspect-[16/11] lg:aspect-[1.45]">
        <Image
          src="/featured/aretto-pink.png"
          alt="Aretto sneaker in pink, close-up of the sole and knit upper"
          width={800}
          height={800}
          priority
          sizes="(min-width: 1024px) 22vw, 46vw"
          className="absolute left-[24%] top-[-10%] w-[40%] -rotate-[8deg] drop-shadow-[0_24px_30px_rgba(10,10,10,0.14)]"
        />
        <Image
          src="/featured/aretto-blue.png"
          alt="Aretto knit sneaker in teal and navy, side view"
          width={900}
          height={506}
          priority
          sizes="(min-width: 1024px) 46vw, 92vw"
          className="absolute left-[8%] top-[10%] w-[85%] -rotate-[0deg] drop-shadow-[0_30px_36px_rgba(10,10,10,0.16)]"
        />
      </div>
    </div>
  );
}
