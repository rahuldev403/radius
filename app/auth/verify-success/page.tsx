"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { CheckCircle, ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function VerifySuccessPage() {
  const router = useRouter();
  const checkIconRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    // Check if user profile is already complete
    const checkProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, location")
          .eq("id", user.id)
          .single();

        // Check if profile is complete (has name and location)
        const isProfileComplete =
          profile && profile.full_name && profile.location;

        if (isProfileComplete) {
          // Profile is already complete, redirect to home
          setTimeout(() => {
            window.location.href = "/home";
          }, 2000); // Show success message briefly before redirecting
          return;
        }
      }

      setIsCheckingProfile(false);
    };

    checkProfile();

    // Animate check icon with GSAP
    if (checkIconRef.current) {
      gsap.fromTo(
        checkIconRef.current,
        { scale: 0, rotation: -180 },
        {
          scale: 1,
          rotation: 0,
          duration: 0.8,
          ease: "back.out(2)",
        }
      );
    }

    // Create confetti effect
    if (confettiRef.current) {
      const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];

      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement("div");
        confetti.className = "absolute w-2 h-2 rounded-full";
        confetti.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = "50%";
        confetti.style.top = "50%";
        confettiRef.current.appendChild(confetti);

        gsap.to(confetti, {
          x: (Math.random() - 0.5) * 1000,
          y: (Math.random() - 0.5) * 1000,
          opacity: 0,
          duration: 2 + Math.random(),
          ease: "power2.out",
          onComplete: () => confetti.remove(),
        });
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Confetti Container */}
      <div ref={confettiRef} className="absolute inset-0 pointer-events-none" />

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-emerald-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-teal-400/10 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl">
            <Compass className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* Success Icon */}
        <div ref={checkIconRef} className="flex justify-center mb-6">
          <div className="relative">
            <CheckCircle
              className="w-24 h-24 text-emerald-500"
              strokeWidth={2}
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl"
            />
          </div>
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
        >
          Email Verified! 🎉
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-gray-600 dark:text-gray-300 mb-8"
        >
          Your email has been successfully verified. Welcome to Radius! You can
          now explore and connect with your local community.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => router.push("/account?onboarding=true")}
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-semibold shadow-lg shadow-emerald-500/30"
            >
              Complete Your Profile
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => router.push("/home")}
              size="lg"
              variant="outline"
              className="w-full py-6 text-lg font-semibold border-2"
            >
              Skip for Now
            </Button>
          </motion.div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Next step: Complete your profile to start sharing your skills or
            finding services in your neighborhood.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
