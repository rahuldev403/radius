/**
 * OTP Service
 * Handles OTP generation, storage, and verification
 */

import { createClient } from "@supabase/supabase-js";

// Use a server-side client with service role if available to bypass RLS for OTP table
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  // Generate a random 6-digit number
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP in database with expiration
 */
export async function storeOTP(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || "10");
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  try {
    // Delete any existing OTPs for this email
    await supabaseServer.from("email_otps").delete().eq("email", email);

    // Insert new OTP
    const { error } = await supabaseServer.from("email_otps").insert({
      email,
      otp,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing OTP:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Exception storing OTP:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(
  email: string,
  otp: string
): Promise<{
  success: boolean;
  error?: string;
  expired?: boolean;
}> {
  try {
    // Get OTP from database
    const { data, error } = await supabaseServer
      .from("email_otps")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .single();

    if (error || !data) {
      return { success: false, error: "Invalid OTP code" };
    }

    // Check if OTP has expired
    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (now > expiresAt) {
      // Delete expired OTP
      await supabaseServer.from("email_otps").delete().eq("email", email);
      return { success: false, error: "OTP has expired", expired: true };
    }

    // Delete used OTP
    await supabaseServer.from("email_otps").delete().eq("email", email);

    return { success: true };
  } catch (error: any) {
    console.error("Exception verifying OTP:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Resend OTP (generates new OTP and sends email)
 */
export async function resendOTP(
  email: string
): Promise<{ success: boolean; otp?: string; error?: string }> {
  // Generate new OTP
  const otp = generateOTP();

  // Store OTP
  const storeResult = await storeOTP(email, otp);

  if (!storeResult.success) {
    return { success: false, error: storeResult.error };
  }

  return { success: true, otp };
}
