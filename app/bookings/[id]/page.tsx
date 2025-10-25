"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Send, Video } from "lucide-react";
import { VideoCall } from "@/components/VideoCall";
import { toast } from "sonner";
import React from "react";

// --- shadcn/ui components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define types
type Message = {
  id: number;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id?: string;
};

type BookingDetails = {
  id: number;
  provider: { id: string; full_name: string; avatar_url: string };
  seeker: { id: string; full_name: string; avatar_url: string };
  service: { id: number; title: string };
};

type User = {
  id: string;
  full_name?: string;
  avatar_url?: string;
};

export default function BookingChatPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Helper to scroll to the bottom of the chat
  const scrollToBottom = () => {
    // Check for scrollAreaRef and its current property
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  // --- Data Fetching Effect ---
  useEffect(() => {
    const setupChat = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setCurrentUser(user);

        // 2. Fetch booking details to identify the two chat participants
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select(
            `
            id,
            provider: profiles!bookings_provider_id_fkey (id, full_name, avatar_url),
            seeker: profiles!bookings_seeker_id_fkey (id, full_name, avatar_url),
            service: services (id, title)
          `
          )
          .eq("id", id)
          .single();

        if (bookingError) throw bookingError;

        // Normalize the data - Supabase may return arrays for foreign keys
        const normalizedBooking = {
          ...bookingData,
          provider: Array.isArray(bookingData.provider)
            ? bookingData.provider[0]
            : bookingData.provider,
          seeker: Array.isArray(bookingData.seeker)
            ? bookingData.seeker[0]
            : bookingData.seeker,
          service: Array.isArray(bookingData.service)
            ? bookingData.service[0]
            : bookingData.service,
        };

        // Check if user is part of this booking
        if (
          user.id !== normalizedBooking.provider.id &&
          user.id !== normalizedBooking.seeker.id
        ) {
          throw new Error("You are not authorized to view this chat.");
        }

        setBooking(normalizedBooking as BookingDetails);
        const providerId = normalizedBooking.provider.id;
        const seekerId = normalizedBooking.seeker.id;

        // 3. Fetch initial messages
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .in("sender_id", [providerId, seekerId])
          .in("receiver_id", [providerId, seekerId]);
        // .order('created_at', { ascending: true }); // We sort in JS after, or here

        if (messagesError) throw messagesError;

        // Filter messages to only those between these two users
        const relevantMessages = messagesData.filter(
          (m) =>
            (m.sender_id === providerId && m.receiver_id === seekerId) ||
            (m.sender_id === seekerId && m.receiver_id === providerId)
        );

        setMessages(
          relevantMessages.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          )
        );
      } catch (err: any) {
        console.error("Error setting up chat:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    setupChat();
  }, [id, supabase, router]);

  // --- Real-time Subscription Effect ---
  useEffect(() => {
    if (!booking) return;

    // Get the two user IDs for the subscription filter
    const providerId = booking.provider.id;
    const seekerId = booking.seeker.id;

    // Listen to new messages in the 'messages' table
    const channel = supabase
      .channel(`chat_room:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          // Filter for messages between only these two users
          filter: `receiver_id=in.(${providerId},${seekerId})`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Check if the new message is part of this specific chat
          if (
            (newMessage.sender_id === providerId &&
              newMessage.receiver_id === seekerId) ||
            (newMessage.sender_id === seekerId &&
              newMessage.receiver_id === providerId)
          ) {
            setMessages((currentMessages) => [...currentMessages, newMessage]);
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, id, booking]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !booking) return;

    // Determine who is the receiver
    const receiverId =
      currentUser.id === booking.provider.id
        ? booking.seeker.id
        : booking.provider.id;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUser.id,
        receiver_id: receiverId,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage(""); // Clear the input
    } catch (err: any) {
      console.error("Error sending message:", err);
      // Optionally show an error to the user
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error || "Booking not found."}</p>
      </div>
    );
  }

  // Determine who the "other user" is
  const otherUser =
    currentUser?.id === booking.provider.id ? booking.seeker : booking.provider;

  if (showVideoCall) {
    return <VideoCall bookingId={id} onClose={() => setShowVideoCall(false)} />;
  }

  return (
    <div className="container flex items-center justify-center max-w-2xl min-h-screen p-4 mx-auto">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <CardTitle>Chat about "{booking.service.title}"</CardTitle>
              <p className="text-sm text-gray-500">
                You are chatting with {otherUser.full_name}
              </p>
            </div>
            <Button
              onClick={() => {
                setShowVideoCall(true);
                toast.success("Starting video call...");
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              <Video className="w-4 h-4 mr-2" />
              Video Call
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea
            className="h-[50vh] w-full p-4 border rounded-md"
            ref={scrollAreaRef}
          >
            <div className="flex flex-col gap-4">
              {messages.map((msg) => {
                const isCurrentUser = msg.sender_id === currentUser?.id;
                const participant = isCurrentUser ? currentUser : otherUser;
                const name = isCurrentUser
                  ? "You"
                  : participant?.full_name || "Unknown";
                // Ensure participant and avatar_url are defined
                const avatarUrl = (participant as any)?.avatar_url || "";

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      isCurrentUser ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback>{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`p-3 rounded-lg max-w-xs ${
                        isCurrentUser
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSendMessage} className="flex w-full gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
