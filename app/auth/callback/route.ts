import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Force Node.js runtime and disable caching so cookies can be set on Vercel
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Handle cookie setting errors silently
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          } catch (error) {
            // Handle cookie removal errors silently
          }
        },
      },
    });

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

        // Check if profile exists, if not create one
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!existingProfile) {
          console.log("Creating profile for Google OAuth user...");
          // Create profile for Google OAuth user using service role
          const { createClient: createSupabaseClient } = await import(
            "@supabase/supabase-js"
          );
          const supabaseAdmin = createSupabaseClient(
            supabaseUrl,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          const { error: createProfileError } = await supabaseAdmin
            .from("profiles")
            .upsert(
              {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || null,
                avatar_url: session.user.user_metadata?.avatar_url || null,
                bio: null,
                location: null,
              },
              {
                onConflict: "id",
              }
            );

          if (createProfileError) {
            console.error("Error creating profile:", createProfileError);
            // Don't fail, let user continue to account setup
          }
        }

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

        const redirectUrl = isProfileComplete
          ? "/dashboard"
          : "/account?onboarding=true";
        return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
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
