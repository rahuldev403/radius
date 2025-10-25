"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { XCircle, ArrowRight, RefreshCw, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function VerifyErrorPage() {
  const router = useRouter();
  const errorIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate error icon with GSAP
    if (errorIconRef.current) {
      gsap.fromTo(
        errorIconRef.current,
        { scale: 0, rotation: 180 },
        {
          scale: 1,
          rotation: 0,
          duration: 0.8,
          ease: "back.out(2)",
        }
      );

      // Shake animation
      gsap.to(errorIconRef.current, {
        x: [-10, 10, -10, 10, 0],
        duration: 0.5,
        delay: 0.8,
        ease: "power2.inOut",
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-red-950 flex items-center justify-center p-4 overflow-hidden relative">
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
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-red-400/10 rounded-full blur-3xl"
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
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-orange-400/10 rounded-full blur-3xl"
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
          <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl">
            <Compass className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* Error Icon */}
        <div ref={errorIconRef} className="flex justify-center mb-6">
          <div className="relative">
            <XCircle className="w-24 h-24 text-red-500" strokeWidth={2} />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
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
          Verification Failed
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-gray-600 dark:text-gray-300 mb-8"
        >
          We couldn't verify your email. The link may have expired or is
          invalid. Please try again or contact support if the problem persists.
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
              onClick={() => router.push("/")}
              size="lg"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-semibold shadow-lg shadow-red-500/30"
            >
              Try Again
              <RefreshCw className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => router.push("/")}
              size="lg"
              variant="outline"
              className="w-full py-6 text-lg font-semibold border-2"
            >
              Back to Home
              <ArrowRight className="ml-2 w-5 h-5" />
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
            Need help? Contact our support team at{" "}
            <a
              href="mailto:support@radius.app"
              className="text-red-600 dark:text-red-400 hover:underline"
            >
              support@radius.app
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
