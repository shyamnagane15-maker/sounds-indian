'use server';

import { revalidatePath } from 'next/cache';
import { CATEGORIES } from '../../../lib/categories';
import { redirect } from 'next/navigation';
import { admin } from '../../../lib/supabaseAdmin';

const TAGS = ['ingredients', 'ethics', 'price', 'sourcing', 'certification', 'other'];
const CATEGORY_SLUGS: string[] = CATEGORIES.map((c) => c.slug);
const field = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();

// Empty -> null, a valid number -> number, anything else -> NaN (invalid)
function toNumber(value: string): number | null {
  if (value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function refreshPages() {
  revalidatePath('/');
  revalidatePath('/management');
}

export async function saveProduct(formData: FormData) {
  const id = field(formData, 'id');
  const intent = field(formData, 'intent'); // save | verify | unpublish

  function back(message: string): never {
    redirect(`/management/products/${id}?error=${encodeURIComponent(message)}`);
  }

  const indian = field(formData, 'indian_product_name');
  const foreign = field(formData, 'foreign_replacement_name');
  const category = field(formData, 'category');
  const buyUrl = field(formData, 'buy_url');
  const tradeOff = field(formData, 'trade_off');
  const price = toNumber(field(formData, 'price_inr'));
  const foreignPrice = toNumber(field(formData, 'foreign_price_inr'));

  if (!id) back('Missing product id.');
  if (!indian || !foreign) back('Both product names are required.');
  if (Number.isNaN(price) || Number.isNaN(foreignPrice))
    back('Prices must be numbers of 0 or more.');
  if (buyUrl && !isHttpUrl(buyUrl)) back('The buy link must start with http:// or https://');
  if (category && !CATEGORY_SLUGS.includes(category)) back('Choose a category from the list.');
  if (tradeOff.length > 600) back('The trade-off must be 600 characters or fewer.');

  // Comparison points: rows with no text are dropped
  const points: { tag: string; content: string }[] = [];
  for (let i = 0; i < 20; i++) {
    if (!formData.has(`point_content_${i}`)) break;
    const content = field(formData, `point_content_${i}`);
    const tag = field(formData, `point_tag_${i}`);
    if (!content) continue;
    if (!TAGS.includes(tag)) back('One of the comparison points has an invalid type.');
    if (content.length > 500) back('Each comparison point must be 500 characters or fewer.');
    points.push({ tag, content });
  }

  // 1. Save the product fields
  const { error: updateError } = await admin
    .from('products')
    .update({
      indian_product_name: indian,
      foreign_replacement_name: foreign,
      category: category || null,
      price_inr: price,
      foreign_price_inr: foreignPrice,
      buy_url: buyUrl || null,
      trade_off: tradeOff || null,
    })
    .eq('id', id);
  if (updateError) back(`Could not save: ${updateError.message}`);

  // 2. Replace comparison points. Insert the new ones first, then remove the old
  // ones, so a failure never leaves the product with no points.
  const { data: oldPoints } = await admin
    .from('comparison_points')
    .select('id')
    .eq('product_id', id);

  if (points.length > 0) {
    const { error: insertError } = await admin
      .from('comparison_points')
      .insert(points.map((p) => ({ product_id: id, tag: p.tag, content: p.content })));
    if (insertError) back(`Could not save comparison points: ${insertError.message}`);
  }

  const oldIds = (oldPoints ?? []).map((p) => p.id as string);
  if (oldIds.length > 0) {
    await admin.from('comparison_points').delete().in('id', oldIds);
  }

  // 3. Status changes
  if (intent === 'unpublish') {
    const { error } = await admin
      .from('products')
      .update({ verification_status: 'self_reported' })
      .eq('id', id);
    if (error) back(`Could not unpublish: ${error.message}`);
    refreshPages();
    redirect('/management');
  }

  if (intent === 'verify') {
    const missing: string[] = [];
    if (price === null) missing.push('the price');
    if (!category) missing.push('the category');
    if (foreignPrice === null) missing.push('the foreign price');
    if (!buyUrl) missing.push('the buy link');
    if (!tradeOff) missing.push('the trade-off');
    if (points.length === 0) missing.push('at least one comparison point');

    if (missing.length > 0) {
      refreshPages();
      back(`Saved as a draft. To verify, you still need: ${missing.join(', ')}.`);
    }

    const { error } = await admin
      .from('products')
      .update({ verification_status: 'verified_by_team' })
      .eq('id', id);
    if (error) back(`Could not verify: ${error.message}`);
    refreshPages();
    redirect('/management');
  }

  refreshPages();
  redirect(`/management/products/${id}?saved=1`);
}

export async function deleteProduct(formData: FormData) {
  const id = field(formData, 'id');
  if (!id) return;

  await admin.from('comparison_points').delete().eq('product_id', id);
  const { error } = await admin.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);

  refreshPages();
  redirect('/management');
}