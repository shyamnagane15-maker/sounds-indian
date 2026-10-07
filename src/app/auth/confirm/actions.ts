'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabaseServer';

export async function confirmLogin(formData: FormData) {
  const tokenHash = String(formData.get('token_hash') ?? '');
  if (!tokenHash) redirect('/brand/login?error=expired');

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: 'email', token_hash: tokenHash });

  if (error) {
    console.error('Login link could not be verified:', error.message);
    redirect('/brand/login?error=expired');
  }

  redirect('/brand/dashboard');
}