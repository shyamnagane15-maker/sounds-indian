/**
 * Circular "SoundsIndian Verified" rubber stamp, shown on verified product pages.
 *
 * Drawn as inline SVG so it stays crisp at any size. To read as a real stamp
 * rather than a badge:
 *   - the artwork is defined once (`#si-art`) and printed twice: a faint copy
 *     offset by less than a pixel behind a solid copy, which is what ink
 *     spread looks like when a rubber stamp presses unevenly;
 *   - the whole group passes through a turbulence + displacement filter, so
 *     every edge (rings, letterforms, check) is slightly wobbly and porous;
 *   - a heavy outer ring, a thin rule, arched type, seal stars at 3 and 9
 *     o'clock and a smaller inner ring around the check.
 *
 * Geometry (viewBox 120, centre 60): top type baseline r 40 → glyphs 40→47,
 * bottom type baseline r 49.5 → glyphs 42.5→49.5, rings at 58, 53 and 33.5,
 * stars at r 46. Nothing touches, verified by sampling ink along radii.
 *
 * Colour follows `currentColor` (text-leaf), so set it with text-* utilities.
 */
export default function VerifiedStamp({
  className = '',
  label = 'SoundsIndian verified',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true" className="-rotate-[11deg] text-leaf" fill="none">
        <defs>
          {/* Top arc: left → over the top → right, so the text reads left to right. */}
          <path id="si-stamp-top" d="M 20,60 A 40,40 0 0,1 100,60" />
          {/* Bottom arc: left → under the bottom → right, so the text stays upright. */}
          <path id="si-stamp-bottom" d="M 10.5,60 A 49.5,49.5 0 0,0 109.5,60" />

          {/* Worn, hand-pressed edges. */}
          <filter id="si-stamp-ink" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.62"
              numOctaves="3"
              seed="7"
              result="grain"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="grain"
              scale="1.1"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* The seal itself: printed twice for uneven ink coverage. */}
          <g id="si-stamp-art">
            {/* Rings: heavy outer, thin rule, inner medallion */}
            <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="3" />
            <circle cx="60" cy="60" r="53" stroke="currentColor" strokeWidth="1.1" opacity="0.8" />
            <circle cx="60" cy="60" r="33.5" stroke="currentColor" strokeWidth="1.1" opacity="0.8" />

            {/* Arched type */}
            <text
              fill="currentColor"
              fontSize="11"
              fontWeight="700"
              letterSpacing="1.1"
              textAnchor="middle"
            >
              <textPath href="#si-stamp-top" startOffset="50%">
                SOUNDSINDIAN
              </textPath>
            </text>
            <text
              fill="currentColor"
              fontSize="9"
              fontWeight="700"
              letterSpacing="3.4"
              textAnchor="middle"
            >
              <textPath href="#si-stamp-bottom" startOffset="50%">
                VERIFIED
              </textPath>
            </text>

            {/* Seal stars at 3 and 9 o'clock */}
            <g fill="currentColor" stroke="none">
              <path
                transform="translate(14 60)"
                d="M0,-4 L0.999,-1.375 L3.804,-1.236 L1.617,0.525 L2.351,3.236 L0,1.7 L-2.351,3.236 L-1.617,0.525 L-3.804,-1.236 L-0.999,-1.375 Z"
              />
              <path
                transform="translate(106 60)"
                d="M0,-4 L0.999,-1.375 L3.804,-1.236 L1.617,0.525 L2.351,3.236 L0,1.7 L-2.351,3.236 L-1.617,0.525 L-3.804,-1.236 L-0.999,-1.375 Z"
              />
            </g>

            {/* Centre check */}
            <path
              d="M46 61.5 L55 70.5 L74 51.5"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </defs>

        <g filter="url(#si-stamp-ink)" opacity="0.94">
          {/* Ghosted first impression, then the clean one on top. */}
          <use href="#si-stamp-art" transform="translate(0.9 0.7)" opacity="0.3" />
          <use href="#si-stamp-art" />
        </g>
      </svg>
    </div>
  );
}
