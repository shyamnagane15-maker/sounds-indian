'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabaseServer';
import { CATEGORIES } from '../lib/categories';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORY_SLUGS: string[] = CATEGORIES.map((c) => c.slug);
const TAGS = ['ingredients', 'ethics', 'price', 'sourcing', 'certification', 'other'];

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

/* ---------- Login and logout ---------- */

export async function sendLoginLink(formData: FormData) {
  const email = field(formData, 'email').toLowerCase();
  if (!EMAIL_REGEX.test(email)) redirect('/brand/login?error=invalid');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error?.status === 429) redirect('/brand/login?error=rate');
  if (error) {
    // Every other failure (including "no account for this email") gets the same
    // reply as success, so nobody can use this form to find out which emails
    // have accounts. The real reason is in the terminal.
    console.error('Login link not sent:', error.message);
  }
  redirect('/brand/login?sent=1');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/brand/login');
}

/* ---------- Products ---------- */

export async function saveBrandProduct(formData: FormData) {
  const id = field(formData, 'id'); // empty when adding a new product
  const failPath = id ? `/brand/products/${id}` : '/brand/products/new';

  function back(message: string): never {
    redirect(`${failPath}?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/brand/login');

  const { data: brand } = await supabase
    .from('brands')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!brand) redirect('/brand/dashboard');

  const indian = field(formData, 'indian_product_name');
  const foreign = field(formData, 'foreign_replacement_name');
  const category = field(formData, 'category');
  const buyUrl = field(formData, 'buy_url');
  const tradeOff = field(formData, 'trade_off');
  const price = toNumber(field(formData, 'price_inr'));
  const foreignPrice = toNumber(field(formData, 'foreign_price_inr'));

  if (!indian || !foreign) back('Both product names are required.');
  if (!CATEGORY_SLUGS.includes(category)) back('Choose a category.');
  if (!buyUrl || !isHttpUrl(buyUrl)) back('Add a buy link starting with http:// or https://');
  if (Number.isNaN(price) || Number.isNaN(foreignPrice))
    back('Prices must be numbers of 0 or more.');
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

  // Brands never set verification_status. A database trigger forces
  // 'self_reported' on everything they save, so our team reviews every change.
  const row = {
    indian_product_name: indian,
    foreign_replacement_name: foreign,
    category,
    price_inr: price,
    foreign_price_inr: foreignPrice,
    buy_url: buyUrl,
    trade_off: tradeOff || null,
  };

  let productId = id;

  if (id) {
    const { data: updated, error } = await supabase
      .from('products')
      .update(row)
      .eq('id', id)
      .eq('brand_id', brand.id)
      .select('id');
    if (error) back(`Could not save: ${error.message}`);
    if (!updated || updated.length === 0) back('That product could not be found.');
  } else {
    const { data: created, error } = await supabase
      .from('products')
      .insert({ ...row, brand_id: brand.id })
      .select('id')
      .single();
    if (error || !created) back(`Could not save: ${error?.message ?? 'unknown error'}`);
    productId = created.id;
  }

  // Replace comparison points: insert the new ones first, then remove the old ones
  const { data: oldPoints } = await supabase
    .from('comparison_points')
    .select('id')
    .eq('product_id', productId);

  if (points.length > 0) {
    const { error } = await supabase
      .from('comparison_points')
      .insert(points.map((p) => ({ product_id: productId, tag: p.tag, content: p.content })));
    if (error) back(`Could not save comparison points: ${error.message}`);
  }

  const oldIds = (oldPoints ?? []).map((p) => p.id as string);
  if (oldIds.length > 0) {
    await supabase.from('comparison_points').delete().in('id', oldIds);
  }

  redirect('/brand/dashboard?saved=1');
}

export async function deleteBrandProduct(formData: FormData) {
  const id = field(formData, 'id');
  if (!id) redirect('/brand/dashboard');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/brand/login');

  const { data: brand } = await supabase
    .from('brands')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!brand) redirect('/brand/dashboard');

  // Make sure the product really belongs to this brand
  const { data: owned } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .eq('brand_id', brand.id)
    .maybeSingle();
  if (!owned) redirect('/brand/dashboard');

  await supabase.from('comparison_points').delete().eq('product_id', id);
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);

  redirect('/brand/dashboard?deleted=1');
}