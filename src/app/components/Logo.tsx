// Sounds Indian logo.
// The mark is an arch (a nod to Indian windows and doorways) holding five
// sound-wave bars, with the middle bar in gold.
//   tone="light": for ivory/white backgrounds (dark arch)
//   tone="dark":  for ink backgrounds, such as the footer (light arch)

type Tone = 'light' | 'dark';

const BARS = [
  { x: 9.5, y: 22, h: 8 },
  { x: 16, y: 18, h: 16 },
  { x: 22.5, y: 13, h: 26, accent: true },
  { x: 29, y: 18, h: 16 },
  { x: 35.5, y: 22, h: 8 },
];

export function LogoMark({
  tone = 'light',
  className = 'h-11 w-11',
}: {
  tone?: Tone;
  className?: string;
}) {
  const arch = tone === 'light' ? '#1F2A3D' : '#F4EFE4';
  const bar = tone === 'light' ? '#F4EFE4' : '#1F2A3D';

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M6 40V20a18 18 0 0 1 36 0v20q0 4-4 4H10q-4 0-4-4Z" fill={arch} />
      {BARS.map((b) => (
        <rect
          key={b.x}
          x={b.x}
          y={b.y}
          width="3"
          height={b.h}
          rx="1.5"
          fill={b.accent ? '#D9A22B' : bar}
        />
      ))}
    </svg>
  );
}

export default function Logo({ tone = 'light', className = '' }: { tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark tone={tone} />
      <span
        className={`font-display uppercase leading-[0.9] tracking-tight text-[1.1rem] ${
          tone === 'dark' ? 'text-ivory' : 'text-ink'
        }`}
      >
        <span className="block">Sounds</span>
        <span className="block">
          Indian<span className="text-gold">.</span>
        </span>
      </span>
    </span>
  );
}
