// The single source of truth for categories.
// To add or rename one, change it here and every page picks it up.
// `slug` is what gets stored in the database, so don't change a slug once products use it.
export const CATEGORIES = [
  {
    slug: 'skincare-haircare',
    label: 'Skincare, cosmetics & haircare',
    short: 'Skincare & hair',
    description: 'Skincare, cosmetics and haircare',
  },
  {
    slug: 'footwear',
    label: 'Footwear',
    short: 'Footwear',
    description: 'Sneakers, running shoes, casual footwear',
  },
  {
    slug: 'ayurvedic-natural',
    label: 'Ayurvedic / natural personal care',
    short: 'Ayurvedic & natural',
    description: 'Products positioned as Ayurvedic, herbal or natural',
  },
  {
    slug: 'health-nutrition',
    label: 'Health & nutrition foods',
    short: 'Health foods',
    description: 'Protein foods, granola, healthy snacks',
  },
  {
    slug: 'food-beverages',
    label: 'Food & beverages',
    short: 'Food & drinks',
    description: 'Energy drinks, healthy beverages, packaged foods',
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export function categoryLabel(slug?: string | null): string | undefined {
  return CATEGORIES.find((c) => c.slug === slug)?.label;
}