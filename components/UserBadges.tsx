"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Award, Coins, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type BadgeData = {
  id: number;
  name: string;
  description: string;
  icon: string;
  tier: string;
  color: string;
  credits_required: number;
  earned_at?: string;
};

type UserBadgesProps = {
  userId: string;
  showTitle?: boolean;
  compact?: boolean;
};

const TIER_COLORS = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-gray-400 to-gray-600",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-cyan-400 to-cyan-600",
  diamond: "from-pink-400 to-pink-600",
};

const TIER_BORDERS = {
  bronze: "border-amber-700",
  silver: "border-gray-400",
  gold: "border-yellow-500",
  platinum: "border-cyan-500",
  diamond: "border-pink-500",
};

export function UserBadges({
  userId,
  showTitle = true,
  compact = false,
}: UserBadgesProps) {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCredits, setTotalCredits] = useState(0);

  useEffect(() => {
    fetchUserBadges();
  }, [userId]);

  const fetchUserBadges = async () => {
    try {
      setLoading(true);

      // Fetch user's earned badges
      const { data: badgeAssignments, error: badgesError } = await supabase
        .from("badge_assignments")
        .select(
          `
          earned_at,
          badge:badges (
            id,
            name,
            description,
            icon,
            tier,
            color,
            credits_required
          )
        `
        )
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (badgesError) throw badgesError;

      // Fetch user's total credits received
      const { data: creditsData, error: creditsError } = await supabase
        .from("user_credits")
        .select("total_received")
        .eq("user_id", userId)
        .single();

      if (creditsError && creditsError.code !== "PGRST116") {
        throw creditsError;
      }

      setTotalCredits(creditsData?.total_received || 0);

      // Transform badges data
      const earnedBadges = (badgeAssignments || []).map((assignment: any) => ({
        ...assignment.badge,
        earned_at: assignment.earned_at,
      }));

      setBadges(earnedBadges);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {badges.slice(0, 3).map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`relative group`}
            title={`${badge.name} - ${badge.description}`}
          >
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                TIER_COLORS[badge.tier as keyof typeof TIER_COLORS]
              } flex items-center justify-center text-xl shadow-lg border-2 ${
                TIER_BORDERS[badge.tier as keyof typeof TIER_BORDERS]
              } group-hover:scale-110 transition-transform cursor-help`}
            >
              {badge.icon}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                <p className="font-bold">{badge.name}</p>
                <p className="text-gray-300 mt-1">{badge.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {badges.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{badges.length - 3} more
          </Badge>
        )}
      </div>
    );
  }

  const highestBadge = badges[0]; // Already sorted by earned_at DESC, but we want highest tier

  return (
    <Card className="overflow-hidden border-2">
      {showTitle && (
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Award className="w-5 h-5 text-amber-600" />
            Badges & Achievements
          </CardTitle>
          <CardDescription>
            Recognition for outstanding contributions
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-medium">Total Credits</span>
            </div>
            <p className="text-2xl font-bold text-amber-900">{totalCredits}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Badges Earned</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {badges.length}
            </p>
          </div>
        </div>

        {/* Highest Badge Showcase */}
        {highestBadge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl bg-gradient-to-br ${
              TIER_COLORS[highestBadge.tier as keyof typeof TIER_COLORS]
            } text-white mb-6 shadow-xl border-4 ${
              TIER_BORDERS[highestBadge.tier as keyof typeof TIER_BORDERS]
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-6xl">{highestBadge.icon}</div>
              <div className="flex-1">
                <Badge className="bg-white/20 text-white border-white/30 mb-2">
                  {highestBadge.tier.toUpperCase()}
                </Badge>
                <h3 className="text-2xl font-bold">{highestBadge.name}</h3>
                <p className="text-white/90 text-sm mt-1">
                  {highestBadge.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* All Badges Grid */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            All Achievements ({badges.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div
                  className={`p-4 rounded-xl border-2 ${
                    TIER_BORDERS[badge.tier as keyof typeof TIER_BORDERS]
                  } bg-gradient-to-br ${
                    TIER_COLORS[badge.tier as keyof typeof TIER_COLORS]
                  }/10 hover:scale-105 transition-all cursor-help shadow-sm hover:shadow-md`}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {badge.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {badge.credits_required.toLocaleString()} credits
                  </p>
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-48">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
                    <p className="font-bold">{badge.name}</p>
                    <p className="text-gray-300 mt-1">{badge.description}</p>
                    <p className="text-gray-400 text-xs mt-2">
                      Earned:{" "}
                      {badge.earned_at
                        ? new Date(badge.earned_at).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
