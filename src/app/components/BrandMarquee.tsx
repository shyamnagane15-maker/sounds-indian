import type { CSSProperties } from 'react';

type Brand = { id: string; name: string; logo_url?: string | null };

function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 0C12 6.6 17.4 12 24 12C17.4 12 12 17.4 12 24C12 17.4 6.6 12 0 12C6.6 12 12 6.6 12 0Z" />
    </svg>
  );
}

// A dark band of brands that scrolls sideways forever.
// It pauses when hovered, and stands still for visitors who prefer reduced motion.
export default function BrandMarquee({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  // Repeat the brands until one copy is wider than a large screen, so the
  // loop never shows a gap, even with only a few brands.
  const repeats = Math.max(1, Math.ceil(10 / brands.length));
  const list = Array.from({ length: repeats }).flatMap(() => brands);
  const duration = Math.max(24, list.length * 3); // seconds for one full loop

  // Two identical copies side by side: the animation slides by exactly one copy.
  const renderCopy = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {list.map((b, i) => (
        <li key={`${b.id}-${i}`} className="flex shrink-0 items-center">
          <span className="mx-8 md:mx-12">
            {b.logo_url ? (
              <span className="block rounded-xl bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.logo_url} alt={b.name} className="h-9 w-auto max-w-[8rem] object-contain" />
              </span>
            ) : (
              <span className="font-display text-xl md:text-2xl uppercase tracking-tight whitespace-nowrap">
                {b.name}
              </span>
            )}
          </span>
          <Sparkle className="h-4 w-4 shrink-0 text-gold" />
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label="Brands on Sounds Indian" className="marquee overflow-hidden bg-ink text-ivory">
      <div className="py-5 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div
          className="marquee-track"
          style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
        >
          {renderCopy(false)}
          {renderCopy(true)}
        </div>
      </div>
    </section>
  );
}
