import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client with service role key to bypass email confirmation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    console.log("🔵 Signup API called");

    const { email, password } = await request.json();

    console.log("📧 Email:", email);
    console.log("🔑 Password provided:", !!password);
    console.log(
      "🔐 Service Role Key available:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("🚀 Attempting to create user...");

    // Create user WITHOUT email_confirm to see if that's the issue
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: email.split("@")[0],
        email_verified: true,
      },
    });

    if (error) {
      console.error("❌ Signup error:", error);
      console.error("Error message:", error.message);
      console.error("Error status:", error.status);
      console.error("Error code:", error.code);
      console.error("Full error object:", JSON.stringify(error, null, 2));

      // Check for duplicate user
      if (
        error.message?.includes("already") ||
        error.message?.includes("exists")
      ) {
        console.log("⚠️ User already exists");
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please sign in instead.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Failed to create account" },
        { status: 400 }
      );
    }

    console.log("✅ User created successfully:", data.user?.id);

    // Create profile row for the new user
    if (data.user) {
      console.log("📝 Creating profile for user:", data.user.id);

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: email.split("@")[0],
          credits: 100,
        });

      if (profileError) {
        console.error("⚠️ Profile creation failed:", profileError);
        // Don't fail the signup if profile creation fails
        // The profile can be created later in the onboarding flow
      } else {
        console.log("✅ Profile created successfully");
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (err: any) {
    console.error("❌ Signup exception:", err);
    return NextResponse.json(
      { error: err.message || "An error occurred during signup" },
      { status: 500 }
    );
  }
}
