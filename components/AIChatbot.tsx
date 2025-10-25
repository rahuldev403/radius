"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Trash2, X, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

interface AIChatbotProps {
  variant?: "floating" | "navbar";
  isCollapsed?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "How do I create a service?",
  "How do I book a service?",
  "How do payments work?",
  "Can I cancel a booking?",
];

const PREDEFINED_ANSWERS: Record<string, string> = {
  "how do i create a service":
    "To create a service:\n1. Click the green '+' button on the dashboard\n2. Fill in the service details (title, description, category)\n3. Set your availability\n4. Click 'Create Service'\n\nYour service will appear on the map and be visible to users within your radius!",

  "how do i book a service":
    "To book a service:\n1. Browse services on the map or list view\n2. Click 'View Details' on a service\n3. Select a date from the calendar\n4. Choose an available time slot\n5. Click 'Request to Book'\n\nYou'll receive automatic reminders 24 hours, 1 hour, and 15 minutes before your session!",

  "how do payments work":
    "Radius uses secure payment processing:\n• Payments are held in escrow until service completion\n• Providers receive payment after the session is marked complete\n• Refunds are available for cancelled bookings (based on cancellation policy)\n• All transactions are encrypted and secure",

  "can i cancel a booking":
    "Yes! To cancel a booking:\n1. Go to 'My Bookings' from the dashboard\n2. Find the booking you want to cancel\n3. Click 'Cancel' button\n\nNote: Cancellation policies may apply depending on when you cancel.",

  "how do i message a provider":
    "To message a provider:\n1. Go to 'My Bookings'\n2. Find the booking\n3. Click the 'Chat' button\n\nYou can also access chats from individual booking pages!",

  "what if there's a conflict":
    "Radius has built-in conflict detection:\n• When booking, we automatically check for overlapping time slots\n• If a conflict is detected, you'll see an error message\n• Simply choose a different time slot\n• The system prevents double-booking automatically!",

  "how do i get reminders":
    "Reminders are automatic!\n• 24 hours before your session\n• 1 hour before your session\n• 15 minutes before your session\n\nYou'll receive notifications via email and in-app alerts.",

  "how do i update my profile":
    "To update your profile:\n1. Click 'Profile' button in the header\n2. Edit your name, bio, or location\n3. Click 'Save Changes'\n\nYour location determines which services you see on the map!",
};

export function AIChatbot({
  variant = "floating",
  isCollapsed = false,
}: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'm your Radius AI assistant. I can help you with:\n\n• Creating and managing services\n• Booking sessions\n• Understanding features\n• Troubleshooting issues\n\nAsk me anything or tap a suggested question below!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateResponse = (userQuestion: string): string => {
    const question = userQuestion.toLowerCase().trim();

    // Check for exact or partial matches in predefined answers
    for (const [key, answer] of Object.entries(PREDEFINED_ANSWERS)) {
      if (question.includes(key) || key.includes(question)) {
        return answer;
      }
    }

    // Keyword-based responses
    if (question.includes("profile") || question.includes("account")) {
      return PREDEFINED_ANSWERS["how do i update my profile"];
    }

    if (question.includes("book") || question.includes("appointment")) {
      return PREDEFINED_ANSWERS["how do i book a service"];
    }

    if (question.includes("create") || question.includes("add service")) {
      return PREDEFINED_ANSWERS["how do i create a service"];
    }

    if (
      question.includes("payment") ||
      question.includes("pay") ||
      question.includes("money")
    ) {
      return PREDEFINED_ANSWERS["how do payments work"];
    }

    if (question.includes("cancel") || question.includes("refund")) {
      return PREDEFINED_ANSWERS["can i cancel a booking"];
    }

    if (
      question.includes("message") ||
      question.includes("chat") ||
      question.includes("contact")
    ) {
      return PREDEFINED_ANSWERS["how do i message a provider"];
    }

    if (question.includes("reminder") || question.includes("notification")) {
      return PREDEFINED_ANSWERS["how do i get reminders"];
    }

    if (question.includes("conflict") || question.includes("double book")) {
      return PREDEFINED_ANSWERS["what if there's a conflict"];
    }

    // Help with navigation
    if (
      question.includes("where") ||
      question.includes("find") ||
      question.includes("how to get")
    ) {
      return "Here's how to navigate Radius:\n\n🏠 **Dashboard**: Map/List view of services\n📅 **Bookings**: View your bookings and sessions\n👤 **Profile**: Update your information\n➕ **Create Service**: Green + button\n\nWhat specifically are you looking for?";
    }

    // General help
    return "I'd be happy to help! Here are some things I can assist with:\n\n• Creating services\n• Booking sessions\n• Managing your profile\n• Understanding features\n• Cancellations and refunds\n• Messaging and chat\n• Payment information\n\nCould you rephrase your question or choose from the suggested questions above?";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input; // Store input before clearing
    setInput(""); // Clear input immediately to fix disappearing bug
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const response = generateResponse(currentInput);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSuggestedQuestion = (question: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(question);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "👋 Hi! I'm your Radius AI assistant. I can help you with:\n\n• Creating and managing services\n• Booking sessions\n• Understanding features\n• Troubleshooting issues\n\nAsk me anything or tap a suggested question below!",
        timestamp: new Date(),
      },
    ]);
    setInput("");
    toast.success("Chat cleared!");
  };

  // Navbar variant (compact button)
  if (variant === "navbar") {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          variant="ghost"
          className={`w-full h-12 flex items-center ${
            isCollapsed ? "justify-center px-0" : "justify-start"
          } gap-3 text-white hover:bg-gray-800 px-3 relative group`}
        >
          <MessageCircle className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">AI Help</span>}

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              AI Help
            </div>
          )}
        </Button>

        {isOpen && (
          <Card className="fixed top-20 right-4 w-96 h-[550px] shadow-2xl z-9999 flex flex-col">
            <CardHeader className="bg-linear-to-r from-emerald-600 to-teal-600 text-white p-3 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <CardTitle className="text-sm">AI Assistant</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearChat}
                    className="text-white hover:bg-white/20 h-7 w-7"
                    title="Clear chat"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-7 w-7"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-emerald-50 mt-1">
                Ask me anything about Radius!
              </p>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <div
                className="flex-1 overflow-auto p-4 space-y-4"
                ref={scrollRef}
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-linear-to-r from-emerald-600 to-teal-600 text-white"
                          : "bg-gray-100 text-gray-900 border"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                        {message.content}
                      </p>
                      <span className="text-xs opacity-60 mt-1 block">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-2 border">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t p-2 bg-white">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type your question..."
                    className="flex-1 text-sm h-8"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-8 w-8"
                    size="icon"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>

                {messages.length === 1 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <Button
                        key={q}
                        onClick={() => handleSuggestedQuestion(q)}
                        variant="outline"
                        className="text-xs px-2 py-1 h-auto rounded-md border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-gray-700"
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  // Floating variant (bottom-right button)
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 z-9999 transition-all duration-200 hover:scale-110"
        size="icon"
        title="Open AI Assistant"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[550px] shadow-2xl z-9999 flex flex-col">
      <CardHeader className="bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <CardTitle className="text-sm">AI Assistant</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="text-white hover:bg-white/20 h-7 w-7"
              title="Clear chat"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-7 w-7"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-emerald-50 mt-1">
          Ask me anything about Radius!
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[90%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-linear-to-r from-emerald-600 to-teal-600 text-white"
                    : "bg-gray-100 text-gray-900 border"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                  {message.content}
                </p>
                <span className="text-xs opacity-60 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-2 border">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-2 bg-white">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your question..."
              className="flex-1 text-sm h-8"
              disabled={isTyping}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-8 w-8"
              size="icon"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>

          {messages.length === 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <Button
                  key={q}
                  onClick={() => handleSuggestedQuestion(q)}
                  variant="outline"
                  className="text-xs px-2 py-1 h-auto rounded-md border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-gray-700"
                >
                  {q}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
