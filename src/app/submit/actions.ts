'use server';

import { CATEGORIES } from '../lib/categories';
import { admin } from '../lib/supabaseAdmin';

export type SubmitState = {
  ok: boolean;
  error?: string;
  values?: Record<string, string>;
};

type SubmittedProduct = {
  indian_product_name: string;
  foreign_replacement_name: string;
  buy_url: string;
  category: string;
};

// 21 characters, e.g. U12345MH2020PTC123456
const CIN_REGEX = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB
const LOGO_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const CATEGORY_SLUGS: string[] = CATEGORIES.map((c) => c.slug);

const field = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function submitBrand(
  _prev: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  // Spam trap: a hidden field that real people never fill in.
  // Bots do, so we pretend it worked and save nothing.
  if (field(formData, 'hp_field')) return { ok: true };

  // Keep what they typed so the form can refill itself if something is wrong
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') values[key] = value;
  }
  const fail = (error: string): SubmitState => ({ ok: false, error, values });

  const brand_name = field(formData, 'brand_name');
  const location = field(formData, 'location');
  const founding_story = field(formData, 'founding_story');
  const contact_email = field(formData, 'contact_email');
  const website = field(formData, 'website');
  const cin = field(formData, 'cin').toUpperCase();
  const notes = field(formData, 'notes');

  if (!brand_name || brand_name.length > 100)
    return fail('Enter your brand name (up to 100 characters).');
  if (!location || location.length > 100)
    return fail('Enter your location, for example "Thane, Maharashtra".');
  if (founding_story.length > 1500)
    return fail('The founding story must be 1,500 characters or fewer.');
  if (!EMAIL_REGEX.test(contact_email))
    return fail('Enter a valid contact email.');
  if (website && !isHttpUrl(website))
    return fail('The website must start with http:// or https://');
  if (!CIN_REGEX.test(cin))
    return fail('The CIN must be 21 characters, like U12345MH2020PTC123456.');
  if (notes.length > 1000)
    return fail('Additional notes must be 1,000 characters or fewer.');

  // Up to 3 products. Each one needs all three fields, or none.
  const products: SubmittedProduct[] = [];
  for (const i of [1, 2, 3]) {
  const indian = field(formData, `indian_name_${i}`);
  const foreign = field(formData, `foreign_name_${i}`);
  const buy = field(formData, `buy_url_${i}`);
  const category = field(formData, `category_${i}`);

  if (!indian && !foreign && !buy && !category) {
    if (i === 1) return fail('Add at least one product.');
    continue;
  }
  if (!indian || !foreign || !buy || !category)
    return fail(`Product ${i}: fill in all four fields, or leave them all empty.`);
  if (!CATEGORY_SLUGS.includes(category))
    return fail(`Product ${i}: choose a category from the list.`);
  if (!isHttpUrl(buy))
    return fail(`Product ${i}: the buy link must start with http:// or https://`);

  products.push({
    indian_product_name: indian,
    foreign_replacement_name: foreign,
    buy_url: buy,
    category,
  });
}

  // Logo checks
  const logo = formData.get('logo');
  if (!(logo instanceof File) || logo.size === 0)
    return fail('Upload your brand logo.');
  const ext = LOGO_TYPES[logo.type];
  if (!ext) return fail('The logo must be a PNG, JPG or WebP image.');
  if (logo.size > MAX_LOGO_BYTES) return fail('The logo must be 1 MB or smaller.');

  // Upload logo (random file name so nobody can guess other submissions' logos)
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from('brand-logos')
    .upload(path, logo, { contentType: logo.type });
  if (uploadError) {
    console.error('Logo upload failed:', uploadError);
    return fail('Could not upload the logo. Please try again.');
  }
  const { data: urlData } = admin.storage.from('brand-logos').getPublicUrl(path);

  // Save the submission
  const { error: insertError } = await admin.from('brand_submissions').insert({
    brand_name,
    location,
    founding_story: founding_story || null,
    contact_email,
    website: website || null,
    cin,
    logo_url: urlData.publicUrl,
    products,
    notes: notes || null,
  });

  if (insertError) {
    console.error('Submission insert failed:', insertError);
    // Don't leave an orphaned logo behind
    await admin.storage.from('brand-logos').remove([path]);
    return fail('Could not save your submission. Please try again.');
  }

  return { ok: true };
}