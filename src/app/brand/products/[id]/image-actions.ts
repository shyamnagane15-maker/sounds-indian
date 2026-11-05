'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabaseServer';
import {
  removeProductImageFile,
  removeProductImageFiles,
  saveProductImage,
} from '../../../lib/productImage';

async function getOwnedProduct(id: string) {
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

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .eq('brand_id', brand.id)
    .maybeSingle();
  if (!product) redirect('/brand/dashboard');

  return { supabase, brandId: brand.id };
}

export async function uploadBrandProductImage(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  function back(message: string): never {
    redirect(`/brand/products/${id}?error=${encodeURIComponent(message)}`);
  }
  if (!id) redirect('/brand/dashboard');

  const { supabase, brandId } = await getOwnedProduct(id);
  const saved = await saveProductImage(id, formData.get('image'));
  if (!saved.ok) back(saved.error);

  const { error } = await supabase
    .from('products')
    .update({ image_url: saved.url })
    .eq('id', id)
    .eq('brand_id', brandId);
  if (error) {
    await removeProductImageFile(saved.path);
    back(`Could not save the image: ${error.message}`);
  }

  await removeProductImageFiles(id, saved.path);
  redirect('/brand/dashboard?saved=1');
}

export async function removeBrandProductImage(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  if (!id) redirect('/brand/dashboard');

  const { supabase, brandId } = await getOwnedProduct(id);
  const { error } = await supabase
    .from('products')
    .update({ image_url: null })
    .eq('id', id)
    .eq('brand_id', brandId);
  if (error) redirect(`/brand/products/${id}?error=${encodeURIComponent(error.message)}`);

  await removeProductImageFiles(id);
  redirect('/brand/dashboard?saved=1');
}
