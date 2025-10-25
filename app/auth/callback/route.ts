import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  console.log("=== OAuth Callback Debug ===");
  console.log("Full URL:", requestUrl.toString());
  console.log("Code:", code ? "✓ present" : "✗ missing");
  console.log("Error:", error || "none");
  console.log("Error Description:", error_description || "none");

  // Handle OAuth errors from Google
  if (error) {
    console.error("❌ OAuth error from Google:", error, error_description);
    return NextResponse.redirect(
      new URL(`/?error=${error}`, requestUrl.origin)
    );
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      console.log("Exchanging code for session...");
      
      // Exchange code for session
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

      if (sessionError) {
        console.error("❌ Error exchanging code for session:", sessionError);
        console.error("Session error details:", JSON.stringify(sessionError, null, 2));
        return NextResponse.redirect(
          new URL(`/?error=session_failed`, requestUrl.origin)
        );
      }

      console.log("✓ Session created successfully!");
      console.log("User email:", session?.user?.email);
      console.log("User ID:", session?.user?.id);

      if (session?.user) {
        console.log("✓ Google OAuth successful! User:", session.user.email);
        console.log("→ Redirecting to /home");
        
        // Google OAuth successful - redirect to home page
        // User is already authenticated and email verified by Google
        return NextResponse.redirect(new URL("/home", requestUrl.origin));
      }

      console.log("⚠ No user in session");
      // If no user, redirect to home and let the app handle it
      return NextResponse.redirect(new URL("/home", requestUrl.origin));
    } catch (error: any) {
      console.error("❌ Error in OAuth callback:", error);
      console.error("Error stack:", error.stack);
      return NextResponse.redirect(
        new URL(`/?error=callback_failed`, requestUrl.origin)
      );
    }
  }

  console.log("⚠ No code provided, redirecting to home");
  // If no code, redirect to home
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}

