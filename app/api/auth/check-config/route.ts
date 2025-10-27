import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Get auth config via Management API
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/config`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    const config = await response.json();

    return NextResponse.json({
      config,
      message:
        "Check if 'MAILER_AUTOCONFIRM' is set to true or if email confirmation is disabled",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
