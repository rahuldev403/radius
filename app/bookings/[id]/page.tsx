"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { wsClient } from "@/lib/websocket-client";
import { useRouter } from "next/navigation";
import { Loader2, Send, Video, ArrowLeft } from "lucide-react";
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
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
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

    console.log("🔌 Setting up realtime subscription for chat:", id);

    // Listen to new messages in the 'messages' table
    const channel = supabase
      .channel(`chat_room:${id}`, {
        config: {
          broadcast: { self: false },
          presence: { key: currentUser.id },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          // Filter to only messages relevant to this chat
          filter: `sender_id=in.(${providerId},${seekerId})`,
        },
        (payload) => {
          console.log("📨 New message received via realtime:", payload);
          const newMessage = payload.new as Message;

          // Verify the message belongs to this chat (between provider and seeker)
          const isRelevant =
            (newMessage.sender_id === providerId &&
              newMessage.receiver_id === seekerId) ||
            (newMessage.sender_id === seekerId &&
              newMessage.receiver_id === providerId);

          if (!isRelevant) {
            console.log("❌ Message not relevant to this chat, ignoring");
            return;
          }

          console.log("✅ Adding new message to state:", newMessage.id);

          // Add message to state if not already present
          setMessages((currentMessages) => {
            const exists = currentMessages.some(
              (msg) => msg.id === newMessage.id
            );
            if (exists) {
              console.log("⚠️ Message already exists, skipping");
              return currentMessages;
            }
            return [...currentMessages, newMessage];
          });

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
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `sender_id=in.(${providerId},${seekerId})`,
        },
        (payload) => {
          console.log("📝 Message updated via realtime:", payload);
          const updatedMessage = payload.new as Message;

          // Verify the message belongs to this chat
          const isRelevant =
            (updatedMessage.sender_id === providerId &&
              updatedMessage.receiver_id === seekerId) ||
            (updatedMessage.sender_id === seekerId &&
              updatedMessage.receiver_id === providerId);

          if (!isRelevant) return;

          setMessages((currentMessages) =>
            currentMessages.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log("📅 Booking updated via realtime:", payload);
          const updatedBooking = payload.new as any;

          // Update booking state
          setBooking((prev) => (prev ? { ...prev, ...updatedBooking } : prev));

          // Check if video call or status changed
          const otherUser =
            currentUser.id === booking?.provider.id
              ? booking?.seeker
              : booking?.provider;

          // Toast notification for booking updates
          toast.info(`Booking updated by ${otherUser?.full_name}`, {
            description: "Check the latest booking details",
            duration: 5000,
          });
        }
      )
      .subscribe((status) => {
        console.log("🔔 Subscription status changed:", status);
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime subscription active for booking:", id);
          toast.success("Connected to real-time chat", { duration: 2000 });
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Realtime subscription error for booking:", id);
          toast.error("Connection issue. Messages may be delayed.", {
            description: "Try refreshing the page if messages don't appear",
          });
        } else if (status === "TIMED_OUT") {
          console.error("⏱️ Realtime subscription timed out for booking:", id);
          toast.error("Connection timed out. Trying to reconnect...", {
            duration: 3000,
          });
        } else if (status === "CLOSED") {
          console.warn("🔌 Realtime subscription closed for booking:", id);
        }
      });

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up realtime subscription for booking:", id);
      supabase.removeChannel(channel);
    };
  }, [booking, currentUser, id, supabase]);

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
        // Try bulk update first (more efficient)
        const { error: bulkError } = await supabase
          .from("messages")
          .update({ read: true })
          .in("id", unreadIds)
          .eq("receiver_id", currentUser.id);

        if (!bulkError) {
          // Bulk update succeeded
          setMessages((currentMessages) =>
            currentMessages.map((msg) =>
              unreadIds.includes(msg.id) ? { ...msg, read: true } : msg
            )
          );
          setUnreadCount(0);
          return;
        }

        console.warn(
          "Bulk update failed, trying individual updates:",
          bulkError
        );

        // Fall back to individual updates if bulk fails
        const updatePromises = unreadIds.map(async (msgId) => {
          const { error } = await supabase
            .from("messages")
            .update({ read: true })
            .eq("id", msgId)
            .eq("receiver_id", currentUser.id);

          if (error) {
            console.error(`Error marking message ${msgId} as read:`, error);
            console.error(
              "Full error details:",
              JSON.stringify(error, null, 2)
            );
            return { success: false, error };
          }

          return { success: true };
        });

        const results = await Promise.all(updatePromises);
        const successCount = results.filter((r) => r.success).length;

        if (successCount > 0) {
          // Update local state for successfully marked messages
          setMessages((currentMessages) =>
            currentMessages.map((msg) =>
              unreadIds.includes(msg.id) ? { ...msg, read: true } : msg
            )
          );

          // Reset unread count
          setUnreadCount(0);
        } else if (unreadIds.length > 0) {
          console.warn(`Failed to mark ${unreadIds.length} message(s) as read`);
        }
      } catch (err) {
        console.error("Exception marking messages as read:", err);
      }
    };

    // Debounce the mark as read operation
    const timeoutId = setTimeout(() => {
      markMessagesAsRead();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [messages, currentUser, booking]);

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
    <>
      {/* Global styles for chat scrollbar */}
      <style jsx global>{`
        body {
          overflow: hidden;
        }

        /* Custom Scrollbar Styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #f0fdf4, #ecfdf5);
          border-radius: 10px;
          margin: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
          border-radius: 10px;
          border: 2px solid #f0fdf4;
          transition: all 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
          border-color: #d1fae5;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: linear-gradient(135deg, #047857 0%, #0f766e 100%);
        }

        /* Dark mode scrollbar */
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #1f2937, #111827);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
          border-color: #1f2937;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #34d399 0%, #2dd4bf 100%);
          border-color: #374151;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-950 dark:via-emerald-950/30 dark:to-teal-950/30 p-4">
        <div className="flex items-center justify-center w-full h-[calc(100vh-2rem)]">
          <Card className="w-full h-full max-w-6xl shadow-2xl border-0 overflow-hidden flex flex-col">
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white pb-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => router.back()}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
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
            <CardContent className="p-0 flex-1 overflow-hidden">
              <div
                className="h-full w-full p-6 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50 overflow-y-auto custom-scrollbar"
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
              </div>
            </CardContent>

            {/* Message Input */}
            <CardFooter className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
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
    </>
  );
}
