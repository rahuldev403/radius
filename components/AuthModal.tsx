"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Demo credentials for hackathon
const DEMO_ACCOUNTS = [
  {
    email: "rahuls.403.dev@gmail.com",
    password: "rahul1234",
    label: "Sign in as Admin Demo 1",
  },
  {
    email: "pjlv1007@gmail.com",
    password: "123456",
    label: "Sign in as Admin Demo 2",
  },
];

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<number | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && formRef.current) {
      const inputs = formRef.current.querySelectorAll(".form-field");
      gsap.fromTo(
        inputs,
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
        }
      );
    }
  }, [isOpen]);

  const handleDemoSelect = (index: number) => {
    setSelectedDemo(index);
    setEmail(DEMO_ACCOUNTS[index].email);
    setPassword(DEMO_ACCOUNTS[index].password);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(`Sign in failed: ${error.message}`);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, location")
        .eq("id", data.user.id)
        .single();

      const isProfileComplete =
        profile && profile.full_name && profile.location;

      setMessage("Logged in successfully! Redirecting...");

      onClose();

      setTimeout(() => {
        if (isProfileComplete) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/account?onboarding=true";
        }
      }, 300);
    }

    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
              </motion.button>

              <div className="flex flex-col md:grid md:grid-cols-2 gap-0 overflow-y-auto h-full">
                {/* Left Side - Login Form */}
                <div className="p-4 sm:p-6 md:p-8 lg:p-12 shrink-0">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                      Welcome to Radius
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Sign in to access the demo
                    </p>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4 sm:space-y-6">
                    <div ref={formRef} className="space-y-3 sm:space-y-5">
                      {/* Demo Account Selector */}
                      <div className="form-field space-y-2 sm:space-y-3">
                        <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium">
                          Quick Demo Access
                        </Label>
                        {DEMO_ACCOUNTS.map((account, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 sm:space-x-3"
                          >
                            <input
                              type="checkbox"
                              id={`demo-${index}`}
                              checked={selectedDemo === index}
                              onChange={() => handleDemoSelect(index)}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                            />
                            <label
                              htmlFor={`demo-${index}`}
                              className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                            >
                              {account.label}
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="form-field space-y-1.5 sm:space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-gray-700 dark:text-gray-300 flex items-center gap-2 text-xs sm:text-sm"
                        >
                          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="dark:bg-gray-800 dark:text-gray-50 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base h-10 sm:h-auto"
                        />
                      </div>

                      <div className="form-field space-y-1.5 sm:space-y-2">
                        <Label
                          htmlFor="password"
                          className="text-gray-700 dark:text-gray-300 flex items-center gap-2 text-xs sm:text-sm"
                        >
                          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="dark:bg-gray-800 dark:text-gray-50 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base h-10 sm:h-auto"
                        />
                      </div>

                      <AnimatePresence mode="wait">
                        {message && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 shrink-0" />
                            <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                              {message}
                            </p>
                          </motion.div>
                        )}
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
                          >
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 shrink-0" />
                            <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
                              {error}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.div
                        className="form-field"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 py-5 sm:py-6 text-sm sm:text-base font-semibold shadow-lg shadow-emerald-500/30"
                        >
                          {loading ? "Signing in..." : "Sign In"}
                        </Button>
                      </motion.div>
                    </div>
                  </form>
                </div>

                {/* Right Side - Message for Testers */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-4 sm:p-6 md:p-8 flex flex-col flex-1 md:max-h-[600px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-3 sm:space-y-4 pr-1 sm:pr-2">
                    <div className="w-full h-24 sm:h-32 rounded-lg flex items-center justify-center shrink-0">
                      {/* Lottie Animation */}
                      <DotLottieReact
                        src="https://lottie.host/495860a0-605a-459e-8dc3-0232659b5d43/R5rTiRS8KA.lottie"
                        loop
                        autoplay
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>

                    <div className="space-y-2.5 sm:space-y-3">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50">
                        Welcome, Tester! 👋
                      </h3>

                      <div className="space-y-2 sm:space-y-2.5 text-gray-700 dark:text-gray-300">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 sm:p-3 rounded-lg border-l-4 border-emerald-500 animate-pulse">
                          <p className="text-[10px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-200">
                            ⚠️ Select any of the 2 demo accounts above to
                            auto-fill!
                          </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/30 p-2 sm:p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-[10px] sm:text-xs font-semibold text-blue-800 dark:text-blue-200 mb-0.5 sm:mb-1">
                            🧪 Testing User Interactivity
                          </p>
                          <p className="text-[9px] sm:text-[11px] leading-relaxed text-blue-700 dark:text-blue-300">
                            We've provided 2 demo accounts to test user
                            interactions. Try signing in with different accounts
                            to explore how users interact with each other's
                            profiles, services, and bookings!
                          </p>
                        </div>

                        <p className="text-[10px] sm:text-xs leading-relaxed">
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            Quick heads-up:
                          </strong>{" "}
                          We encountered authentication challenges during
                          deployment, so we've set up demo accounts for seamless
                          testing.
                        </p>

                        <div className="bg-white/50 dark:bg-gray-800/50 p-2 sm:p-3 rounded-lg space-y-1 sm:space-y-1.5">
                          <p className="text-[10px] sm:text-xs font-medium">How to access:</p>
                          <ol className="text-[9px] sm:text-[11px] space-y-0.5 list-decimal list-inside leading-relaxed">
                            <li className="font-bold text-emerald-600 dark:text-emerald-400">
                              ✓ Click the checkbox above (auto-fills
                              credentials)
                            </li>
                            <li>Click "Sign In"</li>
                            <li>Explore all features!</li>
                          </ol>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-2 sm:p-3 rounded-lg border border-emerald-500/30">
                          <p className="text-[10px] sm:text-xs font-medium text-emerald-800 dark:text-emerald-200">
                            💡 All features are fully functional. We're excited
                            to show you what we've built!
                          </p>
                        </div>

                        <p className="text-[9px] sm:text-[11px] text-gray-600 dark:text-gray-400 italic text-center">
                          Thank you for testing Radius! 🎉
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
