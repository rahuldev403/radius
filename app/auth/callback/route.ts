import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      await supabase.auth.exchangeCodeForSession(code);
      // Redirect to success page after verification
      return NextResponse.redirect(
        new URL("/auth/verify-success", requestUrl.origin)
      );
    } catch (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(
        new URL("/auth/verify-error", requestUrl.origin)
      );
    }
  }

  // If no code, redirect to error page
  return NextResponse.redirect(
    new URL("/auth/verify-error", requestUrl.origin)
  );
}
