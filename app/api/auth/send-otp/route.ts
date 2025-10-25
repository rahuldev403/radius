import { NextRequest, NextResponse } from "next/server";
import { generateOTP, storeOTP } from "@/lib/otp";
import { sendEmail, otpEmailTemplate } from "@/lib/email-smtp";

export async function POST(request: NextRequest) {
  try {
    const { email, userName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in database
    const storeResult = await storeOTP(email, otp);

    if (!storeResult.success) {
      return NextResponse.json(
        { error: storeResult.error || "Failed to generate OTP" },
        { status: 500 }
      );
    }

    // Send OTP email
    const emailResult = await sendEmail({
      to: email,
      subject: "Your Verification Code - Radius",
      html: otpEmailTemplate(otp, userName || "User"),
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send OTP email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      messageId: emailResult.messageId,
    });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
