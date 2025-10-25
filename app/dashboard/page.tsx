"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { OnboardingTour } from "@/components/OnboardingTour";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  MessageSquare,
  Video,
  Star,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  Target,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeServices: 0,
    rating: 0,
    completedSessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setUser(profile);

      // Fetch user stats
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .or(`provider_id.eq.${authUser.id},seeker_id.eq.${authUser.id}`);

      const { data: services } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", authUser.id);

      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", authUser.id);

      const avgRating = reviews?.length
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;

      setStats({
        totalBookings: bookings?.length || 0,
        activeServices: services?.length || 0,
        rating: avgRating,
        completedSessions:
          bookings?.filter((b) => b.status === "completed").length || 0,
      });

      // Check if user needs onboarding
      const hasSeenTour = localStorage.getItem("hasSeenTour");
      if (!hasSeenTour) {
        setShowTour(true);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: MapPin,
      title: "Explore Services",
      description:
        "Find skilled professionals near you using our interactive map",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      action: () => router.push("/home"),
    },
    {
      icon: Calendar,
      title: "Manage Bookings",
      description: "View and manage your service bookings and appointments",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      action: () => router.push("/my-bookings"),
    },
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Communicate instantly with service providers",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      action: () => router.push("/my-bookings"),
    },
    {
      icon: Video,
      title: "Video Calls",
      description: "Connect face-to-face with integrated video calling",
      color: "text-red-600",
      bgColor: "bg-red-100",
      action: () => router.push("/my-bookings"),
    },
    {
      icon: Star,
      title: "Reviews & Ratings",
      description: "Build trust with authentic reviews and ratings",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      action: () => router.push("/account"),
    },
    {
      icon: Zap,
      title: "AI Recommendations",
      description: "Get personalized service suggestions powered by AI",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      action: () => router.push("/home"),
    },
  ];

  const quickActions = [
    {
      label: "Create Service",
      icon: Target,
      variant: "default" as const,
      action: () => router.push("/services/new"),
    },
    {
      label: "Explore Map",
      icon: MapPin,
      variant: "outline" as const,
      action: () => router.push("/home"),
    },
    {
      label: "View Bookings",
      icon: Calendar,
      variant: "outline" as const,
      action: () => router.push("/my-bookings"),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const tourSteps = [
    {
      title: "Welcome to Radius!",
      description:
        "Your all-in-one skill-sharing platform. Discover services, book appointments, and connect with professionals in your area. Let's take a quick tour!",
      icon: <Sparkles className="w-10 h-10 text-emerald-600" />,
    },
    {
      title: "Explore the Map",
      description:
        "Find skilled professionals near you using our interactive geolocation map. Filter by radius and see real-time availability.",
      icon: <MapPin className="w-10 h-10 text-blue-600" />,
      action: {
        label: "Open Map Now",
        onClick: () => {
          localStorage.setItem("hasSeenTour", "true");
          router.push("/home");
        },
      },
    },
    {
      title: "Book & Manage",
      description:
        "Easily book sessions, chat with providers, and even join video calls directly from your bookings page. Stay organized with your schedule.",
      icon: <Calendar className="w-10 h-10 text-purple-600" />,
    },
    {
      title: "Real-time Communication",
      description:
        "Chat instantly with service providers and clients. Share details, discuss requirements, and coordinate seamlessly.",
      icon: <MessageSquare className="w-10 h-10 text-green-600" />,
    },
    {
      title: "Build Your Reputation",
      description:
        "Earn reviews and ratings. Create your own services and start earning by sharing your skills with your community.",
      icon: <Star className="w-10 h-10 text-yellow-600" />,
      action: {
        label: "Create Your First Service",
        onClick: () => {
          localStorage.setItem("hasSeenTour", "true");
          router.push("/services/new");
        },
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navbar />

      {/* Onboarding Tour */}
      {showTour && (
        <OnboardingTour
          steps={tourSteps}
          onComplete={() => {
            setShowTour(false);
            localStorage.setItem("hasSeenTour", "true");
            toast.success("Welcome aboard! Let's explore Radius together.");
          }}
          onSkip={() => {
            setShowTour(false);
            localStorage.setItem("hasSeenTour", "true");
            toast.info("You can always find help in the AI chatbot!");
          }}
        />
      )}

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              Welcome back, {user?.full_name}!
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Your Skill Sharing Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect, collaborate, and grow with professionals in your area
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {[
            {
              label: "Total Bookings",
              value: stats.totalBookings,
              icon: Calendar,
              color: "emerald",
            },
            {
              label: "Active Services",
              value: stats.activeServices,
              icon: Target,
              color: "blue",
            },
            {
              label: "Average Rating",
              value: stats.rating.toFixed(1),
              icon: Star,
              color: "yellow",
            },
            {
              label: "Completed",
              value: stats.completedSessions,
              icon: Award,
              color: "purple",
            },
          ].map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                size="lg"
                onClick={action.action}
                className="flex items-center gap-2"
              >
                <action.icon className="w-5 h-5" />
                {action.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Explore Features
            </h2>
            {showTour && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTour(false);
                  localStorage.setItem("hasSeenTour", "true");
                  toast.success(
                    "Tour dismissed! You can always explore features anytime."
                  );
                }}
              >
                Skip Tour
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                  onClick={feature.action}
                >
                  <CardHeader>
                    <div
                      className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {feature.title}
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Getting Started Banner */}
        {stats.totalBookings === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      Ready to Get Started?
                    </h3>
                    <p className="text-emerald-50">
                      Create your first service or explore what others are
                      offering nearby!
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => router.push("/services/new")}
                      className="bg-white text-emerald-600 hover:bg-gray-100"
                    >
                      Create Service
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push("/home")}
                      className="border-white text-white hover:bg-white/10"
                    >
                      Explore Map
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
