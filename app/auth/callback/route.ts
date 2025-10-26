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

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.exchangeCodeForSession(code);

      if (sessionError) {
        console.error("❌ Error exchanging code for session:", sessionError);
        console.error(
          "Session error details:",
          JSON.stringify(sessionError, null, 2)
        );
        return NextResponse.redirect(
          new URL(
            `/?error=session_failed&message=${encodeURIComponent(
              sessionError.message
            )}`,
            requestUrl.origin
          )
        );
      }

      console.log("✓ Session created successfully!");
      console.log("User email:", session?.user?.email);
      console.log("User ID:", session?.user?.id);

      if (session?.user) {
        console.log("✓ Google OAuth successful! User:", session.user.email);

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, location")
          .eq("id", session.user.id)
          .single();

        const isProfileComplete =
          profile && profile.full_name && profile.location;

        console.log(
          "→ Redirecting to",
          isProfileComplete ? "/dashboard" : "/account?onboarding=true"
        );

        if (isProfileComplete) {
          return NextResponse.redirect(
            new URL("/dashboard", requestUrl.origin)
          );
        } else {
          return NextResponse.redirect(
            new URL("/account?onboarding=true", requestUrl.origin)
          );
        }
      }

      console.log("⚠ No user in session");

      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    } catch (error: any) {
      console.error("❌ Error in OAuth callback:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return NextResponse.redirect(
        new URL(
          `/?error=callback_failed&message=${encodeURIComponent(
            error.message || "Unknown error"
          )}`,
          requestUrl.origin
        )
      );
    }
  }

  console.log("⚠ No code provided, redirecting to home");

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
