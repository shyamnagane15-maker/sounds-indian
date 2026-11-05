'use server';

import { redirect } from 'next/navigation';
import { admin } from '../../../lib/supabaseAdmin';
import { removeProductImageFile, removeProductImageFiles, saveProductImage } from '../../../lib/productImage';

// Admin: upload, replace or remove a product's photo. /management is behind the admin login.

export async function uploadProductImage(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  function back(message: string): never {
    redirect(`/management/products/${id}?error=${encodeURIComponent(message)}`);
  }

  if (!id) redirect('/management');
  const { data: product } = await admin.from('products').select('id').eq('id', id).maybeSingle();
  if (!product) redirect('/management');

  const saved = await saveProductImage(id, formData.get('image'));
  if (!saved.ok) back(saved.error);

  const { error } = await admin.from('products').update({ image_url: saved.url }).eq('id', id);
  if (error) {
    await removeProductImageFile(saved.path); // undo the upload; the old photo stays
    back(`Could not save the image: ${error.message}`);
  }

  await removeProductImageFiles(id, saved.path); // keep only the newest file
  redirect(`/management/products/${id}?saved=1`);
}

export async function removeProductImage(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  if (!id) redirect('/management');

  const { error } = await admin.from('products').update({ image_url: null }).eq('id', id);
  if (error) redirect(`/management/products/${id}?error=${encodeURIComponent(error.message)}`);

  await removeProductImageFiles(id);
  redirect(`/management/products/${id}?saved=1`);
}
