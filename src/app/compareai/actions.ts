'use server';

import { admin } from '../lib/supabaseAdmin';
import { CATEGORIES } from '../lib/categories';
import { cleanSpecs, rankMatches, type Candidate } from '../lib/specs';
import { draftTradeOff, extractSpecs, identifyProductFromImage } from '../lib/ai';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type PublicAnalysis = {
  extraction: Awaited<ReturnType<typeof extractSpecs>>;
  candidates: Candidate[];
};

const relationName = (value: unknown): string | null => {
  if (Array.isArray(value)) return value[0]?.name ?? null;
  if (value && typeof value === 'object' && 'name' in value) return String(value.name ?? '') || null;
  return null;
};

export async function identifyPhoto(formData: FormData, category: string): Promise<ActionResult<{ name: string; brand: string }>> {
  try {
    const file = formData.get('photo');
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Choose a product photo first.' };
    if (file.size > 4 * 1024 * 1024) return { ok: false, error: 'The photo must be smaller than 4 MB.' };

    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const identified = await identifyProductFromImage({ imageBase64: base64, mediaType: file.type, category });
    return { ok: true, data: { name: identified.name, brand: identified.brand } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Could not identify the photo.' };
  }
}

export async function analyseProduct(input: {
  category: string;
  name: string;
  brand?: string;
  url?: string;
}): Promise<ActionResult<PublicAnalysis>> {
  try {
    const category = input.category.trim();
    const name = input.name.trim();
    if (!CATEGORIES.some((item) => !item.comingSoon && item.slug === category)) return { ok: false, error: 'Choose a category.' };
    if (name.length < 2) return { ok: false, error: 'Enter the foreign product name.' };

    const extraction = await extractSpecs({
      category,
      name,
      brand: input.brand?.trim() || undefined,
      url: input.url?.trim() || undefined,
    });

    const { data, error } = await admin
      .from('products')
      .select('id, indian_product_name, price_inr, size_value, size_unit, specs, verification_status, image_url, buy_url, brand:brands(name)')
      .eq('category', category)
      .eq('verification_status', 'verified_by_team');
    if (error) throw new Error(error.message);

    const candidates: Candidate[] = (data ?? []).map((product) => ({
      id: product.id,
      name: product.indian_product_name,
      brand: relationName(product.brand),
      status: product.verification_status,
      price: product.price_inr,
      sizeValue: product.size_value,
      sizeUnit: product.size_unit,
      specs: cleanSpecs(category, product.specs),
      imageUrl: product.image_url,
      buyUrl: product.buy_url,
    }));

    return { ok: true, data: { extraction, candidates } };
  } catch (error) {
    console.error('analyseProduct failed:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Could not analyse this product.' };
  }
}

export async function compareWithIndianProduct(input: {
  category: string;
  foreignName: string;
  foreignSpecs: Record<string, unknown>;
  foreignPrice: number | null;
  foreignSizeValue: number | null;
  foreignSizeUnit: string | null;
  productId: string;
}): Promise<ActionResult<{ tradeOff: string; facts: string[] }>> {
  try {
    const { data, error } = await admin
      .from('products')
      .select('id, indian_product_name, price_inr, size_value, size_unit, specs, brand:brands(name)')
      .eq('id', input.productId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { ok: false, error: 'The Indian product could not be found.' };

    const indian = {
      name: data.indian_product_name,
      brand: relationName(data.brand),
      price: data.price_inr,
      sizeValue: data.size_value,
      sizeUnit: data.size_unit,
      specs: cleanSpecs(input.category, data.specs),
    };
    const foreign = {
      name: input.foreignName,
      brand: null,
      price: input.foreignPrice,
      sizeValue: input.foreignSizeValue,
      sizeUnit: input.foreignSizeUnit,
      specs: cleanSpecs(input.category, input.foreignSpecs),
    };
    const ranking = rankMatches(input.category, foreign.specs, [{
      id: data.id,
      name: indian.name,
      brand: indian.brand,
      status: 'verified_by_team',
      price: indian.price,
      sizeValue: indian.sizeValue,
      sizeUnit: indian.sizeUnit,
      specs: indian.specs,
    }]);
    const score = ranking.matches[0]?.result.score;

    const { buildFacts } = await import('../lib/specs');
    const facts = buildFacts(input.category, foreign, indian);
    if (!facts.length) return { ok: false, error: 'There are not enough stats for a reliable comparison yet.' };

    const draft = await draftTradeOff({
      foreignName: input.foreignName,
      indianName: indian.name,
      brand: indian.brand,
      facts: score !== undefined ? [...facts, `Stat similarity score: ${score}%.`] : facts,
    });
    return { ok: true, data: { tradeOff: draft.tradeOff, facts } };
  } catch (error) {
    console.error('compareWithIndianProduct failed:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Could not create the trade-off.' };
  }
}
