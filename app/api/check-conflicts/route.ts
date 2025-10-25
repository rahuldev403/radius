import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, startTime, endTime, excludeBookingId } = body;

    if (!providerId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Parse the ISO timestamps and extract date and time components
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    const bookingDate = startDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const startTimeOnly = startDate.toTimeString().split(" ")[0]; // HH:MM:SS
    const endTimeOnly = endDate.toTimeString().split(" ")[0]; // HH:MM:SS

    // Query for overlapping bookings on the same date
    let query = supabase
      .from("bookings")
      .select("id, start_time, end_time, status, booking_date")
      .eq("provider_id", providerId)
      .eq("booking_date", bookingDate)
      .in("status", ["pending", "confirmed"])
      .or(`and(start_time.lt.${endTimeOnly},end_time.gt.${startTimeOnly})`);

    // Exclude a specific booking if updating an existing one
    if (excludeBookingId) {
      query = query.neq("id", excludeBookingId);
    }

    const { data: conflicts, error } = await query;

    if (error) {
      console.error("Error checking conflicts:", error);
      return NextResponse.json(
        { error: "Failed to check conflicts" },
        { status: 500 }
      );
    }

    const hasConflict = conflicts && conflicts.length > 0;

    return NextResponse.json({
      hasConflict,
      conflicts: conflicts || [],
      message: hasConflict
        ? `Found ${conflicts.length} conflicting booking(s)`
        : "Time slot is available",
    });
  } catch (error) {
    console.error("Conflict check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
