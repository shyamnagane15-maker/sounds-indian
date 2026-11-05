'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabaseServer';

export async function confirmLogin(formData: FormData) {
  const tokenHash = String(formData.get('token_hash') ?? '').trim();
  if (!tokenHash) redirect('/brand/login?error=expired');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  });
  if (error || !data.user) redirect('/brand/login?error=expired');

  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id')
    .eq('owner_id', data.user.id)
    .maybeSingle();
  if (brandError) throw new Error(`Could not verify brand account: ${brandError.message}`);
  if (!brand) {
    await supabase.auth.signOut();
    redirect('/brand/login?error=expired');
  }

  redirect('/brand/dashboard');
}