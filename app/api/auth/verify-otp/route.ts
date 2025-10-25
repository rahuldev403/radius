import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, otp, password } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const verifyResult = await verifyOTP(email, otp);

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          error: verifyResult.error || "Invalid OTP",
          expired: verifyResult.expired,
        },
        { status: 400 }
      );
    }

    // OTP verified successfully
    // Now complete the user signup by creating auth user
    if (password) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
          data: {
            email_verified: true, // Mark as verified since OTP passed
          },
        },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Auto sign in after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return NextResponse.json(
          { error: signInError.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Email verified and account created successfully",
        user: data.user,
      });
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
