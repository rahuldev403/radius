"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { wsClient } from "@/lib/websocket-client";
import { Send, X, Loader2, Video, PhoneOff, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { VideoCall } from "@/components/VideoCall";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Message = {
  id: number;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  read?: boolean;
};

type ChatUser = {
  id: string;
  full_name: string;
  avatar_url: string;
};

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string;
  bookingId?: number; // Optional booking ID for video call context
}

export function ChatModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientAvatar,
  bookingId,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [recipient, setRecipient] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallInitiated, setVideoCallInitiated] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && recipientId) {
      initializeChat();
    }
  }, [isOpen, recipientId]);

  // Set up viewport reference after mount
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLDivElement;
      if (viewport) {
        console.log("✅ Viewport found and referenced");
        viewportRef.current = viewport;

        // Add scroll listener to viewport
        const handleScrollEvent = () => {
          if (viewport) {
            const { scrollTop, scrollHeight, clientHeight } = viewport;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
          }
        };

        viewport.addEventListener("scroll", handleScrollEvent);
        return () => viewport.removeEventListener("scroll", handleScrollEvent);
      } else {
        console.warn("⚠️ Viewport not found in ScrollArea");
      }
    }
  }, [isOpen, loading]);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    // Connect to WebSocket
    console.log("🔌 Connecting to WebSocket for chat");
    wsClient.connect(currentUser.id);

    // Handle incoming messages
    const handleNewMessage = (data: any) => {
      if (data.type === "new_message") {
        const newMsg = data.message;

        // Only add if it's between current user and recipient
        if (
          (newMsg.sender_id === currentUser.id &&
            newMsg.receiver_id === recipientId) ||
          (newMsg.sender_id === recipientId &&
            newMsg.receiver_id === currentUser.id)
        ) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id);
            if (exists) return prev;
            return [...prev, newMsg];
          });

          // Show notification if from recipient
          if (newMsg.sender_id === recipientId) {
            toast.info(`${recipient?.full_name}: ${newMsg.content}`);
          }

          scrollToBottom();
        }
      }
    };

    // Handle video call events
    const handleVideoCall = (data: any) => {
      if (data.type === "video_call_request" && data.senderId === recipientId) {
        setIncomingCall(true);
        toast.info(`${recipient?.full_name} is calling you`, {
          duration: 10000,
        });
      }
    };

    wsClient.on("new_message", handleNewMessage);
    wsClient.on("all", handleNewMessage);
    wsClient.on("video_call_request", handleVideoCall);

    return () => {
      wsClient.off("new_message", handleNewMessage);
      wsClient.off("all", handleNewMessage);
      wsClient.off("video_call_request", handleVideoCall);
    };
  }, [isOpen, currentUser, recipientId, recipient]);

  // Auto-scroll when messages change
  useEffect(() => {
    console.log("📨 Messages changed, auto-scrolling. Count:", messages.length);
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to chat");
        onClose();
        return;
      }

      // Fetch current user profile
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      setCurrentUser(currentUserProfile);

      // Fetch recipient profile
      const { data: recipientProfile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", recipientId)
        .single();

      setRecipient(
        recipientProfile || {
          id: recipientId,
          full_name: recipientName || "User",
          avatar_url: recipientAvatar || "",
        }
      );

      // Fetch existing messages between these two users
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(messagesData || []);
      scrollToBottom();
    } catch (error: any) {
      console.error("Error initializing chat:", error);
      toast.error("Failed to load chat");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      const viewport = viewportRef.current;
      if (viewport) {
        console.log("📜 Scrolling to bottom:", {
          scrollHeight: viewport.scrollHeight,
          clientHeight: viewport.clientHeight,
        });
        viewport.scrollTop = viewport.scrollHeight;
      } else {
        console.warn("⚠️ Viewport not found for scrolling");
      }
    }, 100);
  };

  // Smooth scroll to bottom with animation
  const smoothScrollToBottom = () => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || sending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      // Save to database
      const { data: savedMessage, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUser.id,
          receiver_id: recipientId,
          content: content,
          read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Broadcast via WebSocket
      wsClient.send({
        type: "message",
        receiverId: recipientId,
        data: savedMessage,
      });

      // Add to local state
      setMessages((prev) => [...prev, savedMessage]);
      scrollToBottom();
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setNewMessage(content); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleStartVideoCall = () => {
    if (!bookingId) {
      toast.error("Video calls are only available for booked sessions");
      return;
    }

    // Send video call request via WebSocket
    wsClient.send({
      type: "video_call_request",
      receiverId: recipientId,
      data: {
        senderId: currentUser?.id,
        senderName: currentUser?.full_name,
        bookingId: bookingId,
      },
    });

    setVideoCallInitiated(true);
    setShowVideoCall(true);
    toast.success("Video call started");
  };

  const handleAcceptCall = () => {
    setIncomingCall(false);
    setShowVideoCall(true);
    toast.success("Joined video call");
  };

  const handleDeclineCall = () => {
    setIncomingCall(false);
    toast.info("Call declined");
  };

  const handleEndVideoCall = () => {
    setShowVideoCall(false);
    setVideoCallInitiated(false);
    setIncomingCall(false);
    toast.info("Video call ended");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {showVideoCall ? (
          // Video Call UI
          <div className="flex-1 flex flex-col bg-gray-900">
            <div className="px-6 py-4 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-semibold">
                  Video Call with {recipient?.full_name}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEndVideoCall}
                className="text-white hover:bg-red-600"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1">
              <VideoCall
                bookingId={bookingId?.toString() || ""}
                onClose={handleEndVideoCall}
              />
            </div>
          </div>
        ) : (
          // Chat UI
          <>
            <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-emerald-600 to-teal-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-white">
                    <AvatarImage src={recipient?.avatar_url} />
                    <AvatarFallback className="bg-white text-emerald-600 font-bold">
                      {recipient?.full_name
                        ? getInitials(recipient.full_name)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <DialogTitle className="text-white text-lg">
                    {recipient?.full_name || "Loading..."}
                  </DialogTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleStartVideoCall}
                    className="text-white hover:bg-white/20"
                    title="Start video call"
                  >
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Incoming Call Banner */}
            {incomingCall && (
              <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    {recipient?.full_name} is calling you...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleAcceptCall}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Video className="w-4 h-4 mr-1" />
                    Join
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeclineCall}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : (
              <>
                <div className="relative flex-1 overflow-hidden">
                  <ScrollArea
                    ref={scrollAreaRef}
                    className="h-full p-4 bg-gray-50 dark:bg-gray-900"
                  >
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p>No messages yet</p>
                        <p className="text-sm mt-2">
                          Send a message to start the conversation
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => {
                          const isOwn = msg.sender_id === currentUser?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${
                                isOwn ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                  isOwn
                                    ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white"
                                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                                }`}
                              >
                                <p className="break-words">{msg.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwn
                                      ? "text-emerald-100"
                                      : "text-gray-500 dark:text-gray-400"
                                  }`}
                                >
                                  {format(
                                    new Date(msg.created_at),
                                    "MMM d, h:mm a"
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Floating Scroll to Bottom Button */}
                  {showScrollButton && (
                    <Button
                      onClick={smoothScrollToBottom}
                      size="icon"
                      className="absolute bottom-4 right-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg z-10"
                      title="Scroll to bottom"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t bg-white dark:bg-gray-900 flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
