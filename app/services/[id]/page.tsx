"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Star,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format, subHours } from "date-fns";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import { ReviewList } from "@/components/ReviewList";

// --- shadcn/ui components (Patched Imports) ---
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
// ----------------------------

// Define the type for our joined service data
type ServiceDetails = {
  id: number;
  title: string;
  description: string;
  category: string;
  provider: {
    id: string;
    full_name: string;
    bio: string;
    avatar_url: string;
  };
};

type ValuePiece = Date | null;
type CalendarValue = ValuePiece | [ValuePiece, ValuePiece];

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params); // Unwrap the params Promise

  const [service, setService] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<CalendarValue>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [existingBookings, setExistingBookings] = useState<
    { start_time: string; end_time: string }[]
  >([]);
  const [bookingState, setBookingState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch service details and join with the provider's profile info
        const { data, error } = await supabase
          .from("services")
          .select(
            `
            id,
            title,
            description,
            category,
            provider: profiles!services_provider_id_fkey (
              id,
              full_name,
              bio,
              avatar_url
            )
          `
          )
          .eq("id", id)
          .single(); // We expect only one service

        if (error) throw error;
        if (!data) throw new Error("Service not found");

        // Handle the provider data which comes as an object (not array) due to single relationship
        const typedData = {
          ...data,
          provider: Array.isArray(data.provider)
            ? data.provider[0]
            : data.provider,
        } as ServiceDetails;
        setService(typedData);
      } catch (err: any) {
        console.error("Error fetching service:", err);
        setError("Could not load service details. " + err.message);
        toast.error("Failed to load service details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchService();
    }
  }, [id]);

  // Fetch existing bookings for the selected date
  useEffect(() => {
    const fetchBookingsForDate = async () => {
      if (!service || !selectedDate) return;

      const dateToFetch = Array.isArray(selectedDate)
        ? selectedDate[0]
        : selectedDate;
      if (!dateToFetch) return;

      try {
        const startOfDay = new Date(dateToFetch);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(dateToFetch);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from("bookings")
          .select("start_time, end_time")
          .eq("provider_id", service.provider.id)
          .in("status", ["pending", "confirmed"])
          .gte("start_time", startOfDay.toISOString())
          .lte("end_time", endOfDay.toISOString());

        if (error) throw error;
        setExistingBookings(data || []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        toast.error("Could not load existing bookings");
      }
    };

    fetchBookingsForDate();
  }, [selectedDate, service]);

  const handleBooking = async () => {
    if (!selectedTimeSlot) {
      toast.error("Please select a time slot");
      return;
    }

    setBookingState("loading");
    setBookingError(null);

    try {
      // 1. Get the current logged-in user (the "seeker")
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // If no user, redirect to login
        router.push(`/login?redirect=/services/${params.id}`);
        return;
      }

      if (!service) {
        throw new Error("Service not found");
      }

      // 2. Check for conflicts via API
      setCheckingConflict(true);
      const conflictResponse = await fetch("/api/check-conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: service.provider.id,
          startTime: selectedTimeSlot.start.toISOString(),
          endTime: selectedTimeSlot.end.toISOString(),
        }),
      });

      const conflictData = await conflictResponse.json();
      setCheckingConflict(false);

      if (conflictData.hasConflict) {
        toast.error(
          "This time slot is no longer available. Please select another."
        );
        // Refresh bookings
        const dateToFetch = Array.isArray(selectedDate)
          ? selectedDate[0]
          : selectedDate;
        if (dateToFetch) {
          const startOfDay = new Date(dateToFetch);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(dateToFetch);
          endOfDay.setHours(23, 59, 59, 999);

          const { data } = await supabase
            .from("bookings")
            .select("start_time, end_time")
            .eq("provider_id", service.provider.id)
            .in("status", ["pending", "confirmed"])
            .gte("start_time", startOfDay.toISOString())
            .lte("end_time", endOfDay.toISOString());

          if (data) setExistingBookings(data);
        }
        setBookingState("error");
        return;
      }

      // 3. Create the booking record
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          service_id: service.id,
          seeker_id: user.id,
          provider_id: service.provider.id,
          start_time: selectedTimeSlot.start.toISOString(),
          end_time: selectedTimeSlot.end.toISOString(),
          status: "pending",
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // 4. Schedule automated reminders
      if (bookingData) {
        const bookingTime = new Date(selectedTimeSlot.start);

        // Schedule reminders: 24 hours before, 1 hour before, 15 minutes before
        const reminders = [
          { type: "24h", time: subHours(bookingTime, 24) },
          { type: "1h", time: subHours(bookingTime, 1) },
          {
            type: "15min",
            time: new Date(bookingTime.getTime() - 15 * 60 * 1000),
          },
        ];

        for (const reminder of reminders) {
          await fetch("/api/reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: bookingData.id,
              reminderType: reminder.type,
              reminderTime: reminder.time.toISOString(),
            }),
          });
        }
      }

      setBookingState("success");
      toast.success("Booking requested successfully!", {
        description: `${format(
          selectedTimeSlot.start,
          "MMM d, yyyy"
        )} at ${format(selectedTimeSlot.start, "h:mm a")}`,
        action: {
          label: "View Booking",
          onClick: () => router.push(`/bookings/${bookingData.id}`),
        },
      });

      // Reset time slot selection
      setSelectedTimeSlot(null);
    } catch (err: any) {
      console.error("Error creating booking:", err);
      setBookingError(err.message);
      setBookingState("error");
      toast.error("Failed to create booking", {
        description: err.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error || "Service not found."}</p>
      </div>
    );
  }

  // Helper to get initials from name
  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="container max-w-4xl p-4 mx-auto my-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* --- Left Column (Service Info) --- */}
        <div className="md:col-span-2">
          <Badge className="mb-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
            {service.category}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">{service.title}</h1>

          {/* --- Mock Reputation System (Core Feature 4) --- */}
          <div className="flex items-center my-4">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <Star className="w-5 h-5 text-gray-300 fill-gray-300" />
            <span className="ml-2 text-sm text-gray-600">(14 Reviews)</span>
          </div>
          {/* ------------------------------------------------ */}

          <p className="mt-6 text-lg text-gray-700 whitespace-pre-wrap">
            {service.description}
          </p>

          <hr className="my-8" />

          {/* --- Provider Info Card --- */}
          <h2 className="text-2xl font-semibold">About the Provider</h2>
          <Card className="mt-4 border-none shadow-none bg-gray-50">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage
                  src={service.provider.avatar_url}
                  alt={service.provider.full_name}
                />
                <AvatarFallback>
                  {getInitials(service.provider.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  {service.provider.full_name}
                </CardTitle>
                <CardDescription>Joined 2024</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{service.provider.bio}</p>
            </CardContent>
          </Card>
        </div>

        {/* --- Right Column (Booking) --- */}
        <div className="md:col-span-1">
          <Card className="sticky top-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CalendarIcon className="w-6 h-6" />
                Book this Service
              </CardTitle>
              <CardDescription>Select a date and time slot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Choose Date
                </label>
                <Calendar
                  onChange={(value) => {
                    setSelectedDate(value);
                    setSelectedTimeSlot(null); // Reset time slot when date changes
                  }}
                  value={selectedDate}
                  minDate={new Date()} // Can't book in the past
                  className="border-none react-calendar-override w-full"
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Choose Time
                  </label>
                  <TimeSlotPicker
                    selectedDate={
                      Array.isArray(selectedDate)
                        ? selectedDate[0] || new Date()
                        : selectedDate
                    }
                    existingBookings={existingBookings}
                    onSelectSlot={(start, end) =>
                      setSelectedTimeSlot({ start, end })
                    }
                    selectedSlot={selectedTimeSlot}
                    duration={60}
                  />
                </div>
              )}

              {selectedTimeSlot && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-emerald-900">
                    <Clock className="w-4 h-4" />
                    <div>
                      <div className="font-semibold">
                        {format(selectedTimeSlot.start, "EEEE, MMM d, yyyy")}
                      </div>
                      <div>
                        {format(selectedTimeSlot.start, "h:mm a")} -{" "}
                        {format(selectedTimeSlot.end, "h:mm a")}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleBooking}
                disabled={
                  bookingState === "loading" ||
                  !selectedTimeSlot ||
                  checkingConflict
                }
              >
                {(bookingState === "loading" || checkingConflict) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {bookingState === "success" && (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {checkingConflict
                  ? "Checking availability..."
                  : bookingState === "success"
                  ? "Booked!"
                  : "Request to Book"}
              </Button>

              {bookingState === "error" && (
                <div className="flex items-center p-2 text-sm text-red-700 bg-red-100 rounded-md">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <p>Error: {bookingError || "Could not book."}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <div className="mt-6">
            <ReviewList profileId={service.provider.id} />
          </div>
        </div>
      </div>

      {/* Simple CSS override for the calendar to fit our theme */}
      <style jsx global>{`
        .react-calendar-override {
          width: 100% !important;
          border: none !important;
        }
        .react-calendar__tile--active,
        .react-calendar__tile--active:hover,
        .react-calendar__tile--active:focus {
          background: #059669 !important; /* emerald-600 */
          color: white !important;
        }
      `}</style>
    </div>
  );
}
