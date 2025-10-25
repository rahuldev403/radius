import { NextRequest, NextResponse } from "next/server";
import { sendEmail, emailTemplates } from "@/lib/email";
import { supabase } from "@/lib/supabase";

// API route to send booking confirmation emails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Fetch booking details
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        start_time,
        end_time,
        service:services (title),
        seeker:profiles!bookings_seeker_id_fkey (full_name, email),
        provider:profiles!bookings_provider_id_fkey (full_name, email)
      `
      )
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Normalize the data (Supabase may return arrays for foreign keys)
    const normalizedBooking = {
      ...booking,
      service: Array.isArray(booking.service) ? booking.service[0] : booking.service,
      seeker: Array.isArray(booking.seeker) ? booking.seeker[0] : booking.seeker,
      provider: Array.isArray(booking.provider) ? booking.provider[0] : booking.provider,
    };

    // Send confirmation email to seeker
    const seekerEmailSuccess = await sendEmail({
      to: normalizedBooking.seeker.email,
      subject: `✅ Booking Confirmed: ${normalizedBooking.service.title}`,
      html: emailTemplates.bookingConfirmation({
        userName: normalizedBooking.seeker.full_name,
        providerName: normalizedBooking.provider.full_name,
        serviceName: normalizedBooking.service.title,
        startTime: new Date(booking.start_time).toLocaleString(),
        endTime: new Date(booking.end_time).toLocaleString(),
      }),
    });

    // Send notification email to provider
    const providerEmailSuccess = await sendEmail({
      to: normalizedBooking.provider.email,
      subject: `🔔 New Booking: ${normalizedBooking.service.title}`,
      html: emailTemplates.bookingConfirmation({
        userName: normalizedBooking.provider.full_name,
        providerName: normalizedBooking.seeker.full_name,
        serviceName: normalizedBooking.service.title,
        startTime: new Date(booking.start_time).toLocaleString(),
        endTime: new Date(booking.end_time).toLocaleString(),
      }),
    });

    if (!seekerEmailSuccess || !providerEmailSuccess) {
      console.warn("Some emails failed to send");
    }

    return NextResponse.json({
      success: true,
      message: "Confirmation emails sent",
      seekerEmailSent: seekerEmailSuccess,
      providerEmailSent: providerEmailSuccess,
    });
  } catch (error) {
    console.error("Send booking confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to send confirmation email" },
      { status: 500 }
    );
  }
}
