#!/usr/bin/env node
/**
 * Export every product (Indian + foreign side) to products.csv and optionally
 * download the images.
 *
 *   node scripts/export-products.mjs                 # CSV only
 *   node scripts/export-products.mjs --download      # CSV + images (original format, usually .webp)
 *   node scripts/export-products.mjs --download --jpg  # convert to JPG (Instagram/WhatsApp-friendly)
 *
 * Images land in export/images/<category>/<indian|foreign>/<brand>-<product>.<ext>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'export');
const args = process.argv.slice(2);
const DOWNLOAD = args.includes('--download');
const AS_JPG = args.includes('--jpg');

/* ---------- env (same approach as import-product-content.mjs) ---------- */
function loadEnv() {
  const p = path.join(ROOT, '.env.local');
  if (!fs.existsSync(p)) { console.error('No .env.local found next to package.json.'); process.exit(1); }
  const out = {};
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line.includes('=') || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}
const env = loadEnv();
const BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!BASE || !KEY) { console.error('Missing Supabase URL or key in .env.local'); process.exit(1); }

/* ---------- fetch all products (with brand name), 1000 rows per page ---------- */
async function fetchProducts() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${BASE}/rest/v1/products?select=*,brands(name)&order=category,indian_product_name`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + 999}` },
    });
    const body = await res.json();
    if (!Array.isArray(body)) {
      console.error('Could not read products:', body?.message || JSON.stringify(body));
      process.exit(1);
    }
    rows.push(...body);
    if (body.length < 1000) break;
  }
  return rows;
}

const slug = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const products = await fetchProducts();
console.log(`Found ${products.length} products.`);

const list = products.map((p) => ({
  id: p.id,
  category: p.category,
  brand: p.brands?.name ?? '',
  indianName: p.indian_product_name,
  foreignName: p.foreign_replacement_name,
  price: p.price_inr,
  size: p.size_value ? `${p.size_value} ${p.size_unit ?? ''}`.trim() : '',
  buyUrl: p.buy_url,
  indianImage: p.image_url,
  foreignImage: p.foreign_image_url,
}));

fs.mkdirSync(OUT, { recursive: true });
const header = ['id', 'category', 'brand', 'indian_product', 'foreign_product', 'price_inr', 'size', 'buy_url', 'indian_image_url', 'foreign_image_url'];
fs.writeFileSync(
  path.join(OUT, 'products.csv'),
  '\uFEFF' + [header.join(','), ...list.map((p) => [p.id, p.category, p.brand, p.indianName, p.foreignName, p.price, p.size, p.buyUrl, p.indianImage, p.foreignImage].map(csv).join(','))].join('\n'),
);
console.log('Wrote export/products.csv');

/* ---------- optional image download ---------- */
if (DOWNLOAD) {
  let sharp = null;
  if (AS_JPG) sharp = (await import('sharp')).default;

  let saved = 0, missing = 0, failed = 0;
  for (const p of list) {
    for (const [side, url, name] of [
      ['indian', p.indianImage, p.indianName],
      ['foreign', p.foreignImage, p.foreignName],
    ]) {
      if (!url) { missing++; continue; }
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let buf = Buffer.from(await res.arrayBuffer());
        let ext = path.extname(new URL(url).pathname) || '.webp';
        if (sharp) {
          buf = await sharp(buf).flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer();
          ext = '.jpg';
        }
        const dir = path.join(OUT, 'images', p.category ?? 'misc', side);
        fs.mkdirSync(dir, { recursive: true });
        const base = side === 'indian' ? `${slug(p.brand)}-${slug(name)}` : slug(name);
        fs.writeFileSync(path.join(dir, `${base}${ext}`), buf);
        saved++;
        console.log('Saved ', side, name);
      } catch (e) {
        failed++;
        console.log('Failed', side, name, String(e));
      }
    }
  }
  console.log(`\nImages saved: ${saved} | no image set: ${missing} | failed: ${failed}`);
}