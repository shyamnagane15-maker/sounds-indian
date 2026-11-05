export type ProductBrand = {
  id?: string;
  name: string;
  location?: string | null;
  logo_url?: string | null;
  founding_story?: string | null;
  website?: string | null;
};

export type ProductRelation<T> = T | T[] | null;

export function firstRelation<T>(relation: ProductRelation<T> | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

export type ComparisonPoint = {
  id: string;
  tag: string;
  content: string;
};

export type ProductCardData = {
  id: string;
  indian_product_name: string;
  foreign_replacement_name: string;
  category: string | null;
  image_url?: string | null;
  price_inr: number | null;
  foreign_price_inr: number | null;
  brand?: ProductRelation<ProductBrand>;
};

export type ProductDetailData = ProductCardData & {
  buy_url: string | null;
  foreign_image_url?: string | null;
  trade_off: string | null;
  specs: Record<string, unknown> | null;
  foreign_specs: Record<string, unknown> | null;
  spec_sources: Record<string, string[]> | null;
  specs_checked_at: string | null;
  brand: ProductRelation<ProductBrand>;
  points: ComparisonPoint[] | null;
};

export type ProductOverviewBrand = { id: string; name: string; logo_url: string | null };

export type ProductOverviewData = Pick<
  ProductCardData,
  'id' | 'indian_product_name' | 'foreign_replacement_name' | 'category' | 'price_inr' | 'foreign_price_inr'
> & {
  brand: ProductRelation<ProductOverviewBrand>;
};
