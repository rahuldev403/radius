"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { motion } from "framer-motion";
import { useState, useEffect, createContext, useContext } from "react";
import { useAccessibility } from "@/lib/accessibility-context";

const pagesWithoutSidebar = [
  "/",
  "/auth/callback",
  "/auth/verify-success",
  "/auth/verify-error",
  "/test-email",
];

// Context for sidebar state
interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings } = useAccessibility();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const shouldShowSidebar = !pagesWithoutSidebar.includes(pathname);

  const sidebarWidth = isCollapsed ? 80 : 280;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    } else {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("sidebarCollapsed", String(isCollapsed));
    }
  }, [isCollapsed, isInitialized]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  if (!shouldShowSidebar) {
    return <div key={settings.language}>{children}</div>;
  }

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
      }}
    >
      <div key={settings.language}>
        <Sidebar />
        <motion.main
          initial={false}
          animate={{
            marginLeft: isMobile ? 0 : `${sidebarWidth}px`,
            paddingTop: isMobile ? "64px" : 0,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="min-h-screen"
        >
          {children}
        </motion.main>
      </div>
    </SidebarContext.Provider>
  );
}
