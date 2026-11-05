#!/usr/bin/env node
/**
 * Import product-content/ media into the site.
 *
 *   node scripts/import-product-content.mjs                 # dry run: match files, change nothing
 *   node scripts/import-product-content.mjs --apply         # convert, upload, set image URLs
 *   node scripts/import-product-content.mjs --apply --side competitors
 *
 * Folder layout and what each file updates:
 *   product-content/categories/<category>/partners/<file>    -> Indian product   products.image_url
 *   product-content/categories/<category>/competitors/<file>  -> foreign product  products.foreign_image_url
 *
 * Images (.avif .jpg .jpeg .png .webp) are converted to WebP (max 1200px, quality 82,
 * EXIF stripped) exactly like the site's upload form. Videos (.webm .mp4 ...) are skipped
 * for now and reported, so nothing is silently ignored.
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in .env.local for uploads: the public bucket has no
 * write policies, service role is the only writer. Dry runs work with just the anon key.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'product-content', 'categories');
const BUCKET = 'product-images';
const IMAGE_EXTS = new Set(['.avif', '.webp', '.jpg', '.jpeg', '.png']);
const VIDEO_EXTS = new Set(['.webm', '.mp4', '.mov', '.mkv']);
const SIDES = {
  partners: { column: 'image_url', label: 'Indian product' },
  competitors: { column: 'foreign_image_url', label: 'foreign product' },
};
const MATCH_THRESHOLD = 0.6; // fraction of the product name's words the filename must contain

/* ---------------- CLI ---------------- */
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const sideFlag = args.indexOf('--side');
const ONLY_SIDE = sideFlag !== -1 ? args[sideFlag + 1] : null;
if (ONLY_SIDE && !SIDES[ONLY_SIDE]) {
  console.error(`--side must be "partners" or "competitors" (got "${ONLY_SIDE}").`);
  process.exit(1);
}

/* ---------------- environment ---------------- */
function loadEnv() {
  const p = path.join(ROOT, '.env.local');
  if (!fs.existsSync(p)) {
    console.error('No .env.local found next to package.json.');
    process.exit(1);
  }
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
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (!BASE || !ANON_KEY) {
  console.error('.env.local must define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

async function rest(key, pathname, options = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res;
}

async function keyWorks(key) {
  if (!key) return false;
  try {
    const res = await rest(key, '/rest/v1/products?select=id&limit=1');
    return res.ok;
  } catch {
    return false;
  }
}

/* ---------------- matching ---------------- */
const norm = (s) =>
  String(s).toLowerCase().replace(/['\u2019\u2018]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const tokens = (s) =>
  new Set(norm(s).split(' ').filter((t) => t.length >= 2 && !/^\d+$/.test(t)));

// How much of the product name appears in the file name (0..1).
function matchScore(fileName, productName) {
  const file = tokens(fileName.replace(/[_\-.]+/g, ' '));
  const name = tokens(productName);
  if (name.size === 0) return 0;
  let hit = 0;
  for (const t of name) if (file.has(t)) hit++;
  return hit / name.size;
}

function findProduct(products, fileName, category) {
  const pool = products.filter((p) => p.category === category);
  const scored = pool
    .map((p) => ({
      p,
      score: Math.max(
        matchScore(fileName, p.indian_product_name),
        matchScore(fileName, p.foreign_replacement_name)
      ),
    }))
    .sort((a, b) => b.score - a.score);
  const [best, second] = scored;
  if (!best || best.score < MATCH_THRESHOLD) return { kind: 'none', score: best?.score ?? 0 };
  if (second && second.score >= MATCH_THRESHOLD && second.score >= best.score) {
    return { kind: 'ambiguous', options: [best.p, second.p], score: best.score };
  }
  return { kind: 'match', product: best.p, score: best.score };
}

/* ---------------- file walking ---------------- */
function walkMedia() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`No content folder at ${CONTENT_DIR}`);
    process.exit(1);
  }
  const jobs = [];
  for (const catDir of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (!catDir.isDirectory()) continue;
    for (const side of Object.keys(SIDES)) {
      if (ONLY_SIDE && side !== ONLY_SIDE) continue;
      const sideDir = path.join(CONTENT_DIR, catDir.name, side);
      if (!fs.existsSync(sideDir)) continue;
      for (const entry of fs.readdirSync(sideDir, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        jobs.push({ category: catDir.name, side, name: entry.name, file: path.join(sideDir, entry.name) });
      }
    }
  }
  return jobs;
}

/* ---------------- upload ---------------- */
async function convertToWebp(file) {
  return sharp(file, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

async function importOne(job, product, column) {
  const folder = job.side === 'partners' ? product.id : `foreign/${product.id}`;
  const filePath = `${folder}/${crypto.randomUUID()}.webp`;
  const buffer = await convertToWebp(job.file);

  const up = await rest(SERVICE_KEY, `/storage/v1/object/${BUCKET}/${filePath}`, {
    method: 'POST',
    body: buffer,
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': '31536000' },
  });
  if (!up.ok) throw new Error(`storage upload ${up.status}: ${(await up.text()).slice(0, 200)}`);

  const { data } = (await (async () => {
    const r = await rest(SERVICE_KEY, `/storage/v1/object/public/${BUCKET}/${filePath}`);
    return { data: r.ok ? `${BASE}/storage/v1/object/public/${BUCKET}/${filePath}` : null };
  })());
  const publicUrl = data;
  if (!publicUrl) throw new Error('could not build the public URL');

  const patch = await rest(SERVICE_KEY, `/rest/v1/products?id=eq.${product.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ [column]: publicUrl }),
    headers: { Prefer: 'return=minimal' },
  });
  if (!patch.ok) {
    // Roll back the file so a failed run leaves nothing half-set
    await rest(SERVICE_KEY, `/storage/v1/object/${BUCKET}/${filePath}`, { method: 'DELETE' });
    throw new Error(`database update ${patch.status}: ${(await patch.text()).slice(0, 200)}`);
  }

  // Success: clear older images of this same side so only the live one remains
  const list = await rest(SERVICE_KEY, `/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    body: JSON.stringify({ prefix: folder, limit: 100, offsets: [] }),
  });
  if (list.ok) {
    const entries = await list.json();
    const stale = (entries || [])
      .filter((e) => e && e.name && e.id !== null && `${folder}/${e.name}` !== filePath)
      .map((e) => `${folder}/${e.name}`);
    if (stale.length > 0) {
      await rest(SERVICE_KEY, `/storage/v1/object/${BUCKET}`, {
        method: 'DELETE',
        body: JSON.stringify({ prefixes: stale }),
      });
    }
  }
  return publicUrl;
}

/* ---------------- main ---------------- */
async function main() {
  const jobs = walkMedia();
  if (jobs.length === 0) {
    console.log('No media files found under product-content/categories.');
    return;
  }

  const serviceOk = await keyWorks(SERVICE_KEY);
  const readKey = serviceOk ? SERVICE_KEY : ANON_KEY;
  if (!serviceOk) {
    console.log(
      'NOTE: SUPABASE_SERVICE_ROLE_KEY is not accepted by this project ' +
        '(401/JWT error). Falling back to the anon key for reading.' +
        (APPLY ? ' Uploads cannot work until .env.local is fixed.' : '')
    );
    if (APPLY) {
      console.error('Fix SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase Dashboard > Project Settings > API Keys), then re-run with --apply.');
      process.exit(1);
    }
  }

  const body = await (await rest(readKey, '/rest/v1/products?select=*')).json();
  if (!Array.isArray(body)) {
    console.error('Could not read products:', body?.message || body?.error || JSON.stringify(body));
    process.exit(1);
  }
  const products = body;

  // Does foreign_image_url exist yet? (probe reads only, works with anon too)
  const colProbe = await rest(readKey, '/rest/v1/products?select=foreign_image_url&limit=1');
  let foreignColumnReady = colProbe.ok;
  if (!foreignColumnReady && readKey !== ANON_KEY) {
    const anonProbe = await rest(ANON_KEY, '/rest/v1/products?select=foreign_image_url&limit=1');
    foreignColumnReady = anonProbe.ok;
  }
  if (!foreignColumnReady) {
    console.log('NOTE: products.foreign_image_url does not exist yet - run product-images/foreign-images.sql first.');
  }

  let ok = 0, skippedVideos = 0, unmatched = 0, failed = 0;

  for (const job of jobs) {
    const ext = path.extname(job.name).toLowerCase();
    const base = path.basename(job.name, ext);
    const tag = `${job.side}/${job.category}/${job.name}`;

    if (VIDEO_EXTS.has(ext)) { skippedVideos++; console.log(`SKIP video  ${tag}  (videos are a later step)`); continue; }
    if (!IMAGE_EXTS.has(ext)) { skippedVideos++; console.log(`SKIP other  ${tag}  (not a supported image type)`); continue; }

    const found = findProduct(products, base, job.category);
    if (found.kind === 'none') { unmatched++; console.log(`NO MATCH    ${tag}  (best score only ${Math.round(found.score * 100)}%)`); continue; }
    if (found.kind === 'ambiguous') { unmatched++; console.log(`AMBIGUOUS   ${tag}  -> ${found.options.map((p) => p.indian_product_name).join(' | ')}`); continue; }

    const column = SIDES[job.side].column;
    const target = job.side === 'partners' ? found.product.indian_product_name : found.product.foreign_replacement_name;
    const where = `${target} [${found.product.category}]`;

    if (!APPLY) {
      const blocked = job.side === 'competitors' && !foreignColumnReady;
      console.log(`DRY RUN     ${tag}  -> ${where}  (score ${Math.round(found.score * 100)}%): ${blocked ? 'BLOCKED until foreign-images.sql runs' : 'would set ' + column}`);
      continue;
    }

    if (job.side === 'competitors' && !foreignColumnReady) {
      failed++;
      console.log(`FAIL        ${tag}  -> products.foreign_image_url column is missing (run product-images/foreign-images.sql)`);
      continue;
    }

    try {
      const url = await importOne(job, found.product, column);
      ok++;
      console.log(`IMPORTED    ${tag}  -> ${where}  (${Math.round(found.score * 100)}%)`);
      console.log(`            ${url}`);
    } catch (e) {
      failed++;
      console.log(`FAIL        ${tag}  -> ${e.message}`);
    }
  }

  console.log('');
  const wouldImport = jobs.length - skippedVideos - unmatched;
  console.log(`${APPLY ? 'Imported' : 'Would import'}: ${APPLY ? ok : wouldImport} | videos skipped: ${skippedVideos} | unmatched: ${unmatched}${APPLY ? ` | failed: ${failed}` : ''}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
