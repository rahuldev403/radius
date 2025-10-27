"use client";

import { useState } from "react";
import { useAccessibility } from "@/lib/accessibility-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Eye,
  Volume2,
  Globe,
  Type,
  Keyboard,
  X,
  RotateCcw,
  Check,
  Mic,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type AccessibilityPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

export function AccessibilityPanel({
  isOpen,
  onClose,
}: AccessibilityPanelProps) {
  const { settings, updateSettings, resetSettings, speak, stopSpeaking } =
    useAccessibility();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleTestVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      speak("Voice navigation is enabled. This is a test message.");
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 3000);
    }
  };

  const handleReset = () => {
    resetSettings();
    toast.success("Settings reset to defaults");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
          />

          {/* Panel */}
          <div className="fixed inset-0 flex items-center justify-center z-[10001] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white shrink-0">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Close accessibility panel"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <Settings className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Accessibility Settings
                    </h2>
                    <p className="text-purple-100 text-sm">
                      Customize your experience
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-scrollbar">
                {/* Visual Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-purple-600" />
                      Visual Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* High Contrast */}
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <Label className="font-medium text-gray-900 cursor-pointer">
                          High Contrast Mode
                        </Label>
                        <p className="text-sm text-gray-600">
                          Increase color contrast for better visibility
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateSettings({
                            highContrast: !settings.highContrast,
                          })
                        }
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          settings.highContrast
                            ? "bg-purple-600"
                            : "bg-gray-300"
                        }`}
                        aria-label="Toggle high contrast"
                        role="switch"
                        aria-checked={settings.highContrast}
                      >
                        <span
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                            settings.highContrast ? "translate-x-6" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Font Size */}
                    <div className="p-3 border rounded-lg">
                      <Label className="font-medium text-gray-900 mb-3 block">
                        Font Size
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {(
                          ["small", "medium", "large", "extra-large"] as const
                        ).map((size) => (
                          <button
                            key={size}
                            onClick={() => updateSettings({ fontSize: size })}
                            className={`p-3 rounded-lg border-2 transition-all capitalize ${
                              settings.fontSize === size
                                ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                                : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                            }`}
                          >
                            {size === "extra-large"
                              ? "XL"
                              : size[0].toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reduce Motion */}
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <Label className="font-medium text-gray-900 cursor-pointer">
                          Reduce Motion
                        </Label>
                        <p className="text-sm text-gray-600">
                          Minimize animations and transitions
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateSettings({
                            reduceMotion: !settings.reduceMotion,
                          })
                        }
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          settings.reduceMotion
                            ? "bg-purple-600"
                            : "bg-gray-300"
                        }`}
                        aria-label="Toggle reduce motion"
                        role="switch"
                        aria-checked={settings.reduceMotion}
                      >
                        <span
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                            settings.reduceMotion ? "translate-x-6" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Reading Assistance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="w-5 h-5 text-purple-600" />
                      Reading Assistance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Dyslexia Font */}
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <Label className="font-medium text-gray-900 cursor-pointer">
                          Dyslexia-Friendly Font
                        </Label>
                        <p className="text-sm text-gray-600">
                          Use OpenDyslexic font for easier reading
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateSettings({
                            dyslexiaFont: !settings.dyslexiaFont,
                          })
                        }
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          settings.dyslexiaFont
                            ? "bg-purple-600"
                            : "bg-gray-300"
                        }`}
                        aria-label="Toggle dyslexia font"
                        role="switch"
                        aria-checked={settings.dyslexiaFont}
                      >
                        <span
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                            settings.dyslexiaFont ? "translate-x-6" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Line Spacing */}
                    <div className="p-3 border rounded-lg">
                      <Label className="font-medium text-gray-900 mb-3 block">
                        Line Spacing
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["normal", "relaxed", "loose"] as const).map(
                          (spacing) => (
                            <button
                              key={spacing}
                              onClick={() =>
                                updateSettings({ lineSpacing: spacing })
                              }
                              className={`p-3 rounded-lg border-2 transition-all capitalize ${
                                settings.lineSpacing === spacing
                                  ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                                  : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                              }`}
                            >
                              {spacing}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Voice Navigation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-purple-600" />
                      Voice & Audio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Voice Enabled */}
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <Label className="font-medium text-gray-900 cursor-pointer">
                          Voice Navigation
                        </Label>
                        <p className="text-sm text-gray-600">
                          Enable text-to-speech for navigation
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateSettings({
                            voiceEnabled: !settings.voiceEnabled,
                          })
                        }
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          settings.voiceEnabled
                            ? "bg-purple-600"
                            : "bg-gray-300"
                        }`}
                        aria-label="Toggle voice navigation"
                        role="switch"
                        aria-checked={settings.voiceEnabled}
                      >
                        <span
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                            settings.voiceEnabled ? "translate-x-6" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Test Voice */}
                    {settings.voiceEnabled && (
                      <Button
                        onClick={handleTestVoice}
                        variant="outline"
                        className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-4 h-4 mr-2" />
                            Stop Test
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 mr-2" />
                            Test Voice
                          </>
                        )}
                      </Button>
                    )}

                    {/* Screen Reader Mode */}
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <Label className="font-medium text-gray-900 cursor-pointer">
                          Screen Reader Mode
                        </Label>
                        <p className="text-sm text-gray-600">
                          Optimize for screen reader compatibility
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateSettings({
                            screenReaderMode: !settings.screenReaderMode,
                          })
                        }
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          settings.screenReaderMode
                            ? "bg-purple-600"
                            : "bg-gray-300"
                        }`}
                        aria-label="Toggle screen reader mode"
                        role="switch"
                        aria-checked={settings.screenReaderMode}
                      >
                        <span
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                            settings.screenReaderMode ? "translate-x-6" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Language Settings */}
                <Card className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-purple-600" />
                      Language
                      <Badge className="ml-auto bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800">
                        Coming Soon
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
                        <div className="text-center p-4">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            🌍 Multi-language Support Coming Soon!
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            We're working on bringing this feature to you.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 opacity-30 pointer-events-none">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            disabled
                            className={`p-3 rounded-lg border-2 transition-all ${
                              settings.language === lang.code
                                ? "border-purple-600 bg-purple-50 ring-2 ring-purple-200"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="text-2xl mb-1">{lang.flag}</div>
                            <div className="text-sm font-medium text-gray-900">
                              {lang.name}
                            </div>
                            {settings.language === lang.code && (
                              <Check className="w-4 h-4 mx-auto mt-1 text-purple-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Keyboard Navigation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Keyboard className="w-5 h-5 text-purple-600" />
                      Navigation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Show Focus Indicators */}
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <Label className="font-medium text-gray-900 cursor-pointer">
                          Focus Indicators
                        </Label>
                        <p className="text-sm text-gray-600">
                          Show clear focus outlines for keyboard navigation
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateSettings({
                            showFocusIndicators: !settings.showFocusIndicators,
                          })
                        }
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          settings.showFocusIndicators
                            ? "bg-purple-600"
                            : "bg-gray-300"
                        }`}
                        aria-label="Toggle focus indicators"
                        role="switch"
                        aria-checked={settings.showFocusIndicators}
                      >
                        <span
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                            settings.showFocusIndicators ? "translate-x-6" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Footer */}
              <div className="border-t p-4 bg-gray-50 flex gap-3 shrink-0">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save & Close
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
