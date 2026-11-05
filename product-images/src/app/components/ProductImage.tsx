import Image from 'next/image';
import { Dumbbell, Footprints, Leaf, Package, Sparkles, CupSoda, type LucideIcon } from 'lucide-react';

// Shown when a product has no photo yet, so cards still look intentional
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'skincare-haircare': Sparkles,
  footwear: Footprints,
  'ayurvedic-natural': Leaf,
  'health-nutrition': Dumbbell,
  'food-beverages': CupSoda,
};

// A product photo in a box. Give the box its shape with className, for example
// "aspect-[4/3] rounded-2xl". Product photos usually have white backgrounds,
// so the box is white and the photo is shown whole (never cropped).
export default function ProductImage({
  src,
  alt,
  category,
  sizes,
  className = '',
  priority = false,
}: {
  src?: string | null;
  alt: string;
  category?: string | null;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const Icon = (category && CATEGORY_ICONS[category]) || Package;

  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-contain p-3" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/[0.05] text-ink/25" aria-hidden="true">
          <Icon className="h-10 w-10" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
