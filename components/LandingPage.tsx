"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, useScroll, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import {
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
  Target,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";

// Register GSAP ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingPage() {
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(() => {
    // If user just logged out, don't show loading state
    if (typeof window !== "undefined") {
      const justLoggedOut = sessionStorage.getItem("just_logged_out");
      if (justLoggedOut) {
        sessionStorage.removeItem("just_logged_out");
        return false;
      }
    }
    return true;
  });
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  // Check if user is already authenticated
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // User is authenticated, redirect to dashboard
        router.push("/dashboard");
        return;
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      // Set loading to false quickly to show landing page
      setLoading(false);
    }
  };

  useEffect(() => {
    // GSAP Hero Animation
    if (heroRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".hero-title", {
          y: 100,
          opacity: 0,
          duration: 1,
          ease: "power4.out",
        });

        gsap.from(".hero-subtitle", {
          y: 50,
          opacity: 0,
          duration: 1,
          delay: 0.3,
          ease: "power4.out",
        });

        gsap.from(".hero-buttons", {
          y: 30,
          opacity: 0,
          duration: 1,
          delay: 0.6,
          ease: "power4.out",
        });

        gsap.from(".floating-circle", {
          scale: 0,
          opacity: 0,
          duration: 1.5,
          stagger: 0.2,
          ease: "elastic.out(1, 0.5)",
        });
      }, heroRef);

      return () => ctx.revert();
    }
  }, []);

  useEffect(() => {
    // GSAP Feature Cards Animation
    if (featuresRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".feature-card", {
          scrollTrigger: {
            trigger: ".feature-card",
            start: "top 80%",
          },
          y: 100,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
        });
      }, featuresRef);

      return () => ctx.revert();
    }
  }, []);

  const features = [
    {
      icon: MapPin,
      title: "Hyperlocal Discovery",
      description:
        "Find skilled professionals within your exact neighborhood radius.",
      color: "bg-blue-500",
    },
    {
      icon: Users,
      title: "Community First",
      description:
        "Build trust with neighbors and strengthen your local community.",
      color: "bg-emerald-500",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Matching",
      description:
        "Get personalized service recommendations based on your interests.",
      color: "bg-purple-500",
    },
    {
      icon: Shield,
      title: "Verified Profiles",
      description:
        "Connect with confidence through our secure authentication system.",
      color: "bg-orange-500",
    },
    {
      icon: Zap,
      title: "Instant Booking",
      description:
        "Book services in seconds and start chatting with providers right away.",
      color: "bg-pink-500",
    },
    {
      icon: Target,
      title: "Skill Monetization",
      description:
        "Turn your talents into income by offering services to your neighbors.",
      color: "bg-teal-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity, scale }}
        className="relative min-h-screen flex items-center justify-center px-4 py-20"
      >
        {/* Animated Background Circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-circle absolute top-20 left-10 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />
          <div className="floating-circle absolute top-40 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="floating-circle absolute bottom-20 left-1/3 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            className="flex justify-center mb-8"
          >
            <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
              <Image
                src="/logo.png"
                alt="Radius Logo"
                width={80}
                height={80}
                className="rounded-2xl object-cover"
              />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="hero-title text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            Discover Skills in{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Your Radius
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Connect with talented neighbors, share your skills, and build a
            thriving local community. All within walking distance.
          </p>

          {/* CTA Buttons */}
          <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setIsAuthModalOpen(true)}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl shadow-emerald-500/50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setIsAuthModalOpen(true)}
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-semibold border-2 border-gray-300 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500"
              >
                Sign In
              </Button>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {[
              { value: "10K+", label: "Active Users" },
              { value: "500+", label: "Skills Shared" },
              { value: "50+", label: "Cities" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        className="relative py-32 px-4 bg-white dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Why Choose Radius?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300"
            >
              Everything you need to connect with your local community
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div
                  className={`${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-12 md:p-16 shadow-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Connect?
            </h2>
            <p className="text-xl text-emerald-50 mb-8">
              Join thousands of neighbors already sharing skills on Radius
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setIsAuthModalOpen(true)}
                size="lg"
                className="bg-white text-emerald-600 hover:bg-gray-100 px-10 py-6 text-lg font-semibold shadow-xl"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Radius Logo"
              width={48}
              height={48}
              className="rounded-lg object-cover"
            />
          </div>
          <p className="text-gray-400">
            © 2025 Radius. Building stronger communities, one skill at a time.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
