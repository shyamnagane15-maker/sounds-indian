/**
 * One-off seed: verified footwear comparisons from official listed prices (Oct 2026).
 * Usage (from repo root): node scripts/seed-footwear.mjs
 * Never prints env values. Skips a product if the Indian name already exists.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  const raw = readFileSync(resolve('.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase URL or service-role key in .env.local');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const brands = [
  {
    name: 'Comet',
    location: 'Bengaluru, Karnataka',
    website: 'https://www.wearcomet.com',
    founding_story:
      'Bengaluru sneaker brand (Grails Marketing) making cushioned lifestyle shoes with a roomier toe box aimed at Indian feet.',
  },
  {
    name: "Neeman's",
    location: 'Hyderabad, Telangana',
    website: 'https://neemans.com',
    founding_story:
      'Hyderabad-based brand making casual shoes in India from cotton, merino and recycled materials, sold online and in its own stores.',
  },
  {
    name: 'Campus',
    location: 'New Delhi, Delhi',
    website: 'https://www.campusshoes.com',
    founding_story:
      'Campus Activewear Ltd is a Delhi-based listed sports-footwear company. Shoes are designed and marketed in India.',
  },
  {
    name: 'Abros',
    location: 'Gurugram, Haryana',
    website: 'https://abrosshoes.com',
    founding_story:
      'Gurugram sports-footwear brand (Abros Sports International) making affordable running and gym shoes, manufactured in India.',
  },
  {
    name: 'Sparx',
    location: 'New Delhi, Delhi',
    website: 'https://relaxofootwear.com',
    founding_story:
      'Sports and casual line of Relaxo Footwears Ltd, a long-running Indian manufacturer based in Delhi.',
  },
  {
    name: 'Red Chief',
    location: 'Kanpur, Uttar Pradesh',
    website: 'https://redchief.in',
    founding_story:
      'Kanpur leather-footwear brand (Leayan Global) known for genuine-leather formals, boots and derbies made in India.',
  },
];

const products = [
  {
    brand: 'Comet',
    indian_product_name: 'Comet Apex STRATOS',
    foreign_replacement_name: 'Nike Dunk Low Retro',
    category: 'footwear',
    price_inr: 6299,
    foreign_price_inr: 8295,
    buy_url: 'https://www.wearcomet.com/products/apex-stratos',
    trade_off:
      'Apex is a sport-inspired lifestyle sneaker with mesh and faux leather, not the Dunk’s premium leather upper or 1980s basketball silhouette. You get more cushioning and a lower listed price; you do not get that heritage shape or leather break-in.',
    size_value: 1,
    size_unit: 'pair',
    foreign_size_value: 1,
    foreign_size_unit: 'pair',
    specs: {
      shoe_type: 'sneakers',
      target_gender: 'unisex',
      upper_material: 'breathable mesh with premium faux leather',
      sole_material: 'EVA midsole, natural rubber outsole, TPU plate',
      closure: 'laces',
      weight_g: null,
    },
    foreign_specs: {
      shoe_type: 'sneakers',
      target_gender: 'men',
      upper_material: 'leather',
      sole_material: 'rubber',
      closure: 'laces',
      weight_g: null,
    },
    spec_sources: {
      indian: ['https://www.wearcomet.com/products/apex-stratos'],
      foreign: ['https://www.nike.com/in/t/dunk-low-retro-shoe-66RGqF'],
    },
    points: [
      {
        tag: 'price',
        content:
          'Listed at ₹6,299 on Comet’s site versus ₹8,295 MRP for Nike Dunk Low Retro on Nike India (October 2026).',
      },
      {
        tag: 'sourcing',
        content:
          'Comet lists country of origin as India (Grails Marketing, Bengaluru). The Dunk Low Retro on Nike India is imported (China / Indonesia / Vietnam).',
      },
      {
        tag: 'other',
        content:
          'Apex uses breathable mesh with faux leather, SpacewalkX foam, a TPU “Sharkfin” plate and a natural-rubber outsole. The Dunk uses a premium leather upper and a rubber hoops outsole.',
      },
    ],
  },
  {
    brand: 'Comet',
    indian_product_name: 'Comet X Lows Chestnut',
    foreign_replacement_name: 'adidas Samba OG',
    category: 'footwear',
    price_inr: 4299,
    foreign_price_inr: 10999,
    buy_url: 'https://www.wearcomet.com/products/x-lows-chestnut',
    trade_off:
      'X Lows use faux leather and faux suede with a cushioned EVA insert; Samba OG is a leather/suede football-to-street icon with a gum sole. You pay less and get a roomier Indian-fit toe box; you do not get Samba’s heritage materials or silhouette.',
    size_value: 1,
    size_unit: 'pair',
    foreign_size_value: 1,
    foreign_size_unit: 'pair',
    specs: {
      shoe_type: 'casual shoes',
      target_gender: 'unisex',
      upper_material: 'premium faux leather and faux suede',
      sole_material: 'EVA insert, natural rubber outsole',
      closure: 'laces',
      weight_g: null,
    },
    foreign_specs: {
      shoe_type: 'casual shoes',
      target_gender: 'unisex',
      upper_material: 'leather and suede',
      sole_material: 'gum rubber',
      closure: 'laces',
      weight_g: null,
    },
    spec_sources: {
      indian: ['https://www.wearcomet.com/products/x-lows-chestnut'],
      foreign: ['https://www.adidas.co.in/samba-og-shoes/IH6820.html'],
    },
    points: [
      {
        tag: 'price',
        content:
          'Listed at ₹4,299 on Comet versus ₹10,999 MRP for Samba OG on adidas.co.in (October 2026).',
      },
      {
        tag: 'sourcing',
        content: 'X Lows are designed, marketed and sold from Bengaluru, India. Samba OG is an adidas Originals import.',
      },
      {
        tag: 'other',
        content:
          'Comet calls out a wide toe box for broader Indian feet and a 3-layer SpaceWalk sole. Samba is a low-profile indoor-football shape, not a cushioned daily trainer.',
      },
    ],
  },
  {
    brand: "Neeman's",
    indian_product_name: "Neeman's Cotton Classic Sneakers",
    foreign_replacement_name: 'adidas Stan Smith',
    category: 'footwear',
    price_inr: 1799,
    foreign_price_inr: 8999,
    buy_url: 'https://neemans.com/products/cotton-classic',
    trade_off:
      'Cotton Classic is a soft cotton-knit casual sneaker, not a leather tennis shoe. Stan Smith’s upper is leather with the perforated 3-Stripes; Neeman’s is lighter and much cheaper, but it will not look or wear like a leather court classic, and it is not as water-resistant.',
    size_value: 1,
    size_unit: 'pair',
    foreign_size_value: 1,
    foreign_size_unit: 'pair',
    specs: {
      shoe_type: 'sneakers',
      target_gender: 'unisex',
      upper_material: 'natural cotton',
      sole_material: 'natural rubber',
      closure: 'laces',
      weight_g: null,
    },
    foreign_specs: {
      shoe_type: 'sneakers',
      target_gender: 'unisex',
      upper_material: 'leather',
      sole_material: 'rubber',
      closure: 'laces',
      weight_g: null,
    },
    spec_sources: {
      indian: ['https://neemans.com/products/cotton-classic'],
      foreign: ['https://www.adidas.co.in/stan-smith-shoes/M20324.html'],
    },
    points: [
      {
        tag: 'price',
        content:
          'Listed at ₹1,799 on Neeman’s (from ₹2,999) versus ₹8,999 MRP for Stan Smith on adidas.co.in (October 2026).',
      },
      {
        tag: 'ethics',
        content:
          'Neeman’s positions the brand around made-in-India production and recycled materials at company level (it cites plastic bottles recycled into footwear). Stan Smith is a global leather tennis icon from adidas.',
      },
      {
        tag: 'other',
        content:
          'Cotton Classic uses a natural-cotton upper for a soft, lightweight casual fit. Stan Smith uses a leather upper that lasts and cleans differently, and carries decades of tennis-heritage styling.',
      },
    ],
  },
  {
    brand: 'Campus',
    indian_product_name: 'Campus Ferox',
    foreign_replacement_name: 'Nike Revolution 7',
    category: 'footwear',
    price_inr: 1149,
    foreign_price_inr: 3695,
    buy_url: 'https://www.campusshoes.com/products/ferox-black-pacific-mens-running-shoes',
    trade_off:
      'Ferox is an everyday mesh trainer with Pillofoam and an EVA outsole — built for light runs, gym and errands, not a documented road-running geometry. Revolution 7 publishes a 10 mm drop and ~286 g weight (UK 9) and uses a rubber traction outsole. Expect less structured running data and a simpler sole on Campus.',
    size_value: 1,
    size_unit: 'pair',
    foreign_size_value: 1,
    foreign_size_unit: 'pair',
    specs: {
      shoe_type: 'running shoes',
      target_gender: 'men',
      upper_material: 'mesh with PVC print',
      sole_material: 'EVA (Pillofoam)',
      closure: 'laces',
      weight_g: null,
    },
    foreign_specs: {
      shoe_type: 'running shoes',
      target_gender: 'men',
      upper_material: 'mesh',
      sole_material: 'foam midsole, rubber outsole',
      closure: 'laces',
      weight_g: 286,
    },
    spec_sources: {
      indian: ['https://www.campusshoes.com/products/ferox-black-pacific-mens-running-shoes'],
      foreign: ['https://www.nike.com/in/t/revolution-7-road-running-shoes-dC34tK'],
    },
    points: [
      {
        tag: 'price',
        content:
          'Listed at ₹1,149 on Campus (₹2,099 MRP) versus ₹3,695 MRP for Revolution 7 on Nike India (October 2026).',
      },
      {
        tag: 'sourcing',
        content:
          'Campus lists country of origin as India (Campus Activewear Ltd, New Delhi). Revolution 7 listings on Nike India show Vietnam or Indonesia.',
      },
      {
        tag: 'other',
        content:
          'Ferox uses breathable mesh, Memory Tech Lite insole and Pillofoam. Nike publishes midsole foam, a 10 mm drop and a rubber traction pattern — more specified as a road shoe, at about 3× the listed price.',
      },
    ],
  },
  {
    brand: 'Abros',
    indian_product_name: 'Abros Interceptor-3',
    foreign_replacement_name: 'adidas Runfalcon 5',
    category: 'footwear',
    price_inr: 1499,
    foreign_price_inr: 6599,
    buy_url: 'https://abrosshoes.com/products/interceptor-3-lightweight-anti-skid-sports-shoes-for-men',
    trade_off:
      'Interceptor-3 is a lightweight knit/mesh gym and jogging shoe with an EVA sole. Runfalcon 5 is adidas’s daily trainer with a fuller retail and warranty network. You save a lot; you get less published running geometry and a simpler EVA outsole rather than adidas’s current daily-run stack.',
    size_value: 1,
    size_unit: 'pair',
    foreign_size_value: 1,
    foreign_size_unit: 'pair',
    specs: {
      shoe_type: 'running shoes',
      target_gender: 'men',
      upper_material: 'knit mesh',
      sole_material: 'EVA',
      closure: 'laces',
      weight_g: null,
    },
    foreign_specs: {
      shoe_type: 'running shoes',
      target_gender: 'unisex',
      upper_material: 'mesh',
      sole_material: 'foam midsole, rubber outsole',
      closure: 'laces',
      weight_g: null,
    },
    spec_sources: {
      indian: ['https://abrosshoes.com/products/interceptor-3-lightweight-anti-skid-sports-shoes-for-men'],
      foreign: ['https://www.adidas.co.in/runfalcon-5-running-shoes/IE8823.html'],
    },
    points: [
      {
        tag: 'price',
        content:
          'Listed at ₹1,499 on Abros (₹1,699 MRP) versus ₹6,599 MRP for Runfalcon 5 on adidas.co.in (October 2026).',
      },
      {
        tag: 'sourcing',
        content:
          'Abros lists country of origin as India (Abros Sports International, IMT Manesar, Gurugram). Runfalcon 5 is an adidas import.',
      },
      {
        tag: 'other',
        content:
          'Interceptor-3 is specified as knit mesh, EVA sole, anti-skid, for running, gym and outdoor use. Runfalcon 5 is sold as a dedicated daily running shoe with adidas cushioning — a closer match for structured road running.',
      },
    ],
  },
  {
    brand: 'Sparx',
    indian_product_name: 'Sparx Clog SFG 9008',
    foreign_replacement_name: 'Crocs Classic Clog',
    category: 'footwear',
    price_inr: 909,
    foreign_price_inr: 4495,
    buy_url: 'https://relaxofootwear.com/products/sparx-clog-for-men-sfg-9008-sf9008g-bkwh',
    trade_off:
      'SFG 9008 is a lightweight EVA clog for errands and indoor wear. It is not Croslite, has no Jibbitz holes, and does not have Crocs’ global fit system. You pay a fraction of the Classic Clog’s ₹4,495 listed price; you give up the material, customisation and brand service that come with Crocs.',
    size_value: 1,
    size_unit: 'pair',
    foreign_size_value: 1,
    foreign_size_unit: 'pair',
    specs: {
      shoe_type: 'sandals',
      target_gender: 'men',
      upper_material: 'EVA',
      sole_material: 'EVA',
      closure: 'slip-on',
      weight_g: null,
    },
    foreign_specs: {
      shoe_type: 'sandals',
      target_gender: 'unisex',
      upper_material: 'Croslite',
      sole_material: 'Croslite',
      closure: 'slip-on',
      weight_g: null,
    },
    spec_sources: {
      indian: ['https://relaxofootwear.com/products/sparx-clog-for-men-sfg-9008-sf9008g-bkwh'],
      foreign: ['https://www.crocs.in/men/our-favourites/new-arrivals.html'],
    },
    points: [
      {
        tag: 'price',
        content:
          'Listed at ₹909 (₹1,299 MRP) on Relaxo versus ₹4,495 for the Classic Clog on crocs.in (October 2026).',
      },
      {
        tag: 'sourcing',
        content:
          'Manufactured and marketed by Relaxo Footwears Limited, Delhi. Classic Clog listings on crocs.in are imported (Vietnam) by Crocs India.',
      },
      {
        tag: 'other',
        content:
          'Sparx specifies high-quality EVA and a slip-on clog shape. Crocs Classic uses Croslite, a pivoting backstrap and Jibbitz customisation — a different material system, not just a different logo.',
      },
    ],
  },
  {
    brand: 'Red Chief',
    indian_product_name: 'Red Chief Formal Derby RC3506',
    foreign_replacement_name: 'Clarks Un Aldric Step',
    category: 'footwear',
    price_inr: 1961,
    foreign_price_inr: 7499,
    buy_url: 'https://redchief.in/products/casual-shoes-for-men-rc3506-001',
    trade_off:
      'Both are leather office derbies, but the Clarks Unstructured shoe uses LWG medal-rated leather (as stated on clarks.in) and is imported. Red Chief uses genuine leather with a PU sole — cheaper and Indian-made, though PU soles typically wear faster than a leather/rubber comfort sole in wet conditions, and the leather supply-chain rating is not stated on the product page.',
    size_value: 1,
    size_unit: 'pair',
    foreign_size_value: 1,
    foreign_size_unit: 'pair',
    specs: {
      shoe_type: 'formal shoes',
      target_gender: 'men',
      upper_material: 'genuine leather',
      sole_material: 'PU',
      closure: 'laces',
      weight_g: null,
    },
    foreign_specs: {
      shoe_type: 'formal shoes',
      target_gender: 'men',
      upper_material: 'leather',
      sole_material: 'durable comfort sole',
      closure: 'laces',
      weight_g: 883,
    },
    spec_sources: {
      indian: ['https://redchief.in/products/casual-shoes-for-men-rc3506-001'],
      foreign: ['https://clarks.in/product/un-aldric-step-black-leather-5050409522059'],
    },
    points: [
      {
        tag: 'price',
        content:
          'Listed at ₹1,961 on Red Chief (₹5,649 MRP) versus ₹7,499 MRP for Un Aldric Step on clarks.in (October 2026).',
      },
      {
        tag: 'sourcing',
        content:
          'Red Chief is packed by Leayan Global, Kanpur. Clarks Un Aldric Step lists country of origin as Bangladesh, imported by Clarks Reliance Footwear, Mumbai.',
      },
      {
        tag: 'certification',
        content:
          'Clarks states the upper and lining leather is from a tannery with a Leather Working Group medal rating. The Red Chief product page does not state an equivalent leather certification.',
      },
    ],
  },
];

async function upsertBrand(row) {
  const { data: existing, error: findErr } = await admin.from('brands').select('id, name').eq('name', row.name).maybeSingle();
  if (findErr) throw new Error(`Brand lookup failed (${row.name}): ${findErr.message}`);
  if (existing) return existing.id;
  const { data, error } = await admin.from('brands').insert(row).select('id').single();
  if (error) throw new Error(`Brand insert failed (${row.name}): ${error.message}`);
  console.log(`Created brand: ${row.name}`);
  return data.id;
}

async function main() {
  const brandIds = {};
  for (const b of brands) brandIds[b.name] = await upsertBrand(b);

  let created = 0;
  let skipped = 0;

  for (const p of products) {
    const { data: dup, error: dupErr } = await admin
      .from('products')
      .select('id')
      .eq('indian_product_name', p.indian_product_name)
      .maybeSingle();
    if (dupErr) throw new Error(`Product lookup failed (${p.indian_product_name}): ${dupErr.message}`);
    if (dup) {
      console.log(`Skip (already exists): ${p.indian_product_name}`);
      skipped += 1;
      continue;
    }

    const { points, brand, ...fields } = p;
    const { data: product, error } = await admin
      .from('products')
      .insert({
        ...fields,
        brand_id: brandIds[brand],
        verification_status: 'verified_by_team',
        specs_checked_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) throw new Error(`Product insert failed (${p.indian_product_name}): ${error.message}`);

    const { error: pointErr } = await admin.from('comparison_points').insert(
      points.map((pt) => ({ product_id: product.id, tag: pt.tag, content: pt.content }))
    );
    if (pointErr) throw new Error(`Points insert failed (${p.indian_product_name}): ${pointErr.message}`);

    console.log(`Added: ${p.indian_product_name} vs ${p.foreign_replacement_name}`);
    created += 1;
  }

  console.log(`Done. created=${created} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
