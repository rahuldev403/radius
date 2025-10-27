import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "v2.0",
    timestamp: new Date().toISOString(),
    deployedCode: "verify-otp-detailed-logging",
    serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
