"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X } from "lucide-react";
import { AccessibilityPanel } from "./AccessibilityPanel";
import { useAccessibility } from "@/lib/accessibility-context";

export function AccessibilityButton() {
  const [showPanel, setShowPanel] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { settings } = useAccessibility();

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setShowPanel(!showPanel)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-6 right-6 z-[9999] p-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group"
        aria-label="Open accessibility settings"
        title="Accessibility Settings"
      >
        <AnimatePresence mode="wait">
          {showPanel ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="group-hover:rotate-90 transition-transform duration-300"
            >
              <Settings className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Settings Badge */}
        {(settings.highContrast ||
          settings.voiceEnabled ||
          settings.dyslexiaFont ||
          settings.fontSize !== "medium") && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && !showPanel && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="fixed bottom-6 right-24 z-[9998] bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap"
          >
            <p className="text-sm font-medium">Accessibility Settings</p>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
              <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-gray-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility Panel */}
      <AccessibilityPanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
      />
    </>
  );
}
