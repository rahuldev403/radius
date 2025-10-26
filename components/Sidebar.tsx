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
  Home,
  ChevronLeft,
  ChevronRight,
  Users,
  Coins,
  Menu,
  X,
} from "lucide-react";
import { RiRobot2Line } from "react-icons/ri";
import { AIChatbot } from "@/components/AIChatbot";
import { CreateServiceModal } from "@/components/CreateServiceModal";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "./AppLayout";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useTranslation();
  const { isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen } =
    useSidebar();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    {
      icon: Home,
      label: t("dashboard"),
      path: "/dashboard",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: MapPin,
      label: t("explore"),
      path: "/home",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Calendar,
      label: t("bookings"),
      path: "/my-bookings",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Users,
      label: t("projects"),
      path: "/projects",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Coins,
      label: t("credits"),
      path: "/credits",
      color: "from-yellow-500 to-amber-500",
    },
    {
      icon: User,
      label: t("profile"),
      path: "/account",
      color: "from-indigo-500 to-purple-500",
    },
  ];

  return (
    <>
      {/* Mobile Top Navbar */}
      {isMobile && (
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm"
        >
          <div className="flex items-center justify-between px-4 py-3 h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Radius Logo"
                width={40}
                height={40}
                className="rounded-lg"
                style={{ width: "40px", height: "auto" }}
              />
              <div>
                <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Radius
                </h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-10 w-10"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </motion.header>
      )}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-4 space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Button
                      key={item.path}
                      variant="ghost"
                      onClick={() => {
                        router.push(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full justify-start px-4 h-12 ${
                        isActive
                          ? "bg-gradient-to-r " +
                            item.color +
                            " text-white shadow-lg"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      } transition-all duration-200 rounded-xl`}
                    >
                      <item.icon className="mr-3 w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  );
                })}

                <div className="pt-4">
                  <Button
                    onClick={() => {
                      setIsCreateModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start px-4 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg rounded-xl font-medium"
                  >
                    <Plus className="mr-3 w-5 h-5" />
                    <span className="font-semibold">{t("createService")}</span>
                  </Button>
                </div>

                <div className="pt-4 space-y-2 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAiChatOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start px-4 h-11 text-purple-600 hover:text-white hover:bg-linear-to-r hover:from-purple-500 hover:to-indigo-600 rounded-xl"
                  >
                    <RiRobot2Line className="mr-3 w-5 h-5" />
                    <span className="font-medium">AI Help</span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start px-4 h-11 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 rounded-xl"
                  >
                    <LogOut className="mr-3 w-5 h-5" />
                    <span className="font-medium">{t("logout")}</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          key={language}
          initial={false}
          animate={{
            width: isCollapsed ? "80px" : "280px",
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="fixed left-0 top-0 bottom-0 z-50 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl flex flex-col"
        >
          {/* Header with Logo */}
          <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <motion.div
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => router.push("/home")}
              >
                {!isCollapsed ? (
                  <>
                    <div>
                      <h1 className="font-bold text-2xl tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        Radius
                      </h1>
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 px-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm"
                      >
                        Beta
                      </Badge>
                    </div>
                  </>
                ) : null}
              </motion.div>

              {/* Collapse Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-9 w-9 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Logo Image Below Toggle */}
            <div className="flex justify-center">
              <motion.div
                animate={{
                  scale: isCollapsed ? 0.9 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="cursor-pointer group"
                onClick={() => router.push("/home")}
              >
                <Image
                  src="/logo.png"
                  alt="Radius Logo"
                  width={56}
                  height={56}
                  className="rounded-lg"
                  style={{ width: "56px", height: "auto" }}
                />
              </motion.div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
            {navItems.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => router.push(item.path)}
                    className={`w-full ${
                      isCollapsed ? "justify-center px-2" : "justify-start px-4"
                    } h-12 relative group ${
                      isActive
                        ? "bg-gradient-to-r " +
                          item.color +
                          " text-white shadow-lg shadow-black/10 hover:shadow-xl"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    } transition-all duration-200 rounded-xl`}
                  >
                    {/* Glow effect for active item */}
                    {isActive && !isCollapsed && (
                      <motion.div
                        layoutId="activeGlow"
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 rounded-xl"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}

                    <item.icon
                      className={`${
                        isCollapsed ? "" : "mr-3"
                      } w-5 h-5 relative z-10 ${
                        isActive ? "drop-shadow-sm" : ""
                      }`}
                    />

                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className={`font-medium relative z-10 ${
                            isActive ? "font-semibold" : ""
                          }`}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              );
            })}

            {/* Create Service Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-4"
            >
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className={`w-full ${
                  isCollapsed ? "justify-center px-2" : "justify-start px-4"
                } h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 relative group rounded-xl font-medium`}
              >
                <Plus className={`${isCollapsed ? "" : "mr-3"} w-5 h-5`} />

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="font-semibold"
                    >
                      {t("createService")}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                    {t("createService")}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                )}
              </Button>
            </motion.div>
          </nav>

          {/* Bottom Actions */}
          <div className="px-3 py-4 space-y-2 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
            {/* AI Help Button */}
            <Button
              variant="ghost"
              onClick={() => setAiChatOpen(true)}
              className={`w-full ${
                isCollapsed ? "justify-center px-2" : "justify-start px-4"
              } h-11 text-purple-600 hover:text-white hover:bg-linear-to-r hover:from-purple-500 hover:to-indigo-600 relative group rounded-xl transition-all duration-200`}
            >
              <RiRobot2Line
                className={`${
                  isCollapsed ? "" : "mr-3"
                } w-5 h-5 group-hover:scale-110 transition-transform`}
              />

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium"
                  >
                    AI Help
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                  AI Help
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              )}
            </Button>

            {/* Sign Out */}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className={`w-full ${
                isCollapsed ? "justify-center px-2" : "justify-start px-4"
              } h-11 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 relative group rounded-xl transition-all duration-200`}
            >
              <LogOut
                className={`${
                  isCollapsed ? "" : "mr-3"
                } w-5 h-5 group-hover:rotate-12 transition-transform`}
              />

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium"
                  >
                    {t("logout")}
                  </motion.span>
                )}
              </AnimatePresence>

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                  {t("logout")}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              )}
            </Button>
          </div>
        </motion.aside>
      )}

      {/* Create Service Modal */}
      <CreateServiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* AI Chatbot Modal - only render when open */}
      {aiChatOpen && (
        <AIChatbot isOpen={true} onClose={() => setAiChatOpen(false)} />
      )}
    </>
  );
}
