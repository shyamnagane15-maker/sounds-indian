import type { Metadata, Viewport } from 'next';
import { Archivo_Black, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-archivo-black',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivoBlack.variable}`}>
      <body className="bg-ivory text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
