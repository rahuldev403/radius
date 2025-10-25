"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type AccessibilitySettings = {
  // Visual Settings
  highContrast: boolean;
  fontSize: "small" | "medium" | "large" | "extra-large";
  reduceMotion: boolean;

  // Language Settings
  language: string;

  // Voice Navigation
  voiceEnabled: boolean;
  screenReaderMode: boolean;

  // Reading Assistance
  dyslexiaFont: boolean;
  lineSpacing: "normal" | "relaxed" | "loose";

  // Focus & Navigation
  showFocusIndicators: boolean;
  keyboardNavigation: boolean;
};

type AccessibilityContextType = {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
};

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  fontSize: "medium",
  reduceMotion: false,
  language: "en",
  voiceEnabled: false,
  screenReaderMode: false,
  dyslexiaFont: false,
  lineSpacing: "normal",
  showFocusIndicators: true,
  keyboardNavigation: true,
};

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] =
    useState<AccessibilitySettings>(defaultSettings);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("accessibility-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error("Error loading accessibility settings:", error);
      }
    }

    // Initialize speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSynth(window.speechSynthesis);
    }

    // Check for system preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSettings((prev) => ({ ...prev, reduceMotion: true }));
    }

    if (window.matchMedia("(prefers-contrast: high)").matches) {
      setSettings((prev) => ({ ...prev, highContrast: true }));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("accessibility-settings", JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  const applySettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement;

    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Apply font size
    root.classList.remove("text-sm", "text-base", "text-lg", "text-xl");
    switch (settings.fontSize) {
      case "small":
        root.classList.add("text-sm");
        break;
      case "medium":
        root.classList.add("text-base");
        break;
      case "large":
        root.classList.add("text-lg");
        break;
      case "extra-large":
        root.classList.add("text-xl");
        break;
    }

    // Apply reduced motion
    if (settings.reduceMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // Apply dyslexia font
    if (settings.dyslexiaFont) {
      root.classList.add("dyslexia-font");
    } else {
      root.classList.remove("dyslexia-font");
    }

    // Apply line spacing
    root.classList.remove(
      "line-spacing-normal",
      "line-spacing-relaxed",
      "line-spacing-loose"
    );
    root.classList.add(`line-spacing-${settings.lineSpacing}`);

    // Apply focus indicators
    if (settings.showFocusIndicators) {
      root.classList.add("show-focus-indicators");
    } else {
      root.classList.remove("show-focus-indicators");
    }

    // Apply language
    root.setAttribute("lang", settings.language);
  };

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const speak = (text: string) => {
    if (!synth || !settings.voiceEnabled) return;

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use the language-specific voice
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang.startsWith(settings.language));
    if (voice) {
      utterance.voice = voice;
    }

    synth.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synth) {
      synth.cancel();
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{ settings, updateSettings, resetSettings, speak, stopSpeaking }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    );
  }
  return context;
}
