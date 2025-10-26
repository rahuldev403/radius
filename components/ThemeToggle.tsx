"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem("theme") as Theme) || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) {
    return null;
  }

  const getIcon = () => {
    if (theme === "light") return <Sun className="w-5 h-5" />;
    if (theme === "dark") return <Moon className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const getLabel = () => {
    if (theme === "light") return "Light";
    if (theme === "dark") return "Dark";
    return "System";
  };

  if (collapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        className="w-full h-12 text-gray-400 hover:text-white hover:bg-gray-800/50 relative group"
        title={`Theme: ${getLabel()}`}
      >
        {getIcon()}
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          Theme: {getLabel()}
        </div>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={cycleTheme}
      className="w-full justify-start h-12 text-gray-400 hover:text-white hover:bg-gray-800/50"
    >
      {getIcon()}
      <span className="ml-3 font-medium">Theme: {getLabel()}</span>
    </Button>
  );
}
