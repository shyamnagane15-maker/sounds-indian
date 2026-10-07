import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// A Supabase client that acts as the logged-in brand user (cookie session).
// Row-level security applies to it, so it can only touch what that user owns.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components can't set cookies. That's fine, because
            // proxy.ts refreshes the session on every request.
          }
        },
      },
    }
  );
}