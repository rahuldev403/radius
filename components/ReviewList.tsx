"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Star, User } from "lucide-react";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    full_name: string;
    avatar_url: string;
  };
}

interface ReviewListProps {
  profileId: string;
}

export function ReviewList({ profileId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [profileId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          id,
          rating,
          comment,
          created_at,
          reviewer:profiles!reviews_reviewer_id_fkey (
            full_name,
            avatar_url
          )
        `
        )
        .eq("reviewee_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Type assertion for nested data
      const typedReviews = (data || []).map((review) => ({
        ...review,
        reviewer: Array.isArray(review.reviewer)
          ? review.reviewer[0]
          : review.reviewer,
      })) as Review[];

      setReviews(typedReviews);

      // Calculate average rating
      if (typedReviews.length > 0) {
        const avg =
          typedReviews.reduce((sum, r) => sum + r.rating, 0) /
          typedReviews.length;
        setAverageRating(Math.round(avg * 10) / 10); // Round to 1 decimal
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Loading reviews...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Average Rating Summary */}
      {reviews.length > 0 && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-600">
                  {averageRating}
                </div>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= averageRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {reviews.length} Review{reviews.length !== 1 ? "s" : ""}
                </div>
                <div className="text-sm text-gray-600">
                  Based on completed sessions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews & Testimonials</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reviews yet. Be the first to leave a review!
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b last:border-b-0 pb-4 last:pb-0"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={review.reviewer.avatar_url} />
                        <AvatarFallback>
                          <User className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">
                            {review.reviewer.full_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(review.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-700">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
