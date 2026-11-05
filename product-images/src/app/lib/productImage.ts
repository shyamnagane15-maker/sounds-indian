// Saving and removing product photos. SERVER ONLY (uses the service-role client).
//
// Every upload is re-encoded with sharp before it is stored. That:
//   - proves the file really is an image (a renamed .exe or .html is rejected),
//   - removes hidden camera and location (GPS) data from the photo,
//   - fixes phone-photo rotation, and shrinks the file (typically 50 to 150 KB).
// Files get a random name, so each upload has its own URL and can be cached for a year.

import sharp from 'sharp';
import { admin } from './supabaseAdmin';

const BUCKET = 'product-images';
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB upload limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type SavedImage = { ok: true; url: string; path: string } | { ok: false; error: string };

export async function saveProductImage(productId: string, file: unknown): Promise<SavedImage> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Choose an image file first.' };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: 'The image must be 2 MB or smaller.' };
  if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, error: 'Use a JPG, PNG or WebP image.' };

  let output: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    output = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { ok: false, error: 'That file could not be read as an image.' };
  }

  const path = `${productId}/${crypto.randomUUID()}.webp`;
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, output, { contentType: 'image/webp', cacheControl: '31536000' });
  if (error) {
    console.error('Product image upload failed:', error);
    return { ok: false, error: 'Could not upload the image. Please try again.' };
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}

// Deletes the stored files of a product. Pass keepPath to keep the newest one.
export async function removeProductImageFiles(productId: string, keepPath?: string) {
  const { data: files, error } = await admin.storage.from(BUCKET).list(productId);
  if (error || !files) return;
  const paths = files.map((f) => `${productId}/${f.name}`).filter((p) => p !== keepPath);
  if (paths.length > 0) await admin.storage.from(BUCKET).remove(paths);
}

// Deletes a single stored file (used to undo an upload when saving the product fails)
export async function removeProductImageFile(path: string) {
  await admin.storage.from(BUCKET).remove([path]);
}
