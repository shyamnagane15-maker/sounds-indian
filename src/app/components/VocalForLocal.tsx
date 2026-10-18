// "Vocal For Local" badge in tricolour colours: saffron, white and green, with navy lettering.
// It keeps growing and shrinking to catch the eye (see the .vocal-* styles in globals.css).
// The animation switches itself off for visitors who prefer reduced motion.
export default function VocalForLocal({ className = '' }: { className?: string }) {
  return (
    <div className={`-rotate-[5deg] ${className}`} role="note" aria-label="Vocal for local">
      {/* Soft saffron ripple that spreads out behind the badge */}
      <span aria-hidden="true" className="vocal-ripple absolute inset-0 rounded-2xl bg-saffron" />

      <div className="vocal-pulse relative overflow-hidden rounded-2xl border-[3px] border-white shadow-2xl ring-2 ring-india-navy">
        <div className="bg-saffron px-5 py-2 text-center font-display text-2xl leading-none text-india-navy">
          VOCAL
        </div>
        <div className="bg-white px-5 py-1.5 text-center font-display text-lg leading-none text-india-navy">
          FOR
        </div>
        <div className="bg-india-green px-5 py-2 text-center font-display text-2xl leading-none text-white">
          LOCAL
        </div>
      </div>
    </div>
  );
}
