"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
  Target,
  Shield,
  Zap,
  Star,
  TrendingUp,
  Clock,
  Award,
  MessageCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Play,
  Check,
  FileText,
  Compass,
  Handshake,
  UserCircle,
  Palette,
  GraduationCap,
  Dumbbell,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Register GSAP ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingPage() {
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      const justLoggedOut = sessionStorage.getItem("just_logged_out");
      if (justLoggedOut) {
        sessionStorage.removeItem("just_logged_out");
        return false;
      }
    }
    return true;
  });

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentFeature, setCurrentFeature] = useState(0);

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  // Removed opacity transform that was hiding content
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.98]);
  const y = useTransform(scrollYProgress, [0, 0.3], [0, 20]);

  // Check authentication
  useEffect(() => {
    if (typeof window !== "undefined") {
      const justLoggedOut = sessionStorage.getItem("just_logged_out");
      if (justLoggedOut) {
        sessionStorage.removeItem("just_logged_out");
        setLoading(false);
        return;
      }
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push("/dashboard");
        return;
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hero animations
  useEffect(() => {
    if (heroRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".hero-title", {
          y: 100,
          opacity: 0,
          duration: 1.2,
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
          duration: 0.8,
          delay: 0.6,
          ease: "power4.out",
        });

        gsap.from(".floating-orb", {
          scale: 0,
          opacity: 0,
          duration: 2,
          stagger: 0.3,
          ease: "elastic.out(1, 0.5)",
        });
      }, heroRef);

      return () => ctx.revert();
    }
  }, []);

  // Feature cards animation
  useEffect(() => {
    if (featuresRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".feature-card", {
          scrollTrigger: {
            trigger: ".feature-card",
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play none none reverse",
          },
          y: 100,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        });
      }, featuresRef);

      return () => ctx.revert();
    }
  }, []);

  // Stats animation
  useEffect(() => {
    if (statsRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".stat-card", {
          scrollTrigger: {
            trigger: ".stat-card",
            start: "top 85%",
          },
          scale: 0.8,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
        });
      }, statsRef);

      return () => ctx.revert();
    }
  }, []);

  const features = [
    {
      icon: MapPin,
      title: "Hyperlocal Discovery",
      description:
        "Find skilled professionals within your exact neighborhood radius using AI-powered location matching.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Users,
      title: "Community First",
      description:
        "Build trust with neighbors and strengthen your local community through verified connections.",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Matching",
      description:
        "Get personalized service recommendations based on your interests and location preferences.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Shield,
      title: "Verified Profiles",
      description:
        "Connect with confidence through our secure authentication and review system.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Zap,
      title: "Instant Booking",
      description:
        "Book services in seconds and start chatting with providers right away through real-time messaging.",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Target,
      title: "Skill Monetization",
      description:
        "Turn your talents into income by offering services to your neighbors with our credit system.",
      color: "from-teal-500 to-green-500",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Graphic Designer",
      content:
        "Radius helped me find clients right in my neighborhood. I've built lasting relationships and my business has grown 3x!",
      rating: 5,
      avatar: Palette,
    },
    {
      name: "Michael Chen",
      role: "Music Teacher",
      content:
        "The best platform for connecting with local students. The booking system is seamless and payments are instant.",
      rating: 5,
      avatar: GraduationCap,
    },
    {
      name: "Emma Davis",
      role: "Personal Trainer",
      content:
        "I love how easy it is to manage my schedule and connect with clients nearby. The community is amazing!",
      rating: 5,
      avatar: Dumbbell,
    },
  ];

  const stats = [
    {
      icon: Users,
      value: "10K+",
      label: "Active Users",
      color: "text-blue-500",
    },
    {
      icon: Star,
      value: "4.9",
      label: "Average Rating",
      color: "text-yellow-500",
    },
    {
      icon: TrendingUp,
      value: "500+",
      label: "Skills Offered",
      color: "text-emerald-500",
    },
    { icon: Award, value: "50+", label: "Cities", color: "text-purple-500" },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Create Your Profile",
      description: "Sign up and showcase your skills or discover local talents",
      icon: FileText,
    },
    {
      step: "2",
      title: "Set Your Radius",
      description: "Choose how far you want to search for services or clients",
      icon: Compass,
    },
    {
      step: "3",
      title: "Connect & Book",
      description: "Message providers and book services instantly",
      icon: MessageCircle,
    },
    {
      step: "4",
      title: "Build Community",
      description: "Leave reviews and earn credits while helping neighbors",
      icon: Handshake,
    },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            Loading your experience...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ scale }}
        className="relative min-h-[90vh] flex items-center justify-center px-4 py-16"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-orb absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-3xl animate-float" />
          <div className="floating-orb absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float" />
          <div className="floating-orb absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" />
        </div>

        <motion.div
          style={{ y }}
          className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 items-center px-4"
        >
          {/* Left Side - Content */}
          <div className="text-center lg:text-left">
            {/* Title */}
            <h1 className="hero-title text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
              Discover Skills in{" "}
              <span className="gradient-text">Your Radius</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl lg:max-w-none leading-relaxed">
              Connect with talented neighbors, share your skills, and build a
              thriving local community.
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {" "}
                All within walking distance.
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-10">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setIsAuthModalOpen(true)}
                  size="lg"
                  className="gradient-primary text-white px-10 py-6 text-lg font-bold shadow-2xl shadow-emerald-500/30 rounded-2xl hover:shadow-emerald-500/50 transition-all duration-300"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setIsAuthModalOpen(true)}
                  size="lg"
                  variant="outline"
                  className="glass-card px-10 py-6 text-lg font-bold border-2 border-emerald-500/50 hover:border-emerald-500 rounded-2xl"
                >
                  Sign In
                </Button>
              </motion.div>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl lg:max-w-none"
              ref={statsRef}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="stat-card glass-card p-4 rounded-xl"
                  whileHover={{ scale: 1.05 }}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Side - Lottie Animation */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex justify-center items-center mt-8 lg:mt-0"
          >
            <div className="w-full max-w-4xl h-[600px]">
              <DotLottieReact
                src="https://lottie.host/7b1d7c56-6ade-43a5-b9a2-a800c03d811d/717uKYeq2G.lottie"
                loop
                autoplay
                className="w-full h-full"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-emerald-500 rounded-full flex justify-center p-2">
            <div className="w-1 h-3 bg-emerald-500 rounded-full" />
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        className="relative py-32 px-4 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block"
            >
              <Badge className="mb-4 px-6 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                Why Choose Radius?
              </Badge>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6"
            >
              Everything You Need to <br />
              <span className="gradient-text">Connect Locally</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
            >
              Powerful features designed to help you build meaningful
              connections in your community
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card border-0 h-full overflow-hidden">
                  <CardContent className="p-8">
                    <div
                      className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-xl`}
                    >
                      <feature.icon className="w-10 h-10 text-white group-hover:rotate-12 transition-transform duration-500 ease-in-out" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-6 flex items-center text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-2 transition-transform">
                      Learn more <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6"
            >
              How It <span className="gradient-text">Works</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-600 dark:text-slate-300"
            >
              Get started in minutes and start connecting with your community
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="glass-card p-8 rounded-3xl text-center h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                    {item.step}
                  </div>
                  <div className="flex justify-center mb-4">
                    <item.icon className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="relative py-32 px-4 bg-white dark:bg-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6"
            >
              Loved by <span className="gradient-text">Our Community</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-600 dark:text-slate-300"
            >
              See what our members have to say about Radius
            </motion.p>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="glass-card p-12 rounded-3xl"
              >
                <div className="flex items-center mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map(
                    (_, i) => (
                      <Star
                        key={i}
                        className="w-6 h-6 fill-yellow-400 text-yellow-400"
                      />
                    )
                  )}
                </div>
                <p className="text-2xl text-slate-700 dark:text-slate-300 mb-8 leading-relaxed italic">
                  "{testimonials[currentTestimonial].content}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    {React.createElement(
                      testimonials[currentTestimonial].avatar,
                      {
                        className: "w-8 h-8 text-white",
                      }
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-slate-900 dark:text-white">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {testimonials[currentTestimonial].role}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentTestimonial((prev) =>
                    prev === 0 ? testimonials.length - 1 : prev - 1
                  )
                }
                className="glass-card w-12 h-12 rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTestimonial
                        ? "w-8 bg-gradient-to-r from-emerald-500 to-teal-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentTestimonial((prev) =>
                    prev === testimonials.length - 1 ? 0 : prev + 1
                  )
                }
                className="glass-card w-12 h-12 rounded-full"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-float" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
              Ready to Transform Your
              <br />
              <span className="text-yellow-300">Community Experience?</span>
            </h2>
            <p className="text-2xl text-emerald-50 max-w-3xl mx-auto leading-relaxed">
              Join thousands of neighbors already sharing skills, building
              connections, and earning on Radius. Your community awaits!
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setIsAuthModalOpen(true)}
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-slate-100 px-12 py-7 text-xl font-bold shadow-2xl rounded-2xl"
                >
                  Start Your Journey
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </motion.div>

              <div className="flex items-center gap-4 text-white">
                <div className="flex -space-x-2">
                  {[UserCircle, UserCircle, UserCircle, UserCircle].map(
                    (Icon, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white"
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    )
                  )}
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">10,000+ Members</div>
                  <div className="text-emerald-100 text-sm">Growing daily!</div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-8 pt-12"
            >
              {[
                { icon: Shield, text: "Secure & Private" },
                { icon: Check, text: "100% Free to Join" },
                { icon: Users, text: "Active Community" },
                { icon: Award, text: "Award Winning" },
              ].map((badge, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full"
                >
                  <badge.icon className="w-5 h-5" />
                  <span className="font-medium">{badge.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Radius</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-4">
                Building stronger communities, one skill at a time. Connect with
                talented neighbors and share your expertise locally.
              </p>
              <div className="flex gap-4">
                {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                  <button
                    key={i}
                    className="w-10 h-10 bg-slate-800 hover:bg-emerald-500 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-slate-400">
                {[
                  "About Us",
                  "How It Works",
                  "Features",
                  "Pricing",
                  "Blog",
                ].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                {[
                  "Help Center",
                  "Contact Us",
                  "Privacy Policy",
                  "Terms of Service",
                ].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>
              © 2025 Radius. All rights reserved. Made with ❤️ for communities
              everywhere.
            </p>
          </div>
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
