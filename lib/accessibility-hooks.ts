"use client";

import { useEffect, useRef } from "react";
import { useAccessibility } from "./accessibility-context";

/**
 * Hook to announce text to screen readers and voice navigation
 * Usage: const announce = useAnnounce();
 *        announce("Page loaded successfully");
 */
export function useAnnounce() {
  const { settings, speak } = useAccessibility();

  const announce = (
    message: string,
    priority: "polite" | "assertive" = "polite"
  ) => {
    if (settings.voiceEnabled) {
      speak(message);
    }

    // Also announce to screen readers
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return announce;
}

/**
 * Hook to automatically announce when a component mounts
 * Usage: useAutoAnnounce("Dashboard page loaded");
 */
export function useAutoAnnounce(message: string, dependencies: any[] = []) {
  const announce = useAnnounce();

  useEffect(() => {
    announce(message);
  }, dependencies);
}

/**
 * Hook to handle keyboard navigation
 * Usage: useKeyboardNav({ onEnter: () => handleSubmit() });
 */
export function useKeyboardNav(handlers: {
  onEnter?: () => void;
  onEscape?: () => void;
  onSpace?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Enter":
          if (handlers.onEnter) {
            event.preventDefault();
            handlers.onEnter();
          }
          break;
        case "Escape":
          if (handlers.onEscape) {
            event.preventDefault();
            handlers.onEscape();
          }
          break;
        case " ":
          if (handlers.onSpace) {
            event.preventDefault();
            handlers.onSpace();
          }
          break;
        case "ArrowUp":
          if (handlers.onArrowUp) {
            event.preventDefault();
            handlers.onArrowUp();
          }
          break;
        case "ArrowDown":
          if (handlers.onArrowDown) {
            event.preventDefault();
            handlers.onArrowDown();
          }
          break;
        case "ArrowLeft":
          if (handlers.onArrowLeft) {
            event.preventDefault();
            handlers.onArrowLeft();
          }
          break;
        case "ArrowRight":
          if (handlers.onArrowRight) {
            event.preventDefault();
            handlers.onArrowRight();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}

/**
 * Hook to handle focus trap for modals
 * Usage: const modalRef = useFocusTrap(isOpen);
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey as any);
    firstElement?.focus();

    return () => {
      container.removeEventListener("keydown", handleTabKey as any);
    };
  }, [isActive]);

  return containerRef;
}
