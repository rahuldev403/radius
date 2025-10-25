"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/use-translation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  User,
  LogOut,
  Plus,
  MessageCircleQuestion,
  Home,
  Menu,
  X,
  Users,
  Coins,
  Sparkles,
} from "lucide-react";
import { AIChatbot } from "@/components/AIChatbot";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      // Set a flag to skip auth check on next load (for faster logout UX)
      if (typeof window !== "undefined") {
        sessionStorage.setItem("just_logged_out", "true");

        // Clear all session/local storage
        localStorage.clear();
      }

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Force a complete page reload to root
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error signing out:", error);
      // Still redirect even if there's an error
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  // Define navItems inside the component so it re-computes when language changes
  const navItems = [
    { icon: Home, label: t("dashboard"), path: "/dashboard" },
    { icon: MapPin, label: t("explore"), path: "/home" },
    { icon: Calendar, label: t("bookings"), path: "/my-bookings" },
    { icon: Users, label: t("projects"), path: "/projects" },
    { icon: Coins, label: t("credits"), path: "/credits" },
    { icon: User, label: t("profile"), path: "/account" },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
        key={language}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push("/home")}
            >
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Radius Logo"
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={pathname === item.path ? "default" : "ghost"}
                  size="sm"
                  onClick={() => router.push(item.path)}
                  className={`flex items-center gap-2 transition-all duration-200 group ${
                    pathname === item.path
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-emerald-50/80 dark:text-gray-300 dark:hover:bg-emerald-950/30"
                  }`}
                >
                  <item.icon
                    className={`w-4 h-4 transition-all duration-200 ${
                      pathname === item.path
                        ? "text-white"
                        : "text-gray-600 dark:text-gray-300 group-hover:text-white group-hover:scale-110"
                    }`}
                  />
                  <span
                    className={`transition-all duration-200 ${
                      pathname === item.path
                        ? "font-bold text-white"
                        : "group-hover:font-bold group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                </Button>
              ))}

              {/* Create Service Button */}
              <Button
                onClick={() => router.push("/services/new")}
                size="sm"
                className="bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 group"
              >
                <Plus className="w-4 h-4 mr-1 group-hover:rotate-90 transition-transform duration-200" />
                {t("createService")}
              </Button>

              {/* AI Help Button */}
              <Button
                onClick={() => setAiChatOpen(true)}
                size="sm"
                variant="ghost"
                className="flex items-center gap-2 text-purple-600 hover:text-white hover:bg-linear-to-r hover:from-purple-500 hover:to-indigo-600 transition-all duration-200 group"
              >
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">AI Help</span>
              </Button>

              {/* Sign Out */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 transition-all duration-200 group"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                {t("logout")}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-emerald-500 hover:bg-emerald-50/80 dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 transition-all duration-200 group"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 group-hover:scale-110 group-hover:rotate-90 transition-all duration-200" />
              ) : (
                <Menu className="w-6 h-6 group-hover:scale-110 transition-all duration-200" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white dark:bg-gray-900">
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={pathname === item.path ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    router.push(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full justify-start transition-all duration-200 group ${
                    pathname === item.path
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md"
                      : "text-gray-600 hover:text-emerald-500 hover:bg-emerald-50/80 dark:text-gray-300 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30"
                  }`}
                >
                  <item.icon
                    className={`w-4 h-4 mr-2 transition-all duration-200 ${
                      pathname === item.path
                        ? "text-white"
                        : "text-gray-600 group-hover:text-emerald-500 group-hover:scale-110 dark:text-gray-300 dark:group-hover:text-emerald-400"
                    }`}
                  />
                  <span
                    className={`transition-all duration-200 ${
                      pathname !== item.path && "group-hover:font-semibold"
                    }`}
                  >
                    {item.label}
                  </span>
                </Button>
              ))}
              <Button
                onClick={() => {
                  router.push("/services/new");
                  setMobileMenuOpen(false);
                }}
                size="sm"
                className="w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md hover:shadow-lg transition-all duration-200 group"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                {t("createService")}
              </Button>
              <Button
                onClick={() => {
                  setAiChatOpen(true);
                  setMobileMenuOpen(false);
                }}
                size="sm"
                variant="ghost"
                className="w-full justify-start text-purple-600 hover:text-white hover:bg-linear-to-r hover:from-purple-500 hover:to-indigo-600 transition-all duration-200 group"
              >
                <Sparkles className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                AI Help
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 transition-all duration-200 group"
              >
                <LogOut className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                {t("logout")}
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* AI Chatbot Modal */}
      <AIChatbot isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16" />
    </>
  );
}
