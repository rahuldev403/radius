"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { SignIn, SignUp } from "@clerk/nextjs";
import { useState } from "react";
import Image from "next/image";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </motion.button>

              <div className="pt-8 pb-6 px-8 text-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <Image
                      src="/logo.png"
                      alt="Radius Logo"
                      width={64}
                      height={64}
                      className="rounded-lg"
                      style={{ width: "64px", height: "auto" }}
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {isSignUp ? "Join Radius" : "Welcome Back"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {isSignUp
                    ? "Create your account to share skills"
                    : "Sign in to your local skill network"}
                </p>
              </div>

              <div className="p-8">
                <div className="flex justify-center">
                  {isSignUp ? (
                    <SignUp
                      appearance={{
                        elements: {
                          formButtonPrimary: 
                            "bg-emerald-600 hover:bg-emerald-700 text-sm normal-case",
                          card: "shadow-none",
                          rootBox: "w-full",
                          footer: "hidden",
                        },
                      }}
                      redirectUrl="/dashboard"
                    />
                  ) : (
                    <SignIn
                      appearance={{
                        elements: {
                          formButtonPrimary: 
                            "bg-emerald-600 hover:bg-emerald-700 text-sm normal-case",
                          card: "shadow-none",
                          rootBox: "w-full",
                          footer: "hidden",
                        },
                      }}
                      redirectUrl="/dashboard"
                    />
                  )}
                </div>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium underline-offset-4 hover:underline"
                  >
                    {isSignUp
                      ? "Already have an account? Sign In"
                      : "Do not have an account? Sign Up"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
