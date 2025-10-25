"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Mail, Lock, User, Compass } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // GSAP animations when modal opens
  useEffect(() => {
    if (isOpen && formRef.current && logoRef.current) {
      // Animate logo with GSAP
      gsap.fromTo(
        logoRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
        }
      );

      // Animate form fields with stagger
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
          delay: 0.3,
        }
      );
    }
  }, [isOpen, isSignUp]);

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

    // Check if user has completed their profile
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, location")
        .eq("id", data.user.id)
        .single();

      // Check if profile is complete (has name and location)
      const isProfileComplete =
        profile && profile.full_name && profile.location;

      setMessage("Logged in successfully! Redirecting...");

      // Close modal and redirect with full page reload
      onClose();

      setTimeout(() => {
        if (isProfileComplete) {
          window.location.href = "/home";
        } else {
          window.location.href = "/account?onboarding=true";
        }
      }, 300);
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(`Sign up failed: ${error.message}`);
    } else {
      if (
        data.user &&
        data.user.identities &&
        data.user.identities.length === 0
      ) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setMessage(
          "Sign up successful! Please check your email inbox (and spam folder) for a verification link."
        );
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isSignUp) {
      handleSignUp(e);
    } else {
      handleSignIn(e);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setMessage("");
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
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </motion.button>

              {/* Header with animated logo */}
              <div className="pt-8 pb-6 px-8 text-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <div ref={logoRef} className="flex justify-center mb-4">
                  <div className="p-3 bg-emerald-600 dark:bg-emerald-500 rounded-full">
                    <Compass className="w-8 h-8 text-white" />
                  </div>
                </div>
                <motion.h2
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-gray-900 dark:text-gray-50"
                >
                  {isSignUp ? "Join Radius" : "Welcome Back"}
                </motion.h2>
                <motion.p
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-600 dark:text-gray-400 mt-2"
                >
                  {isSignUp
                    ? "Create your account to share skills"
                    : "Sign in to your local skill network"}
                </motion.p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8">
                <div ref={formRef} className="space-y-5">
                  {/* Email Field */}
                  <div className="form-field space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-gray-700 dark:text-gray-300 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="dark:bg-gray-800 dark:text-gray-50 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="form-field space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-gray-700 dark:text-gray-300 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
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
                      className="dark:bg-gray-800 dark:text-gray-50 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Messages */}
                  <AnimatePresence mode="wait">
                    {message && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                      >
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {message}
                        </p>
                      </motion.div>
                    )}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                      >
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.div
                    className="form-field"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 py-6 text-base font-semibold shadow-lg shadow-emerald-500/30"
                    >
                      {loading
                        ? "Processing..."
                        : isSignUp
                        ? "Create Account"
                        : "Sign In"}
                    </Button>
                  </motion.div>

                  {/* Toggle Mode */}
                  <div className="form-field text-center">
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium underline-offset-4 hover:underline"
                    >
                      {isSignUp
                        ? "Already have an account? Sign In"
                        : "Don't have an account? Sign Up"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
