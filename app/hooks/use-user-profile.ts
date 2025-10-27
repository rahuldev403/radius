"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: any;
  credits: number;
  total_bookings: number;
  completed_bookings: number;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);

        // Get current user from Supabase
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!currentUser) {
          setUser(null);
          setProfile(null);
          setIsSignedIn(false);
          setIsLoading(false);
          return;
        }

        setUser(currentUser);
        setIsSignedIn(true);

        // Load profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        setProfile(profileData);
        setError(null);
      } catch (err: any) {
        console.error("Error loading profile:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsSignedIn(true);
        loadProfile();
      } else {
        setUser(null);
        setProfile(null);
        setIsSignedIn(false);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      setProfile(profileData);
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  return {
    user,
    profile,
    isLoading,
    isSignedIn,
    error,
    refreshProfile,
  };
}
