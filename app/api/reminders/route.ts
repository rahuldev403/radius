import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail, emailTemplates } from "@/lib/email";

// This API route handles scheduling and sending reminders for bookings

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

// GET endpoint to fetch pending reminders and send emails (for cron job/scheduled task)
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
          booking_date,
          start_time,
          end_time,
          service:services (title),
          seeker:profiles!bookings_seeker_id_fkey (full_name, email),
          provider:profiles!bookings_provider_id_fkey (full_name, email)
        )
      `
      )
      .eq("sent", false)
      .lte("scheduled_for", now);

    if (error) throw error;

    // Send emails for each reminder
    const emailPromises = (reminders || []).map(async (reminder: any) => {
      const booking = reminder.booking;
      if (!booking || !booking.seeker?.email) return false;

      // Combine date and time to create a full timestamp
      const startTime = new Date(
        `${booking.booking_date}T${booking.start_time}`
      );
      const timeUntil = getTimeUntilString(startTime);

      // Determine email type based on reminder type
      let emailHtml = "";
      let subject = "";

      if (reminder.reminder_type === "15min") {
        subject = "⏰ Your session starts in 15 minutes!";
        emailHtml = emailTemplates.sessionStarting({
          userName: booking.seeker.full_name,
          serviceName: booking.service.title,
          bookingId: booking.id,
        });
      } else {
        subject = `⏰ Reminder: Upcoming session in ${timeUntil}`;
        emailHtml = emailTemplates.bookingReminder({
          userName: booking.seeker.full_name,
          providerName: booking.provider.full_name,
          serviceName: booking.service.title,
          startTime: startTime.toLocaleString(),
          timeUntil,
        });
      }

      try {
        await sendEmail({
          to: booking.seeker.email,
          subject,
          html: emailHtml,
        });
        return true;
      } catch (error) {
        console.error(
          `Failed to send email for reminder ${reminder.id}:`,
          error
        );
        return false;
      }
    });

    await Promise.all(emailPromises);

    // Mark reminders as sent
    if (reminders && reminders.length > 0) {
      const reminderIds = reminders.map((r) => r.id);
      await supabase
        .from("booking_reminders")
        .update({ sent: true, sent_at: new Date().toISOString() })
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

// Helper function to get human-readable time until string
function getTimeUntilString(targetTime: Date): string {
  const now = new Date();
  const diff = targetTime.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
}
