"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { motion } from "framer-motion";
import { useState, useEffect, createContext, useContext } from "react";

// Pages that should NOT have the sidebar
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
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if current page should have sidebar
  const shouldShowSidebar = !pagesWithoutSidebar.includes(pathname);

  // Get sidebar width for margin
  const sidebarWidth = isCollapsed ? 80 : 280;

  useEffect(() => {
    // Auto-collapse on mobile
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <Sidebar />
      <motion.main
        initial={false}
        animate={{
          marginLeft: `${sidebarWidth}px`,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className="min-h-screen"
      >
        {children}
      </motion.main>
    </SidebarContext.Provider>
  );
}
