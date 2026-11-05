import sharp from 'sharp';
import { admin } from './supabaseAdmin';

const BUCKET = 'product-images';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type SavedImage = { ok: true; url: string; path: string } | { ok: false; error: string };

export async function saveProductImage(productId: string, file: unknown): Promise<SavedImage> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose an image file first.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'The image must be 2 MB or smaller.' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: 'Use a JPG, PNG or WebP image.' };
  }

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

export async function removeProductImageFiles(productId: string, keepPath?: string) {
  const { data: files, error } = await admin.storage.from(BUCKET).list(productId);
  if (error) {
    console.error('Product image cleanup failed:', error);
    throw new Error('Could not clean up old product images.', { cause: error });
  }
  if (!files) return;

  const paths = files.map((file) => `${productId}/${file.name}`).filter((path) => path !== keepPath);
  if (paths.length === 0) return;

  const { error: removeError } = await admin.storage.from(BUCKET).remove(paths);
  if (removeError) {
    console.error('Product image cleanup failed:', removeError);
    throw new Error('Could not clean up old product images.', { cause: removeError });
  }
}

export async function removeProductImageFile(path: string) {
  const { error } = await admin.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error('Product image rollback failed:', error);
    throw new Error('Could not remove the failed product image upload.', { cause: error });
  }
}
