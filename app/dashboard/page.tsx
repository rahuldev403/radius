"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/use-translation";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ProfileModal } from "@/components/ProfileModal";
import { CreateServiceModal } from "@/components/CreateServiceModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Edit,
  DollarSign,
  Clock,
  Coins,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeServices: 0,
    rating: 0,
    completedSessions: 0,
    totalEarnings: 0,
    totalMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);

  useEffect(() => {
    if (isLoaded) {
      checkUser();
    }
  }, [isLoaded, clerkUser]);

  const checkUser = async () => {
    try {
      if (!clerkUser) {
        router.push("/");
        return;
      }

      // Fetch or create profile in Supabase using Clerk user ID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", clerkUser.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        // Profile doesn't exist, create it
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            full_name: clerkUser.fullName || "",
            avatar_url: clerkUser.imageUrl || "",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating profile:", insertError);
          toast.error("Failed to create profile");
          return;
        }

        setUser(newProfile);

        // If profile was just created, show onboarding
        if (!newProfile?.location || !newProfile?.full_name) {
          router.push("/account?onboarding=true");
          return;
        }
      } else if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast.error("Failed to load profile");
        return;
      } else {
        setUser(profile);

        // Check if profile is incomplete
        if (!profile?.location || !profile?.full_name) {
          router.push("/account?onboarding=true");
          return;
        }
      }

      // Fetch user stats
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .or(`provider_id.eq.${clerkUser.id},seeker_id.eq.${clerkUser.id}`);

      const { data: services } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", clerkUser.id);

      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", clerkUser.id);

      const { data: messages } = await supabase
        .from("messages")
        .select("id")
        .or(`sender_id.eq.${clerkUser.id},receiver_id.eq.${clerkUser.id}`);

      const avgRating = reviews?.length
        ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
          reviews.length
        : 0;

      const completedBookings =
        bookings?.filter((b: any) => b.status === "completed") || [];
      const totalEarnings = completedBookings.reduce(
        (sum: number, b: any) => sum + (b.total_price || 0),
        0
      );

      setStats({
        totalBookings: bookings?.length || 0,
        activeServices: services?.length || 0,
        rating: avgRating,
        completedSessions: completedBookings.length,
        totalEarnings,
        totalMessages: messages?.length || 0,
      });

      // Calculate badges based on achievements
      const badges: string[] = [];
      if (completedBookings.length >= 10) badges.push("Expert");
      if (avgRating >= 4.5) badges.push("Top Rated");
      if (services && services.length >= 5) badges.push("Multi-Talented");
      if (completedBookings.length >= 1) badges.push("Getting Started");
      if (profile?.credits >= 100) badges.push("Wealthy");

      setUserBadges(badges);

      const hasCompletedTour = localStorage.getItem("tourCompleted");
      if (!hasCompletedTour && profile) {
        setShowTour(true);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Function to get badge tier based on credits
  const getBadgeTier = (credits: number) => {
    if (credits >= 1000)
      return { image: "/4th.png", tier: "4th", name: "Platinum" };
    if (credits >= 500) return { image: "/3rd.png", tier: "3rd", name: "Gold" };
    if (credits >= 250)
      return { image: "/2nd.png", tier: "2nd", name: "Silver" };
    if (credits >= 100)
      return { image: "/1st.png", tier: "1st", name: "Bronze" };
    return null;
  };

  const userCredits = user?.credits || 0;
  const badgeTier = getBadgeTier(userCredits);

  const features = [
    {
      icon: MapPin,
      title: "Explore Services",
      description:
        "Find skilled professionals near you using our interactive map",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-950/30",
      action: () => router.push("/home"),
    },
    {
      icon: Calendar,
      title: "Manage Bookings",
      description: "View and manage your service bookings and appointments",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950/30",
      action: () => router.push("/my-bookings"),
    },
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Communicate instantly with service providers",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-950/30",
      action: () => router.push("/my-bookings"),
    },
    {
      icon: Video,
      title: "Video Calls",
      description: "Connect face-to-face with integrated video calling",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-950/30",
      action: () => router.push("/my-bookings"),
    },
    {
      icon: Star,
      title: "Reviews & Ratings",
      description: "Build trust with authentic reviews and ratings",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-950/30",
      action: () => router.push("/account"),
    },
    {
      icon: Zap,
      title: "AI Recommendations",
      description: "Get personalized service suggestions powered by AI",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-950/30",
      action: () => router.push("/home"),
    },
  ];

  const quickActions = [
    {
      title: "Create Service",
      description: "Offer your skills",
      icon: Target,
      color: "from-emerald-500 to-teal-500",
      action: () => setIsCreateModalOpen(true),
    },
    {
      title: "Explore Map",
      description: "Find local talent",
      icon: MapPin,
      color: "from-blue-500 to-cyan-500",
      action: () => router.push("/home"),
    },
    {
      title: "View Bookings",
      description: "Manage appointments",
      icon: Calendar,
      color: "from-purple-500 to-pink-500",
      action: () => router.push("/my-bookings"),
    },
    {
      title: "Messages",
      description: "Chat with members",
      icon: MessageSquare,
      color: "from-pink-500 to-rose-500",
      action: () => router.push("/home"),
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

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      trend: "+12%",
    },
    {
      title: "Active Services",
      value: stats.activeServices,
      icon: Target,
      color: "from-emerald-500 to-teal-500",
      trend: "+5%",
    },
    {
      title: "Average Rating",
      value: stats.rating.toFixed(1),
      icon: Star,
      color: "from-yellow-500 to-orange-500",
      trend: "+0.3",
    },
    {
      title: "Completed Sessions",
      value: stats.completedSessions,
      icon: Award,
      color: "from-purple-500 to-pink-500",
      trend: "+8%",
    },
    {
      title: "Total Earnings",
      value: `$${stats.totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      trend: "+15%",
    },
    {
      title: "Messages",
      value: stats.totalMessages,
      icon: MessageSquare,
      color: "from-pink-500 to-rose-500",
      trend: "+20%",
    },
  ];

  const getBadgeColor = (badge: string) => {
    const colors: { [key: string]: string } = {
      Expert: "bg-purple-100 text-purple-700 border-purple-300",
      "Top Rated": "bg-yellow-100 text-yellow-700 border-yellow-300",
      "Multi-Talented": "bg-blue-100 text-blue-700 border-blue-300",
      "Getting Started": "bg-green-100 text-green-700 border-green-300",
      Wealthy: "bg-orange-100 text-orange-700 border-orange-300",
    };
    return colors[badge] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getBadgeIcon = (badge: string) => {
    const icons: { [key: string]: any } = {
      Expert: Award,
      "Top Rated": Star,
      "Multi-Talented": Sparkles,
      "Getting Started": Target,
      Wealthy: DollarSign,
    };
    return icons[badge] || Award;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const tourSteps = [
    {
      title: "Welcome to Radius",
      description:
        "Your all-in-one skill-sharing platform where you can discover local services, book appointments, and connect with talented professionals. Let's explore what makes Radius special!",
      icon: <Sparkles className="w-10 h-10 text-emerald-600" />,
    },
    {
      title: "Interactive Map Discovery",
      description:
        "Find skilled professionals near you using our powerful geolocation map. Filter by distance, category, and see real-time availability. Never miss a nearby service again!",
      icon: <MapPin className="w-10 h-10 text-blue-600" />,
      action: {
        label: "Explore Map",
        onClick: () => {
          localStorage.setItem("tourCompleted", "true");
          router.push("/home");
        },
      },
    },
    {
      title: "Smart Booking System",
      description:
        "Book sessions with just a few clicks. Manage all your appointments in one place, check availability, and get instant confirmation. Stay organized with our calendar integration.",
      icon: <Calendar className="w-10 h-10 text-purple-600" />,
      action: {
        label: "View My Bookings",
        onClick: () => router.push("/my-bookings"),
      },
    },
    {
      title: "Real-time Chat & Video",
      description:
        "Chat instantly with service providers using our built-in messaging system. Schedule video calls for consultations or remote sessions - all within the platform!",
      icon: <MessageSquare className="w-10 h-10 text-green-600" />,
    },
    {
      title: "Credit System & Rewards",
      description:
        "Earn credits by providing services, completing bookings, and helping others. Use credits to book services or give them as tips. Build your reputation and unlock badges!",
      icon: <Coins className="w-10 h-10 text-amber-600" />,
      action: {
        label: "View My Credits",
        onClick: () => router.push("/credits"),
      },
    },
    {
      title: "Community Projects",
      description:
        "Join collaborative community projects! Work with others on shared goals, contribute your skills, and make a difference in your local community.",
      icon: <Users className="w-10 h-10 text-indigo-600" />,
      action: {
        label: "Browse Projects",
        onClick: () => router.push("/projects"),
      },
    },
    {
      title: "Build Your Profile",
      description:
        "Create your professional profile, showcase your skills, and earn reviews. The better your rating, the more opportunities come your way. Start building your reputation today!",
      icon: <Star className="w-10 h-10 text-yellow-600" />,
      action: {
        label: "Edit My Profile",
        onClick: () => {
          setIsProfileModalOpen(true);
          setShowTour(false);
          localStorage.setItem("tourCompleted", "true");
        },
      },
    },
    {
      title: "Offer Your Services",
      description:
        "Ready to earn? Create your first service listing! Set your rates, availability, and service areas. Share your talents and start making money in your community.",
      icon: <Target className="w-10 h-10 text-rose-600" />,
      action: {
        label: "Create Service",
        onClick: () => {
          localStorage.setItem("tourCompleted", "true");
          setShowTour(false);
          setIsCreateModalOpen(true);
        },
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-4 md:p-6">
      {/* Onboarding Tour */}
      {showTour && (
        <OnboardingTour
          steps={tourSteps}
          onComplete={() => {
            setShowTour(false);
            localStorage.setItem("tourCompleted", "true");
            toast.success("Welcome aboard! You're all set to explore Radius.");
          }}
          onSkip={() => {
            setShowTour(false);
            localStorage.setItem("tourCompleted", "true");
            toast.info(
              "Tour skipped! You can ask the AI chatbot anytime for help."
            );
          }}
        />
      )}

      <div className="pt-4 sm:pt-6 lg:pt-10 pb-8 sm:pb-10 lg:pb-12 px-3 sm:px-4 lg:px-8 max-w-7xl mx-auto">
        {/* Hero Banner with Video */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl">
            {/* Background Video */}
            <video autoPlay loop muted playsInline className="w-full h-auto">
              <source src="/banner.mp4" type="video/mp4" />
            </video>
          </div>
        </motion.div>

        {/* User Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <Card className="glass-card border-0 overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
                {/* Avatar with Badge Overlay */}
                <div className="relative">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-emerald-500 shadow-xl">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="text-xl sm:text-2xl font-bold bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                      {user?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Badge Tier Overlay */}
                  {badgeTier && (
                    <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 z-10">
                      <div className="relative group">
                        <Image
                          src={badgeTier.image}
                          alt={`${badgeTier.name} Badge`}
                          width={40}
                          height={40}
                          className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-2xl animate-pulse hover:animate-none transition-all hover:scale-110"
                        />
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-lg whitespace-nowrap shadow-xl">
                            {badgeTier.name} - {userCredits} Credits
                          </div>
                          <div className="w-2 h-2 bg-slate-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Online Status Indicator */}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                      {user?.full_name || "User"}
                    </h2>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {userBadges.map((badge) => {
                        const BadgeIcon = getBadgeIcon(badge);
                        return (
                          <Badge
                            key={badge}
                            className={`${getBadgeColor(
                              badge
                            )} border px-3 py-1`}
                          >
                            <BadgeIcon className="w-3 h-3 mr-1" />
                            {badge}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mb-3">
                    {user?.bio || "No bio yet"}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 justify-center md:justify-start">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>Your Neighborhood</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">
                        {stats.rating.toFixed(1)}
                      </span>
                      <span>rating</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{stats.completedSessions} completed</span>
                    </div>
                    {badgeTier && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-bold shadow-lg">
                        <Coins className="w-4 h-4" />
                        <span>{userCredits} Credits</span>
                        <span className="text-xs opacity-90">
                          ({badgeTier.name})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Button */}
                <Button
                  onClick={() => setIsProfileModalOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {t("editProfile")}
                </Button>
              </div>

              {/* Badge Tier Progress Bar */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Badge Tier Progress
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {badgeTier ? badgeTier.name : "No Badge"} Level
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {[
                    {
                      image: "/1st.png",
                      name: "Bronze",
                      min: 100,
                      color: "from-orange-400 to-amber-600",
                    },
                    {
                      image: "/2nd.png",
                      name: "Silver",
                      min: 250,
                      color: "from-gray-300 to-gray-500",
                    },
                    {
                      image: "/3rd.png",
                      name: "Gold",
                      min: 500,
                      color: "from-yellow-400 to-yellow-600",
                    },
                    {
                      image: "/4th.png",
                      name: "Platinum",
                      min: 1000,
                      color: "from-cyan-400 to-blue-600",
                    },
                  ].map((tier, index) => {
                    const isUnlocked = userCredits >= tier.min;
                    const isCurrent = badgeTier?.image === tier.image;
                    return (
                      <div key={tier.name} className="flex-1 group relative">
                        <div
                          className={`relative transition-all ${
                            isUnlocked
                              ? "opacity-100 scale-100"
                              : "opacity-30 scale-90 grayscale"
                          }`}
                        >
                          <Image
                            src={tier.image}
                            alt={tier.name}
                            width={40}
                            height={40}
                            className={`mx-auto ${
                              isCurrent
                                ? "ring-4 ring-emerald-500 rounded-full animate-pulse"
                                : ""
                            }`}
                            style={{ width: "40px", height: "auto" }}
                          />
                          {/* Mini Tooltip */}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            <div
                              className={`bg-gradient-to-r ${tier.color} text-white text-xs font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap`}
                            >
                              {tier.name}
                              <div className="text-[10px] opacity-90">
                                {tier.min}+ credits
                              </div>
                            </div>
                            <div className="w-2 h-2 bg-gradient-to-r rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                          </div>
                        </div>
                        <p className="text-[10px] text-center mt-1 font-medium text-slate-600 dark:text-slate-400">
                          {tier.min}+
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card border-0 overflow-hidden h-full shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl shadow-lg`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                    >
                      {stat.trend}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`h-1 bg-gradient-to-r ${stat.color} rounded-full mt-4`}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                {t("quickActions")}
              </CardTitle>
              <CardDescription>{t("getFasterShortcuts")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.title}
                    onClick={action.action}
                    className="glass-card p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {action.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card border-0 h-full">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  {t("recentActivity")}
                </CardTitle>
                <CardDescription>{t("yourLatestInteractions")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                    >
                      <div className="text-3xl">{activity.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {activity.description}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity yet</p>
                    <p className="text-sm">
                      Start exploring to see updates here!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Bookings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card border-0 h-full">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  {t("upcomingBookings")}
                </CardTitle>
                <CardDescription>
                  {t("yourScheduledAppointments")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass p-4 rounded-xl"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {booking.service?.title || "Service"}
                        </h4>
                        <Badge className="gradient-primary text-white">
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        With{" "}
                        {booking.service?.provider?.full_name || "Provider"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(booking.booking_time).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(booking.booking_time).toLocaleTimeString()}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming bookings</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => router.push("/home")}
                    >
                      Book a Service
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Platform Features Showcase with Image Placeholders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                {t("platformFeatures")}
              </CardTitle>
              <CardDescription>{t("exploreEverything")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={feature.action}
                    className="glass-card p-6 rounded-2xl cursor-pointer transition-shadow"
                  >
                    {/* Image Placeholder */}
                    <div
                      className={`relative h-32 ${feature.bgColor} rounded-xl mb-4 overflow-hidden flex items-center justify-center`}
                    >
                      <feature.icon
                        className={`w-16 h-16 ${feature.color} z-10`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent"></div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          checkUser(); // Refresh user data after profile update
        }}
        user={clerkUser}
      />
      <CreateServiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
