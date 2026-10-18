// Steps 2 and 3's maths: what stats we track per category, how to clean them,
// how to score how close two products are, and how to compare prices.
// Everything here is plain code. No AI, so the same input always gives the same result.
// (This file has no server-only imports, so the admin page can also use it in the browser.)

import { formatINR } from './format';

export type SpecType = 'enum' | 'text' | 'number' | 'boolean' | 'list';
export type SpecValue = string | number | boolean | string[] | null;
export type Specs = Record<string, SpecValue>;

export type SpecField = {
  key: string;
  label: string;
  type: SpecType;
  options?: string[]; // for 'enum'
  unit?: string; // shown next to numbers
  weight: number; // how much this stat counts when matching (0 = not used for matching)
  mustMatch?: boolean; // if both products have it and it differs, they are NOT a candidate
  hint: string; // tells the AI what to look for
};

export const SIZE_UNITS = ['ml', 'l', 'g', 'kg', 'pair', 'piece'] as const;

/* ------------------------------------------------------------------ */
/* What we track for each category. Change weights or fields here.     */
/* ------------------------------------------------------------------ */

export const SPEC_FIELDS: Record<string, SpecField[]> = {
  'skincare-haircare': [
    {
      key: 'product_type', label: 'Product type', type: 'enum', weight: 5, mustMatch: true,
      options: ['cleanser', 'serum', 'moisturiser', 'sunscreen', 'exfoliant', 'toner', 'face mask', 'eye care', 'lip care', 'shampoo', 'conditioner', 'hair oil', 'hair mask', 'hair serum', 'styling', 'other'],
      hint: 'what kind of product it is',
    },
    { key: 'key_active', label: 'Key active ingredient', type: 'text', weight: 5, hint: 'the main active ingredient, lowercase, e.g. "glycolic acid" or "niacinamide"' },
    { key: 'active_concentration_pct', label: 'Active concentration', type: 'number', unit: '%', weight: 3, hint: 'percentage of the key active ingredient, only if the page states it' },
    { key: 'main_concern', label: 'Main concern it targets', type: 'text', weight: 3, hint: 'the main skin or hair concern, e.g. "acne", "dryness", "dandruff"' },
    { key: 'fragrance_free', label: 'Fragrance-free', type: 'boolean', weight: 1, hint: 'true only if the page says fragrance-free; false if it lists fragrance/parfum' },
    { key: 'vegan', label: 'Vegan', type: 'boolean', weight: 1, hint: 'true only if the page says vegan' },
    { key: 'cruelty_free', label: 'Cruelty-free', type: 'boolean', weight: 1, hint: 'true only if the page says cruelty-free' },
  ],
  footwear: [
    {
      key: 'shoe_type', label: 'Shoe type', type: 'enum', weight: 5, mustMatch: true,
      options: ['sneakers', 'running shoes', 'casual shoes', 'formal shoes', 'sports shoes', 'sandals', 'sliders', 'boots', 'other'],
      hint: 'what kind of shoe it is',
    },
    { key: 'target_gender', label: 'Made for', type: 'enum', options: ['men', 'women', 'unisex'], weight: 3, hint: 'men, women or unisex' },
    { key: 'upper_material', label: 'Upper material', type: 'text', weight: 2, hint: 'e.g. "mesh", "leather", "canvas"' },
    { key: 'sole_material', label: 'Sole material', type: 'text', weight: 2, hint: 'e.g. "rubber", "EVA"' },
    { key: 'closure', label: 'Closure', type: 'enum', options: ['laces', 'slip-on', 'velcro', 'buckle', 'other'], weight: 1, hint: 'how the shoe fastens' },
    { key: 'weight_g', label: 'Weight (one shoe)', type: 'number', unit: 'g', weight: 1, hint: 'weight of one shoe in grams, only if stated' },
  ],
  'ayurvedic-natural': [
    {
      key: 'product_type', label: 'Product type', type: 'enum', weight: 5, mustMatch: true,
      options: ['face cream', 'face wash', 'serum', 'body lotion', 'oil', 'shampoo', 'soap', 'toothpaste', 'balm', 'herbal supplement', 'other'],
      hint: 'what kind of product it is',
    },
    { key: 'key_ingredients', label: 'Key ingredients', type: 'list', weight: 5, hint: 'up to 6 main ingredients, lowercase, e.g. "neem", "turmeric"' },
    { key: 'main_benefit', label: 'Main benefit', type: 'text', weight: 3, hint: 'the main benefit claimed, e.g. "hair fall control"' },
    { key: 'certifications', label: 'Certifications', type: 'list', weight: 2, hint: 'certifications the page names, e.g. "AYUSH", "ECOCERT"' },
    { key: 'free_from', label: 'Free from', type: 'list', weight: 2, hint: 'what it says it is free from, e.g. "parabens", "sulphates"' },
  ],
  'health-nutrition': [
    {
      key: 'product_type', label: 'Product type', type: 'enum', weight: 5, mustMatch: true,
      options: ['protein powder', 'protein bar', 'granola', 'muesli', 'oats', 'nut butter', 'seeds', 'snack', 'supplement', 'other'],
      hint: 'what kind of product it is',
    },
    { key: 'protein_g_per_100g', label: 'Protein per 100 g', type: 'number', unit: 'g', weight: 4, hint: 'grams of protein per 100 g, from the nutrition table' },
    { key: 'sugar_g_per_100g', label: 'Sugar per 100 g', type: 'number', unit: 'g', weight: 3, hint: 'grams of sugar per 100 g, from the nutrition table' },
    { key: 'calories_per_100g', label: 'Calories per 100 g', type: 'number', unit: 'kcal', weight: 2, hint: 'kcal per 100 g, from the nutrition table' },
    { key: 'protein_source', label: 'Protein source', type: 'text', weight: 3, hint: 'e.g. "whey", "pea", "peanut"' },
    { key: 'vegan', label: 'Vegan', type: 'boolean', weight: 1, hint: 'true only if the page says vegan' },
    { key: 'gluten_free', label: 'Gluten-free', type: 'boolean', weight: 1, hint: 'true only if the page says gluten-free' },
  ],
  'food-beverages': [
    {
      key: 'product_type', label: 'Product type', type: 'enum', weight: 5, mustMatch: true,
      options: ['energy drink', 'soft drink', 'juice', 'tea', 'coffee', 'health drink', 'sparkling water', 'packaged snack', 'instant food', 'sauce', 'other'],
      hint: 'what kind of product it is',
    },
    { key: 'caffeine_mg_per_100ml', label: 'Caffeine per 100 ml', type: 'number', unit: 'mg', weight: 3, hint: 'mg of caffeine per 100 ml, only for drinks and only if stated' },
    { key: 'sugar_g_per_100', label: 'Sugar per 100 g or ml', type: 'number', unit: 'g', weight: 3, hint: 'grams of sugar per 100 g or 100 ml, from the nutrition table' },
    { key: 'calories_per_100', label: 'Calories per 100 g or ml', type: 'number', unit: 'kcal', weight: 2, hint: 'kcal per 100 g or 100 ml, from the nutrition table' },
    { key: 'flavour', label: 'Flavour', type: 'text', weight: 1, hint: 'the flavour or variant' },
    { key: 'vegan', label: 'Vegan', type: 'boolean', weight: 1, hint: 'true only if the page says vegan' },
  ],
};

export function getSpecFields(category?: string | null): SpecField[] {
  return (category && SPEC_FIELDS[category]) || [];
}

/* ------------------------------------------------------------------ */
/* Cleaning: whatever comes in (AI output, form input) is forced into  */
/* the shape we expect, and anything unknown becomes null.             */
/* ------------------------------------------------------------------ */

function cleanValue(field: SpecField, v: unknown): SpecValue {
  if (v === null || v === undefined || v === '') return null;

  switch (field.type) {
    case 'enum': {
      const s = String(v).trim().toLowerCase();
      if (field.options?.includes(s)) return s;
      return field.options?.includes('other') ? 'other' : null;
    }
    case 'text': {
      const s = String(v).trim().slice(0, 120);
      return s || null;
    }
    case 'number': {
      const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
      return Number.isFinite(n) && n >= 0 && n < 1e7 ? n : null;
    }
    case 'boolean': {
      if (typeof v === 'boolean') return v;
      const s = String(v).trim().toLowerCase();
      if (s === 'true' || s === 'yes') return true;
      if (s === 'false' || s === 'no') return false;
      return null;
    }
    case 'list': {
      const raw = Array.isArray(v) ? v : String(v).split(',');
      const items = raw
        .map((x) => String(x).trim().slice(0, 60))
        .filter(Boolean)
        .slice(0, 8);
      return items.length ? items : null;
    }
  }
}

export function cleanSpecs(category: string, raw: unknown): Specs {
  const input = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const out: Specs = {};
  for (const field of getSpecFields(category)) {
    out[field.key] = cleanValue(field, input[field.key]);
  }
  return out;
}

export function countKnown(category: string, specs: Specs): { known: number; total: number } {
  const fields = getSpecFields(category);
  const cleaned = cleanSpecs(category, specs);
  return { known: fields.filter((f) => cleaned[f.key] !== null).length, total: fields.length };
}

export function displayValue(v: SpecValue): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

/* ------------------------------------------------------------------ */
/* Step 2: how close are two products?                                 */
/* ------------------------------------------------------------------ */

const normalise = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s%.]/g, ' ').replace(/\s+/g, ' ').trim();

const tokens = (s: string) => new Set(normalise(s).split(' ').filter((t) => t.length > 1));

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let shared = 0;
  a.forEach((t) => {
    if (b.has(t)) shared++;
  });
  return shared / (a.size + b.size - shared);
}

// "other" on an enum means "we couldn't tell", so it counts as unknown
function isUnknown(field: SpecField, v: SpecValue | undefined): boolean {
  return v === null || v === undefined || (field.type === 'enum' && v === 'other');
}

// 0 to 1, or null when either side is unknown
function fieldSimilarity(field: SpecField, a: SpecValue | undefined, b: SpecValue | undefined): number | null {
  if (isUnknown(field, a) || isUnknown(field, b)) return null;

  switch (field.type) {
    case 'enum':
    case 'boolean':
      return a === b ? 1 : 0;
    case 'number': {
      const x = a as number;
      const y = b as number;
      const biggest = Math.max(Math.abs(x), Math.abs(y));
      return biggest === 0 ? 1 : 1 - Math.min(1, Math.abs(x - y) / biggest);
    }
    case 'text': {
      const x = normalise(a as string);
      const y = normalise(b as string);
      if (x === y) return 1;
      if (x.includes(y) || y.includes(x)) return 0.8;
      return jaccard(tokens(x), tokens(y));
    }
    case 'list': {
      const x = new Set((a as string[]).flatMap((i) => [...tokens(i)]));
      const y = new Set((b as string[]).flatMap((i) => [...tokens(i)]));
      return jaccard(x, y);
    }
  }
}

export type BreakdownRow = {
  key: string;
  label: string;
  foreign: SpecValue;
  indian: SpecValue;
  similarity: number | null; // null = couldn't compare (one side unknown)
  weight: number;
};

export type MatchResult = {
  eligible: boolean; // false when a must-match stat (like product type) clearly differs
  reason?: string;
  score: number; // 0 to 100
  coverage: number; // 0 to 1: how much of the important data we could actually compare
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
  breakdown: BreakdownRow[];
};

export function scoreMatch(category: string, foreign: Specs, indian: Specs): MatchResult {
  const fields = getSpecFields(category).filter((f) => f.weight > 0);
  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);

  let knownWeight = 0;
  let weighted = 0;
  let eligible = true;
  let reason: string | undefined;
  const warnings: string[] = [];
  const breakdown: BreakdownRow[] = [];

  for (const f of fields) {
    const a = foreign[f.key] ?? null;
    const b = indian[f.key] ?? null;
    const sim = fieldSimilarity(f, a, b);
    breakdown.push({ key: f.key, label: f.label, foreign: a, indian: b, similarity: sim, weight: f.weight });

    if (sim === null) {
      if (f.mustMatch) warnings.push(`${f.label} is missing for one of the products, so it isn't confirmed as the same kind of product.`);
      continue;
    }
    knownWeight += f.weight;
    weighted += f.weight * sim;
    if (f.mustMatch && sim < 1) {
      eligible = false;
      reason = `Different ${f.label.toLowerCase()}`;
    }
  }

  const coverage = totalWeight > 0 ? knownWeight / totalWeight : 0;
  const raw = knownWeight > 0 ? weighted / knownWeight : 0;
  // Missing data lowers the score, so a match based on one stat can't win by luck
  const score = Math.round(raw * (0.4 + 0.6 * coverage) * 100);
  const confidence = coverage >= 0.7 ? 'high' : coverage >= 0.4 ? 'medium' : 'low';

  return { eligible, reason, score, coverage, confidence, warnings, breakdown };
}

export type Candidate = {
  id: string;
  name: string;
  brand: string | null;
  status: string;
  price: number | null;
  sizeValue: number | null;
  sizeUnit: string | null;
  specs: Specs;
};

export type RankedMatch = Candidate & { result: MatchResult };

// Below this score we say "no close match" instead of forcing a bad pairing
export const MIN_SCORE = 55;
// ...and a match built on very few stats isn't trusted either, however well they agree
export const MIN_COVERAGE = 0.4;

export function rankMatches(category: string, foreign: Specs, candidates: Candidate[], limit = 5) {
  const scored: RankedMatch[] = candidates.map((c) => ({
    ...c,
    result: scoreMatch(category, foreign, c.specs),
  }));
  const eligible = scored
    .filter((m) => m.result.eligible)
    .sort(
      (a, b) =>
        b.result.score - a.result.score ||
        b.result.coverage - a.result.coverage ||
        a.name.localeCompare(b.name)
    );

  return {
    matches: eligible.slice(0, limit),
    bestIsGoodEnough:
      eligible.length > 0 &&
      eligible[0].result.score >= MIN_SCORE &&
      eligible[0].result.coverage >= MIN_COVERAGE,
    excluded: scored.length - eligible.length,
  };
}

/* ------------------------------------------------------------------ */
/* Step 3's facts: all the numbers are worked out here, in code.       */
/* The AI only gets these finished facts, so it never does the maths.  */
/* ------------------------------------------------------------------ */

export function pricePerUnit(
  price: number | null,
  size: number | null,
  unit: string | null
): { value: number; per: string } | null {
  if (price === null || size === null || size <= 0 || !unit) return null;
  switch (unit) {
    case 'ml': return { value: (price / size) * 100, per: '100 ml' };
    case 'l': return { value: (price / (size * 1000)) * 100, per: '100 ml' };
    case 'g': return { value: (price / size) * 100, per: '100 g' };
    case 'kg': return { value: (price / (size * 1000)) * 100, per: '100 g' };
    case 'pair': return { value: price / size, per: 'pair' };
    case 'piece': return { value: price / size, per: 'piece' };
    default: return null;
  }
}

export type Side = {
  name: string;
  price: number | null;
  sizeValue: number | null;
  sizeUnit: string | null;
  specs: Specs;
};

const percentDiff = (indian: number, foreign: number) => {
  const pct = Math.round((Math.abs(foreign - indian) / foreign) * 100);
  if (pct === 0) return 'about the same';
  return `${pct}% ${indian < foreign ? 'lower' : 'higher'}`;
};

export function buildFacts(category: string, foreign: Side, indian: Side): string[] {
  const facts: string[] = [];

  if (indian.price !== null && foreign.price !== null && foreign.price > 0) {
    facts.push(
      `Listed price: ${formatINR(indian.price)} for the Indian product vs ${formatINR(foreign.price)} for the foreign product (Indian is ${percentDiff(indian.price, foreign.price)}).`
    );
  }

  if (indian.sizeValue !== null && indian.sizeUnit && foreign.sizeValue !== null && foreign.sizeUnit) {
    facts.push(
      `Pack size: ${indian.sizeValue} ${indian.sizeUnit} (Indian) vs ${foreign.sizeValue} ${foreign.sizeUnit} (foreign).`
    );
  }

  const pi = pricePerUnit(indian.price, indian.sizeValue, indian.sizeUnit);
  const pf = pricePerUnit(foreign.price, foreign.sizeValue, foreign.sizeUnit);
  if (pi && pf && pi.per === pf.per && pf.value > 0) {
    facts.push(
      `Price per ${pi.per}: ${formatINR(Math.round(pi.value * 100) / 100)} (Indian) vs ${formatINR(Math.round(pf.value * 100) / 100)} (foreign), Indian is ${percentDiff(pi.value, pf.value)}.`
    );
  }

  for (const f of getSpecFields(category)) {
    const a = indian.specs[f.key] ?? null;
    const b = foreign.specs[f.key] ?? null;
    const unit = f.unit ? ` ${f.unit}` : '';
    if (a !== null && b !== null) {
      facts.push(`${f.label}: ${displayValue(a)}${unit} (Indian) vs ${displayValue(b)}${unit} (foreign).`);
    } else if (a !== null) {
      facts.push(`${f.label}: ${displayValue(a)}${unit} (Indian). Not found for the foreign product.`);
    } else if (b !== null) {
      facts.push(`${f.label}: ${displayValue(b)}${unit} (foreign). Not found for the Indian product.`);
    }
  }

  return facts;
}