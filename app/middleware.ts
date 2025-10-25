import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * This middleware function runs for every request.
 * Its job is to refresh the user's auth session cookie.
 * This ensures the user stays logged in.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });

  // Refresh the session. This will update the 'supabase-auth-token' cookie
  // if it's expired or about to expire.
  await supabase.auth.getSession();

  return res;
}

// This configures the middleware to run on all paths
// except for internal Next.js paths and static files.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
