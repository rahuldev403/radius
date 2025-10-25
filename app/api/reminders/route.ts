import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// This API route handles scheduling reminders for bookings
// In production, this would integrate with a service like SendGrid, Twilio, or a job queue

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, reminderType, reminderTime } = body;

    if (!bookingId || !reminderType || !reminderTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a reminder record in the database
    const { data, error } = await supabase
      .from("booking_reminders")
      .insert({
        booking_id: bookingId,
        reminder_type: reminderType, // '24h', '1h', '15min'
        scheduled_for: reminderTime,
        sent: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating reminder:", error);
      return NextResponse.json(
        { error: "Failed to schedule reminder" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reminder: data });
  } catch (error) {
    console.error("Reminder API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch pending reminders (for cron job/scheduled task)
export async function GET() {
  try {
    const now = new Date().toISOString();

    // Fetch reminders that are due and haven't been sent
    const { data: reminders, error } = await supabase
      .from("booking_reminders")
      .select(
        `
        *,
        booking:bookings (
          id,
          start_time,
          end_time,
          service:services (title),
          seeker:profiles!bookings_seeker_id_fkey (full_name, email),
          provider:profiles!bookings_provider_id_fkey (full_name)
        )
      `
      )
      .eq("sent", false)
      .lte("scheduled_for", now);

    if (error) throw error;

    // In production, this would send actual emails/SMS
    // For now, we'll just mark them as sent
    if (reminders && reminders.length > 0) {
      const reminderIds = reminders.map((r) => r.id);
      await supabase
        .from("booking_reminders")
        .update({ sent: true })
        .in("id", reminderIds);
    }

    return NextResponse.json({
      success: true,
      reminders: reminders || [],
      message: `Processed ${reminders?.length || 0} reminders`,
    });
  } catch (error) {
    console.error("GET reminders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}
