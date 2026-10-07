import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Admin area (/management): HTTP basic auth.
// Next.js allows only ONE proxy file, so the brand-area check lives here too.
function checkAdmin(request: NextRequest): NextResponse | null {
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;

  if (!adminUser || !adminPass) {
    // No credentials set: fine on your own computer, refused when deployed
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('The admin area is not configured.', { status: 503 });
    }
    return null;
  }

  const header = request.headers.get('authorization');
  if (header?.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const colon = decoded.indexOf(':');
      if (
        colon !== -1 &&
        decoded.slice(0, colon) === adminUser &&
        decoded.slice(colon + 1) === adminPass
      ) {
        return null; // allowed
      }
    } catch {
      // malformed header: fall through to the login prompt
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
  });
}

// Brand area (/brand): keep the login session fresh, and send
// logged-out visitors to the login page.
async function checkBrand(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === '/brand/login';

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/brand/login', request.url), 303);
  }
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/brand/dashboard', request.url), 303);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/management')) {
    return checkAdmin(request) ?? NextResponse.next();
  }
  if (pathname.startsWith('/brand')) {
    return checkBrand(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/management/:path*', '/brand/:path*'],
};