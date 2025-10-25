"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

type Booking = {
  id: number;
  start_time: string;
  end_time: string;
  status: string;
  service: {
    id: number;
    title: string;
    category: string;
  };
  provider: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  seeker: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
};

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"seeker" | "provider">("seeker");

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);

        // Fetch bookings where user is either seeker or provider
        const { data, error } = await supabase
          .from("bookings")
          .select(
            `
            id,
            start_time,
            end_time,
            status,
            service:services (id, title, category),
            provider:profiles!bookings_provider_id_fkey (id, full_name, avatar_url),
            seeker:profiles!bookings_seeker_id_fkey (id, full_name, avatar_url)
          `
          )
          .or(`seeker_id.eq.${user.id},provider_id.eq.${user.id}`)
          .order("start_time", { ascending: false });

        if (error) throw error;

        // Type assertion for the nested data
        const typedBookings = (data || []).map((booking) => ({
          ...booking,
          service: Array.isArray(booking.service)
            ? booking.service[0]
            : booking.service,
          provider: Array.isArray(booking.provider)
            ? booking.provider[0]
            : booking.provider,
          seeker: Array.isArray(booking.seeker)
            ? booking.seeker[0]
            : booking.seeker,
        })) as Booking[];

        setBookings(typedBookings);
      } catch (err: any) {
        console.error("Error fetching bookings:", err);
        toast.error("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [router]);

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );

      toast.success(`Booking ${newStatus}!`);
    } catch (err: any) {
      console.error("Error updating booking:", err);
      toast.error("Failed to update booking");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (viewMode === "seeker") {
      return booking.seeker.id === userId;
    } else {
      return booking.provider.id === userId;
    }
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">My Bookings</h1>
        <p className="text-gray-600">
          Manage your service bookings and sessions
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={viewMode === "seeker" ? "default" : "outline"}
          onClick={() => setViewMode("seeker")}
          className={viewMode === "seeker" ? "bg-emerald-600" : ""}
        >
          <Calendar className="w-4 h-4 mr-2" />
          My Bookings ({bookings.filter((b) => b.seeker.id === userId).length})
        </Button>
        <Button
          variant={viewMode === "provider" ? "default" : "outline"}
          onClick={() => setViewMode("provider")}
          className={viewMode === "provider" ? "bg-emerald-600" : ""}
        >
          <User className="w-4 h-4 mr-2" />
          My Sessions ({bookings.filter((b) => b.provider.id === userId).length}
          )
        </Button>
      </div>

      {/* Bookings List */}
      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="space-y-4 pr-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-4">
                  {viewMode === "seeker"
                    ? "Start exploring services and make your first booking!"
                    : "You don't have any sessions scheduled yet."}
                </p>
                {viewMode === "seeker" && (
                  <Button onClick={() => router.push("/home")}>
                    Browse Services
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => {
              const isProvider = booking.provider.id === userId;
              const otherPerson = isProvider
                ? booking.seeker
                : booking.provider;

              return (
                <Card
                  key={booking.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">
                            {booking.service.title}
                          </CardTitle>
                          <Badge variant="secondary">
                            {booking.service.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(
                              new Date(booking.start_time),
                              "MMM d, yyyy"
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(
                              new Date(booking.start_time),
                              "h:mm a"
                            )} - {format(new Date(booking.end_time), "h:mm a")}
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={`${getStatusColor(booking.status)} border`}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={otherPerson.avatar_url}
                            alt={otherPerson.full_name}
                          />
                          <AvatarFallback>
                            {getInitials(otherPerson.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {isProvider ? "Client" : "Provider"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {otherPerson.full_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/bookings/${booking.id}`)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Chat
                        </Button>

                        {isProvider && booking.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() =>
                                handleStatusChange(booking.id, "confirmed")
                              }
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(booking.id, "cancelled")
                              }
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </>
                        )}

                        {!isProvider && booking.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(booking.id, "cancelled")
                            }
                          >
                            Cancel
                          </Button>
                        )}

                        {booking.status === "confirmed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(booking.id, "completed")
                            }
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
