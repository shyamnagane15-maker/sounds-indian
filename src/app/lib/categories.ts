// The single source of truth for categories.
// To add or rename one, change it here and every page picks it up.
// `slug` is what gets stored in the database, so don't change a slug once products use it.
//
//   image / imagePosition: the photo on the home page tile (files live in public/categories/)
//   comingSoon: true shows a "Coming soon" tile and hides it from the filter chips and footer.
//               Set it to false (and add an image) when you launch the category.

export type Category = {
  slug: string;
  label: string;
  short: string;
  description: string;
  image?: string;
  imagePosition?: string; // CSS object-position, to choose which part of the photo stays visible
  comingSoon?: boolean;
};

export const CATEGORIES: readonly Category[] = [
  {
    slug: 'skincare-haircare',
    label: 'Skincare, cosmetics & haircare',
    short: 'Skincare & hair',
    description: 'Skincare, cosmetics and haircare',
    image: '/categories/skincare-haircare.webp',
    imagePosition: '50% 27%',
  },
  {
    slug: 'footwear',
    label: 'Footwear',
    short: 'Footwear',
    description: 'Sneakers, running shoes, casual footwear',
    image: '/categories/footwear.webp',
    imagePosition: '50% 88%',
  },
  {
    slug: 'ayurvedic-natural',
    label: 'Ayurvedic / natural personal care',
    short: 'Ayurvedic & natural',
    description: 'Products positioned as Ayurvedic, herbal or natural',
    image: '/categories/ayurvedic-natural.webp',
    imagePosition: '50% 50%',
  },
  {
    slug: 'health-nutrition',
    label: 'Health & nutrition foods',
    short: 'Health foods',
    description: 'Protein foods, granola, healthy snacks',
    comingSoon: true,
  },
  {
    slug: 'food-beverages',
    label: 'Food & beverages',
    short: 'Food & drinks',
    description: 'Energy drinks, healthy beverages, packaged foods',
    comingSoon: true,
  },
];

// Categories that are open now (used for the filter chips and footer links)
export const LIVE_CATEGORIES: readonly Category[] = CATEGORIES.filter((c) => !c.comingSoon);

export type CategorySlug = string;

export function categoryLabel(slug?: string | null): string | undefined {
  return CATEGORIES.find((c) => c.slug === slug)?.label;
}
