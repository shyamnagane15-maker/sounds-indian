'use server';

import { admin } from '../../lib/supabaseAdmin';
import { CATEGORIES } from '../../lib/categories';
import {
  SIZE_UNITS,
  buildFacts,
  cleanSpecs,
  getSpecFields,
  type Candidate,
  type Specs,
} from '../../lib/specs';
import { draftTradeOff, extractSpecs, type Extraction } from '../../lib/ai';

// These actions run only on the server, and /management is protected by the admin login.
// AI output is never published automatically: it is only returned for you to review,
// and saving never changes a product's verification status.

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function clip(v: unknown, max: number): string {
  return String(v ?? '').trim().slice(0, max);
}

function httpUrl(v: unknown): string | null {
  const s = clip(v, 500);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 1e7 ? n : null;
}

function unitOrNull(v: unknown): string | null {
  const s = String(v ?? '').trim().toLowerCase();
  return (SIZE_UNITS as readonly string[]).includes(s) ? s : null;
}

function friendly(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return 'Something went wrong. Please try again.';
}

type ProductRow = {
  id: string;
  indian_product_name: string;
  price_inr: number | null;
  size_value: number | null;
  size_unit: string | null;
  specs: unknown;
  verification_status: string;
  brand: { name: string } | { name: string }[] | null;
};

const brandName = (b: ProductRow['brand']): string | null =>
  Array.isArray(b) ? (b[0]?.name ?? null) : (b?.name ?? null);

/* ------------------------------------------------------------------ */
/* Steps 1 and 2: stats for the foreign product + the catalogue to     */
/* match against. The matching itself runs live in the browser (it is  */
/* plain code), so you can edit a stat and watch the ranking change.   */
/* ------------------------------------------------------------------ */

export type AnalyseInput = { category: string; name: string; brand?: string; url?: string };
export type AnalyseOutput = {
  extraction: Extraction;
  candidates: Candidate[];
  withoutSpecs: number;
};

export async function analyseForeign(input: AnalyseInput): Promise<ActionResult<AnalyseOutput>> {
  try {
    const category = clip(input.category, 60);
    const name = clip(input.name, 150);
    if (!CATEGORY_SLUGS.includes(category)) return fail('Choose a category.');
    if (name.length < 2) return fail('Enter the foreign product name.');

    const brand = clip(input.brand, 80) || undefined;
    const url = httpUrl(input.url) ?? undefined;
    if (clip(input.url, 500) && !url) return fail('The product page link must start with http:// or https://');

    // Step 1: read the web
    const extraction = await extractSpecs({ name, brand, url, category });

    // Step 2 needs the catalogue
    const { data, error } = await admin
      .from('products')
      .select('id, indian_product_name, price_inr, size_value, size_unit, specs, verification_status, brand:brands(name)')
      .eq('category', category);
    if (error) return fail(error.message);

    const candidates: Candidate[] = ((data ?? []) as unknown as ProductRow[]).map((p) => ({
      id: p.id,
      name: p.indian_product_name,
      brand: brandName(p.brand),
      status: p.verification_status,
      price: numOrNull(p.price_inr),
      sizeValue: numOrNull(p.size_value),
      sizeUnit: unitOrNull(p.size_unit),
      specs: cleanSpecs(category, p.specs),
    }));

    const withoutSpecs = candidates.filter((c) => Object.values(c.specs).every((v) => v === null)).length;
    return { ok: true, data: { extraction, candidates, withoutSpecs } };
  } catch (e) {
    console.error('analyseForeign failed:', e);
    return fail(friendly(e));
  }
}

/* ------------------------------------------------------------------ */
/* Step 3: facts (worked out in code) + a drafted trade-off            */
/* ------------------------------------------------------------------ */

export type ForeignSide = {
  productId: string; // the Indian product chosen as the match
  category: string;
  foreignName: string;
  foreignPrice: number | null;
  foreignSizeValue: number | null;
  foreignSizeUnit: string | null;
  foreignSpecs: Record<string, unknown>;
};

export type DraftOutput = { tradeOff: string; facts: string[]; basis: string[] };

async function loadProduct(id: string) {
  const { data, error } = await admin
    .from('products')
    .select('id, indian_product_name, price_inr, size_value, size_unit, specs, verification_status, brand:brands(name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as ProductRow | null) ?? null;
}

export async function draftComparison(input: ForeignSide): Promise<ActionResult<DraftOutput>> {
  try {
    const category = clip(input.category, 60);
    if (!CATEGORY_SLUGS.includes(category)) return fail('Choose a category.');
    const foreignName = clip(input.foreignName, 150);
    if (!foreignName) return fail('The foreign product needs a name.');

    const product = await loadProduct(clip(input.productId, 60));
    if (!product) return fail('That product could not be found.');

    const facts = buildFacts(
      category,
      {
        name: foreignName,
        price: numOrNull(input.foreignPrice),
        sizeValue: numOrNull(input.foreignSizeValue),
        sizeUnit: unitOrNull(input.foreignSizeUnit),
        specs: cleanSpecs(category, input.foreignSpecs),
      },
      {
        name: product.indian_product_name,
        price: numOrNull(product.price_inr),
        sizeValue: numOrNull(product.size_value),
        sizeUnit: unitOrNull(product.size_unit),
        specs: cleanSpecs(category, product.specs),
      }
    );
    if (facts.length < 2) {
      return fail('There are too few stats to compare. Add stats to the products first, then try again.');
    }

    const { tradeOff, basis } = await draftTradeOff({
      foreignName,
      indianName: product.indian_product_name,
      brand: brandName(product.brand),
      facts,
    });
    return { ok: true, data: { tradeOff, facts, basis } };
  } catch (e) {
    console.error('draftComparison failed:', e);
    return fail(friendly(e));
  }
}

export type SaveComparisonInput = ForeignSide & { tradeOff: string; sources: string[] };

export async function saveComparison(input: SaveComparisonInput): Promise<ActionResult<{ id: string }>> {
  try {
    const category = clip(input.category, 60);
    if (!CATEGORY_SLUGS.includes(category)) return fail('Choose a category.');
    const id = clip(input.productId, 60);
    const foreignName = clip(input.foreignName, 150);
    const tradeOff = clip(input.tradeOff, 600);
    if (!foreignName) return fail('The foreign product needs a name.');
    if (tradeOff.length < 10) return fail('Write a trade-off of at least a sentence.');

    const { data: existing, error: readError } = await admin
      .from('products')
      .select('spec_sources')
      .eq('id', id)
      .maybeSingle();
    if (readError) return fail(readError.message);
    if (!existing) return fail('That product could not be found.');

    const sources = (Array.isArray(input.sources) ? input.sources : [])
      .map((s) => httpUrl(s))
      .filter((s): s is string => s !== null)
      .slice(0, 5);

    const { error } = await admin
      .from('products')
      .update({
        foreign_replacement_name: foreignName,
        foreign_price_inr: numOrNull(input.foreignPrice),
        foreign_size_value: numOrNull(input.foreignSizeValue),
        foreign_size_unit: unitOrNull(input.foreignSizeUnit),
        foreign_specs: cleanSpecs(category, input.foreignSpecs),
        trade_off: tradeOff,
        spec_sources: { ...((existing.spec_sources as object) ?? {}), foreign: sources },
        specs_checked_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) return fail(error.message);

    return { ok: true, data: { id } };
  } catch (e) {
    console.error('saveComparison failed:', e);
    return fail(friendly(e));
  }
}

/* ------------------------------------------------------------------ */
/* Catalogue products: fill in (or edit) the Indian product's stats    */
/* ------------------------------------------------------------------ */

export type CatalogueExtraction = { extraction: Extraction };

export async function extractCatalogueSpecs(productId: string): Promise<ActionResult<CatalogueExtraction>> {
  try {
    const { data, error } = await admin
      .from('products')
      .select('id, indian_product_name, buy_url, category, brand:brands(name)')
      .eq('id', clip(productId, 60))
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail('That product could not be found.');

    const row = data as unknown as {
      indian_product_name: string;
      buy_url: string | null;
      category: string | null;
      brand: ProductRow['brand'];
    };
    if (!row.category || getSpecFields(row.category).length === 0) {
      return fail('Set a valid category on this product first.');
    }

    const extraction = await extractSpecs({
      name: row.indian_product_name,
      brand: brandName(row.brand) ?? undefined,
      url: httpUrl(row.buy_url) ?? undefined,
      category: row.category,
    });
    return { ok: true, data: { extraction } };
  } catch (e) {
    console.error('extractCatalogueSpecs failed:', e);
    return fail(friendly(e));
  }
}

export type SaveCatalogueInput = {
  productId: string;
  specs: Record<string, unknown>;
  sizeValue: number | null;
  sizeUnit: string | null;
  sources: string[];
};

export async function saveCatalogueSpecs(input: SaveCatalogueInput): Promise<ActionResult<{ id: string }>> {
  try {
    const id = clip(input.productId, 60);
    const { data, error: readError } = await admin
      .from('products')
      .select('category, spec_sources')
      .eq('id', id)
      .maybeSingle();
    if (readError) return fail(readError.message);
    if (!data) return fail('That product could not be found.');
    if (!data.category || getSpecFields(data.category).length === 0) {
      return fail('Set a valid category on this product first.');
    }

    const sources = (Array.isArray(input.sources) ? input.sources : [])
      .map((s) => httpUrl(s))
      .filter((s): s is string => s !== null)
      .slice(0, 5);

    const { error } = await admin
      .from('products')
      .update({
        specs: cleanSpecs(data.category, input.specs as Specs),
        size_value: numOrNull(input.sizeValue),
        size_unit: unitOrNull(input.sizeUnit),
        spec_sources: { ...((data.spec_sources as object) ?? {}), indian: sources },
        specs_checked_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) return fail(error.message);

    return { ok: true, data: { id } };
  } catch (e) {
    console.error('saveCatalogueSpecs failed:', e);
    return fail(friendly(e));
  }
}