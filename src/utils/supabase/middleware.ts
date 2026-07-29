import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes: the marketing page, the login/register/forgot-password
  // funnel, and payment/onboarding — the two steps right after registration.
  // Those last two stay public rather than auth-gated because signUp() may
  // not establish a session immediately (e.g. if email confirmation is
  // required on the Supabase project); gating them risks bouncing a brand
  // new user straight back to /login mid-signup. Everything else is the
  // real app and requires a session — a denylist instead of the previous
  // allowlist, which was already missing most routes (/sales, /facility,
  // /approvals, /client, /department, /users, /settings, ...).
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/pricing', '/payment', '/onboarding', '/book-demo', '/contact'];
  const isPublicRoute = publicRoutes.includes(pathname);

  const isAuthRoute = pathname === '/login' || pathname === '/register';
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // API routes return their own JSON error responses (see src/app/api/invite/route.ts)
  // rather than an HTML redirect, which doesn't make sense for a fetch() caller.
  const isApiRoute = pathname.startsWith('/api/');

  if (!isPublicRoute && !isApiRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}
