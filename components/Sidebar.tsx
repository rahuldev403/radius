"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  User,
  LogOut,
  Plus,
  Home,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { AIChatbot } from "@/components/AIChatbot";
import { CreateServiceModal } from "@/components/CreateServiceModal";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "./AppLayout";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("just_logged_out", "true");
        localStorage.clear();
      }
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error signing out:", error);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: MapPin, label: "Explore", path: "/home" },
    { icon: Calendar, label: "Bookings", path: "/my-bookings" },
    { icon: User, label: "Profile", path: "/account" },
  ];

  return (
    <>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? "80px" : "280px",
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className="fixed left-0 top-0 bottom-0 z-50 bg-black border-r border-gray-900 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          <motion.div
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/home")}
          >
            {!isCollapsed && (
              <>
                <div className="relative">
                  <Image
                    src="/logo.png"
                    alt="Radius Logo"
                    width={36}
                    height={36}
                    className="rounded-lg object-cover"
                  />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">Radius</h1>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
                  >
                    Beta
                  </Badge>
                </div>
              </>
            )}
          </motion.div>

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-all"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => router.push(item.path)}
                className={`w-full ${
                  isCollapsed ? "justify-center px-0" : "justify-start"
                } h-12 relative group text-white ${
                  isActive
                    ? "bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    : "hover:bg-gray-900/50"
                } transition-all duration-200`}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <item.icon className={`${isCollapsed ? "" : "mr-3"} w-5 h-5`} />

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Button>
            );
          })}

          {/* Create Service Button */}
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className={`w-full ${
              isCollapsed ? "justify-center px-0" : "justify-start"
            } h-12 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white relative group mt-4`}
          >
            <Plus className={`${isCollapsed ? "" : "mr-3"} w-5 h-5`} />

            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium"
                >
                  Create Service
                </motion.span>
              )}
            </AnimatePresence>

            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Create Service
              </div>
            )}
          </Button>
        </nav>

        {/* Bottom Actions */}
        <div className="px-3 py-4 space-y-2 border-t border-gray-200">
          {/* AI Chatbot - Always show as button in sidebar */}
          <AIChatbot variant="navbar" isCollapsed={isCollapsed} />

          {/* Sign Out */}
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={`w-full ${
              isCollapsed ? "justify-center px-0" : "justify-start"
            } h-12 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 relative group`}
          >
            <LogOut className={`${isCollapsed ? "" : "mr-3"} w-5 h-5`} />

            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>

            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Sign Out
              </div>
            )}
          </Button>
        </div>
      </motion.aside>

      {/* Create Service Modal */}
      <CreateServiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Mobile Overlay Toggle */}
      <Button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="md:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-2xl"
        size="icon"
      >
        <Menu className="w-6 h-6" />
      </Button>
    </>
  );
}
