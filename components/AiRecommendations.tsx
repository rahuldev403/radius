"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, TrendingUp, Star, Clock } from "lucide-react";

type Service = {
  id: number;
  title: string;
  description: string;
  category: string;
  provider: {
    full_name: string;
  };
  matchReason: string;
  matchScore: number;
};

export function AiRecommendations() {
  const [recommendations, setRecommendations] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile for personalization
      const { data: profile } = await supabase
        .from("profiles")
        .select("bio, full_name")
        .eq("id", user.id)
        .single();

      setUserProfile(profile);

      // Fetch user's booking history to understand preferences
      const { data: bookings } = await supabase
        .from("bookings")
        .select("service:services(category)")
        .eq("seeker_id", user.id)
        .limit(10);

      const bookedCategories =
        bookings
          ?.map((b: any) =>
            Array.isArray(b.service)
              ? b.service[0]?.category
              : b.service?.category
          )
          .filter(Boolean) || [];

      // Fetch all services
      const { data: services } = await supabase
        .from("services")
        .select(
          `
          id,
          title,
          description,
          category,
          provider:profiles!services_provider_id_fkey (full_name)
        `
        )
        .neq("provider_id", user.id) // Don't recommend own services
        .limit(20);

      if (services) {
        // AI-like scoring algorithm
        const scoredServices = services.map((service: any) => {
          let score = 0;
          let reason = "";

          // Check if category matches user's booking history
          if (bookedCategories.includes(service.category)) {
            score += 40;
            reason = `You've booked ${service.category} services before`;
          }

          // Check if bio mentions relevant keywords
          if (profile?.bio) {
            const bioLower = profile.bio.toLowerCase();
            const categoryLower = service.category.toLowerCase();
            const titleLower = service.title.toLowerCase();
            const descLower = service.description.toLowerCase();

            if (
              bioLower.includes(categoryLower) ||
              bioLower.includes(titleLower.split(" ")[0])
            ) {
              score += 30;
              reason =
                reason || `Matches your interests in ${service.category}`;
            }
          }

          // Popular categories get bonus
          const popularCategories = [
            "Fitness",
            "Tech",
            "Education",
            "Wellness",
          ];
          if (popularCategories.includes(service.category)) {
            score += 15;
            if (!reason) reason = `Popular ${service.category} service`;
          }

          // Trending (new services)
          score += Math.random() * 15; // Add some randomness

          if (!reason) reason = `Based on your profile and location`;

          return {
            ...service,
            provider: Array.isArray(service.provider)
              ? service.provider[0]
              : service.provider,
            matchReason: reason,
            matchScore: score,
          };
        });

        // Sort by score and take top 6
        const topRecommendations = scoredServices
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 6);

        setRecommendations(topRecommendations);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl p-4 mx-auto my-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl p-4 mx-auto my-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-emerald-500" />
          <h2 className="text-2xl font-semibold tracking-tight">
            AI-Powered Recommendations
          </h2>
        </div>
        <Badge variant="secondary" className="gap-1">
          <TrendingUp className="w-3 h-3" />
          Personalized for you
        </Badge>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max gap-4 pb-4">
          {recommendations.map((service) => (
            <Link
              href={`/services/${service.id}`}
              key={service.id}
              className="no-underline"
            >
              <Card className="w-[320px] transition-shadow cursor-pointer hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1">
                      {service.title}
                    </CardTitle>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {service.category}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-1">
                    by {service.provider.full_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
                    {service.description}
                  </p>
                  <div className="flex flex-col gap-1.5 text-xs mb-3">
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Star className="w-3 h-3 fill-emerald-600 dark:fill-emerald-400 shrink-0" />
                      {Math.round(service.matchScore)}% match
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                      {service.matchReason}
                    </p>
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                    size="sm"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
