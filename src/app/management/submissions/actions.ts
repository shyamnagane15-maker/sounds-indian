'use server';

import { revalidatePath } from 'next/cache';
import { admin } from '../../lib/supabaseAdmin';

type SubmittedProduct = {
  indian_product_name: string;
  foreign_replacement_name: string;
  buy_url: string;
  category?: string;
};

async function revertToPending(id: string) {
  await admin.from('brand_submissions').update({ status: 'pending' }).eq('id', id);
}

export async function approveSubmission(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  // Claim the submission first. If it's already approved or rejected (for example
  // after a double click), nothing comes back and we stop, so no duplicate brands.
  const { data: sub, error: claimError } = await admin
    .from('brand_submissions')
    .update({ status: 'approved' })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single();
  if (claimError || !sub) return;

  // 1. Create the brand
  const { data: brand, error: brandError } = await admin
    .from('brands')
    .insert({
      name: sub.brand_name,
      location: sub.location,
      founding_story: sub.founding_story,
      logo_url: sub.logo_url,
      cin: sub.cin,
      website: sub.website,
    })
    .select('id')
    .single();

  if (brandError || !brand) {
    await revertToPending(id);
    throw new Error(`Could not create brand: ${brandError?.message ?? 'unknown error'}`);
  }

  // 2. Create the products. They start as self_reported, so nothing goes
  // public until you fill in the details and verify them.
  const rows = (sub.products as SubmittedProduct[]).map((p) => ({
    brand_id: brand.id,
    indian_product_name: p.indian_product_name,
    foreign_replacement_name: p.foreign_replacement_name,
    buy_url: p.buy_url,
    category: p.category ?? null,
    verification_status: 'self_reported',
    
  }));

  const { error: productsError } = await admin.from('products').insert(rows);
  if (productsError) {
    // Undo the brand so a retry starts clean
    await admin.from('brands').delete().eq('id', brand.id);
    await revertToPending(id);
    throw new Error(`Could not create products: ${productsError.message}`);
  }

  revalidatePath('/management/submissions');
  revalidatePath('/management');
}

export async function rejectSubmission(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const { error } = await admin
    .from('brand_submissions')
    .update({ status: 'rejected' })
    .eq('id', id)
    .eq('status', 'pending');
  if (error) throw new Error(error.message);

  revalidatePath('/management/submissions');
}