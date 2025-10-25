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

    // Query for overlapping bookings
    let query = supabase
      .from("bookings")
      .select("id, start_time, end_time, status")
      .eq("provider_id", providerId)
      .in("status", ["pending", "confirmed"])
      .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

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
