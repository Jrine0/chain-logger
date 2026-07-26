import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const { supabase } = await createClient(request);

  await supabase.auth.getSession();

  return NextResponse.next({
    request,
  });
}

export async function createClient(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, response };
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.next();
  }

  const { supabase } = await createClient(request);

  await supabase.auth.getSession();

  const authRoutes = ["/login", "/register"];
  const appRoutes = ["/dashboard", "/finance", "/vendor", "/org"];
  const publicRoutes = ["/", "/verify"];

  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const isAppRoute = appRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname === route);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (isAuthRoute) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isAppRoute) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const redirectTo = encodeURIComponent(request.nextUrl.pathname);
      return NextResponse.redirect(new URL(`/login?redirectTo=${redirectTo}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
