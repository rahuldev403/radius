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
  read?: boolean;
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
  const [unreadCount, setUnreadCount] = useState(0);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

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
    if (!booking || !currentUser) return;

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

            // Show notification if message is from other user
            if (newMessage.sender_id !== currentUser.id) {
              const otherUser =
                newMessage.sender_id === booking.provider.id
                  ? booking.provider
                  : booking.seeker;

              // Browser notification
              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification(`New message from ${otherUser.full_name}`, {
                  body: newMessage.content,
                  icon: otherUser.avatar_url || "/logo.png",
                  tag: `chat-${id}`,
                });
              }

              // Toast notification
              toast.info(`${otherUser.full_name}: ${newMessage.content}`);

              // Update unread count
              setUnreadCount((prev) => prev + 1);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((currentMessages) =>
            currentMessages.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, id, booking, currentUser]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (!currentUser || !booking || messages.length === 0) return;

    const markMessagesAsRead = async () => {
      // Get all unread messages sent to current user
      const unreadMessages = messages.filter(
        (msg) => msg.receiver_id === currentUser.id && !msg.read
      );

      if (unreadMessages.length === 0) return;

      const unreadIds = unreadMessages.map((msg) => msg.id);

      try {
        // Mark them as read
        const { error } = await supabase
          .from("messages")
          .update({ read: true })
          .in("id", unreadIds)
          .eq("receiver_id", currentUser.id); // Only update messages for current user

        if (error) {
          console.error("Error marking messages as read:", error);
          // Don't block the UI if marking as read fails
          return;
        }

        // Reset unread count
        setUnreadCount(0);

        // Update local state
        setMessages((currentMessages) =>
          currentMessages.map((msg) =>
            unreadIds.includes(msg.id) ? { ...msg, read: true } : msg
          )
        );
      } catch (err) {
        console.error("Exception marking messages as read:", err);
      }
    };

    // Debounce the mark as read operation
    const timeoutId = setTimeout(() => {
      markMessagesAsRead();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [messages, currentUser, booking, supabase]);

  // Update page title with unread count
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) New Messages - Radius`;
    } else {
      document.title = "Chat - Radius";
    }
  }, [unreadCount]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-950 dark:via-emerald-950/30 dark:to-teal-950/30 pt-20">
      <div className="container max-w-4xl mx-auto p-4 py-8">
        <Card className="w-full shadow-2xl border-0 overflow-hidden">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 border-2 border-white shadow-lg">
                  <AvatarImage src={otherUser.avatar_url} />
                  <AvatarFallback className="bg-white text-emerald-600 font-bold">
                    {getInitials(otherUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-white text-xl mb-1">
                    {otherUser.full_name}
                  </CardTitle>
                  <p className="text-emerald-100 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                    Chat about "{booking.service.title}"
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setShowVideoCall(true);
                  toast.success("Starting video call...");
                }}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white shadow-lg"
                size="sm"
              >
                <Video className="w-4 h-4 mr-2" />
                Video Call
              </Button>
            </div>
          </CardHeader>

          {/* Chat Messages */}
          <CardContent className="p-0">
            <ScrollArea
              className="h-[60vh] w-full p-6 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50"
              ref={scrollAreaRef}
            >
              <div className="flex flex-col gap-4">
                {messages.map((msg) => {
                  const isCurrentUser = msg.sender_id === currentUser?.id;
                  const participant = isCurrentUser ? currentUser : otherUser;
                  const name = isCurrentUser
                    ? "You"
                    : participant?.full_name || "Unknown";
                  const avatarUrl = (participant as any)?.avatar_url || "";

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 ${
                        isCurrentUser ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="w-10 h-10 shadow-md">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback
                          className={
                            isCurrentUser
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-200 text-gray-700"
                          }
                        >
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`group relative max-w-[70%] ${
                          isCurrentUser ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`p-4 rounded-2xl shadow-md transition-all hover:shadow-lg ${
                            isCurrentUser
                              ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-sm"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">
                            {msg.content}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-2 text-xs text-gray-500 mt-1 px-2 ${
                            isCurrentUser ? "flex-row-reverse" : ""
                          }`}
                        >
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs">
                              {msg.read ? (
                                <span className="text-blue-500 font-medium">
                                  ✓✓ Seen
                                </span>
                              ) : (
                                <span className="text-gray-400">✓ Sent</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>

          {/* Message Input */}
          <CardFooter className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <form onSubmit={handleSendMessage} className="flex w-full gap-3">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 rounded-xl px-4 py-6 text-base shadow-sm"
              />
              <Button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
