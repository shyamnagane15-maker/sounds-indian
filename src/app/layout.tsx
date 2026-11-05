import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import PeepingDiscountSticker from './components/PeepingDiscountSticker';
import OpeningIntro from './components/OpeningIntro';
import { Fredoka, Nunito } from 'next/font/google';
import './globals.css';

// Nunito for body text (softly rounded), Fredoka Bold for headlines (bold and round, like the logo)
const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-fredoka',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Sounds Indian | Verified Indian alternatives to global brands',
    template: '%s | Sounds Indian',
  },
  description:
    'Compare the global products you use with verified Indian alternatives: price, ingredients, ethics and the honest trade-off, side by side.',
};

// Tells browsers the site is designed in light colours, so they don't force a dark mode on it
export const viewport: Viewport = {
  colorScheme: 'only light',
};

// Runs before first paint: shows the intro overlay immediately on a first
// visit, and never shows it to returning visitors in the same session.
const introGuard = `
(function () {
  try {
    if (window.sessionStorage.getItem('sounds-indian-opening-intro-played') !== 'true') {
      document.documentElement.classList.add('opening-intro-active');
    }
  } catch (e) {
    document.documentElement.classList.add('opening-intro-active');
  }
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${fredoka.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: introGuard }} />
      </head>
      <body className="bg-ivory text-ink font-sans antialiased">
        <PeepingDiscountSticker />
        <OpeningIntro />
        {children}
      </body>
    </html>
  );
}