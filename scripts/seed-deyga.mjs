import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  const env = {};
  for (const line of readFileSync(resolve('.env.local'), 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    env[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing Supabase URL or service-role key in .env.local');

const admin = createClient(url, key, { auth: { persistSession: false } });
const commonForeign = {
  fragrance_free: null,
  vegan: null,
  cruelty_free: null,
};

const products = [
  {
    indian_product_name: 'Beetroot Lip Balm - Classic 10g',
    foreign_replacement_name: 'Comparable conventional lip balm',
    price_inr: 270,
    buy_url: 'https://deyga.in/products/beetroot-lip-balm',
    trade_off: 'A beetroot lip balm for daily hydration, supplied in a classic 10 g balm.',
    image_url: 'https://cdn.shopify.com/s/files/1/0034/7901/1441/files/classic_1_5be117b5-e33a-45bb-95aa-6d3678a61d71.webp?v=1788723327',
    size_value: 10,
    size_unit: 'g',
    specs: { product_type: 'lip care', key_active: 'beetroot', active_concentration_pct: null, main_concern: 'dry and chapped lips', fragrance_free: true, vegan: true, cruelty_free: true },
    foreign_specs: { product_type: 'lip care', key_active: 'not specified', ...commonForeign },
  },
  {
    indian_product_name: 'Vitamin C Daily Glow Combo',
    foreign_replacement_name: 'Comparable conventional vitamin C skincare combo',
    price_inr: 999,
    buy_url: 'https://deyga.in/collections/best-sellers/products/vitamin-c-daily-glow-combo',
    trade_off: 'A vitamin C face-care combo with cleanser and serum steps for brightness and daily glow.',
    image_url: 'https://cdn.shopify.com/s/files/1/0034/7901/1441/files/vit-c_face_wash_combo.webp?v=1786532722',
    size_value: 1,
    size_unit: 'piece',
    specs: { product_type: 'serum', key_active: 'vitamin c', active_concentration_pct: null, main_concern: 'dullness and uneven skin tone', fragrance_free: null, vegan: true, cruelty_free: true },
    foreign_specs: { product_type: 'serum', key_active: 'vitamin c', ...commonForeign },
  },
  {
    indian_product_name: 'Charcoal Bath Bar 130g',
    foreign_replacement_name: 'Comparable conventional charcoal bath bar',
    price_inr: 370,
    buy_url: 'https://deyga.in/collections/best-sellers/products/charcoal-bath-bar',
    trade_off: 'A 130 g charcoal bath bar for cleansing and everyday body-care use.',
    image_url: 'https://cdn.shopify.com/s/files/1/0034/7901/1441/files/1_b3c7f194-5740-4dfb-8a05-cb1ade4a6617.webp?v=1788722063',
    size_value: 130,
    size_unit: 'g',
    specs: { product_type: 'other', key_active: 'activated charcoal', active_concentration_pct: null, main_concern: 'body cleansing and excess oil', fragrance_free: null, vegan: true, cruelty_free: true },
    foreign_specs: { product_type: 'other', key_active: 'charcoal', ...commonForeign },
  },
  {
    indian_product_name: 'Charcoal Face Wash 100ml',
    foreign_replacement_name: 'Comparable conventional charcoal face wash',
    price_inr: 450,
    buy_url: 'https://deyga.in/collections/best-sellers/products/charcoal-face-wash',
    trade_off: 'A 100 ml charcoal face wash for cleansing oily and acne-prone skin.',
    image_url: 'https://cdn.shopify.com/s/files/1/0034/7901/1441/files/charcoal_1_b9887a32-722d-4d44-a29f-da2cbf392158.webp?v=1788721416',
    size_value: 100,
    size_unit: 'ml',
    specs: { product_type: 'cleanser', key_active: 'activated charcoal', active_concentration_pct: null, main_concern: 'acne and excess oil', fragrance_free: null, vegan: true, cruelty_free: true },
    foreign_specs: { product_type: 'cleanser', key_active: 'charcoal', ...commonForeign },
  },
  {
    indian_product_name: 'Hair Growth Oil',
    foreign_replacement_name: 'Comparable conventional hair growth oil',
    price_inr: 600,
    buy_url: 'https://deyga.in/collections/best-sellers/products/hair-growth-oil',
    trade_off: 'A hair-growth oil for scalp application, with 100 ml as the entry pack size.',
    image_url: 'https://cdn.shopify.com/s/files/1/0034/7901/1441/files/imresizer-resize-Deyga_Ingredient_3524_47-_Hair_Growth_Oil_copy.jpg?v=1792231951',
    size_value: 100,
    size_unit: 'ml',
    specs: { product_type: 'hair oil', key_active: 'hair-nourishing botanical oils', active_concentration_pct: null, main_concern: 'hair fall and scalp nourishment', fragrance_free: true, vegan: true, cruelty_free: true },
    foreign_specs: { product_type: 'hair oil', key_active: 'botanical oils', ...commonForeign },
  },
];

const { data: existingBrand } = await admin.from('brands').select('id').eq('name', 'Deyga').maybeSingle();
let brandId = existingBrand?.id;
if (!brandId) {
  const { data, error } = await admin.from('brands').insert({
    name: 'Deyga',
    location: 'Chennai, Tamil Nadu',
    website: 'https://deyga.in',
    founding_story: 'Deyga is an Indian skincare and personal-care brand known for handmade, nature-led products made in small batches.',
  }).select('id').single();
  if (error) throw error;
  brandId = data.id;
}

for (const product of products) {
  const row = {
    ...product,
    brand_id: brandId,
    category: 'skincare-haircare',
    verification_status: 'verified_by_team',
    spec_sources: { indian: [product.buy_url] },
    specs_checked_at: new Date().toISOString(),
  };
  const { data: existing } = await admin.from('products').select('id').eq('indian_product_name', product.indian_product_name).maybeSingle();
  const result = existing
    ? await admin.from('products').update(row).eq('id', existing.id)
    : await admin.from('products').insert(row).select('id').single();
  if (result.error) throw result.error;
  console.log(`${existing ? 'Updated' : 'Added'} ${product.indian_product_name}`);
}
