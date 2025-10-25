"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Import our new geolocation hook
import { useGeolocation } from "../hooks/use-geolocation";

// --- shadcn/ui components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // We'll add this
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react"; // Icons for location and loading
// ----------------------------

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  // State for messages
  const [message, setMessage] = useState("");
  const [hasSetLocation, setHasSetLocation] = useState(false);

  // Log page initialization
  console.log("=== ACCOUNT PAGE INITIALIZED ===");
  console.log("URL:", window.location.href);
  console.log("isOnboarding:", isOnboarding);

  // Use our custom geolocation hook
  const {
    loading: geoLoading,
    error: geoError,
    data: geoData,
    getGeolocation,
  } = useGeolocation();

  // This function fetches the user's session and existing profile data
  const getProfile = useCallback(async () => {
    setLoading(true);

    // Get the current user from Supabase auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      // Fetch the matching row from our public 'profiles' table
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, bio, location")
        .eq("id", user.id)
        .single(); // We only expect one row

      if (error && error.code !== "PGRST116") {
        // PGRST116 = row not found
        console.error("Error fetching profile:", error);
      }

      if (data) {
        setFullName(data.full_name || "");
        setBio(data.bio || "");
        // Check if location is already set (PostGIS POINT format)
        if (data.location) {
          setHasSetLocation(true);
        }

        // Check if profile is complete and NOT in onboarding mode
        // Location comes back as "POINT(lng lat)" string from PostGIS
        const isProfileComplete = data.full_name && data.location;

        // If profile is complete and user is not explicitly in onboarding mode, redirect to home
        if (isProfileComplete && !isOnboarding) {
          console.log(
            "Profile already complete, redirecting to home dashboard"
          );
          window.location.href = "/home";
          return;
        }
      }
    }
    setLoading(false);
  }, [isOnboarding]);

  // Run getProfile on component load
  useEffect(() => {
    getProfile();
  }, [getProfile]);

  // --- Form Handlers ---

  /**
   * This function handles updating the user's text profile (name, bio)
   */
  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!user) {
      console.log("❌ No user found");
      setLoading(false);
      return;
    }

    console.log("=== UPDATING PROFILE ===");
    console.log("User ID:", user.id);
    console.log("Full Name:", fullName);
    console.log("Bio:", bio);

    const updates = {
      id: user.id, // The primary key
      full_name: fullName,
      bio: bio,
    };

    // 'upsert' will INSERT a new row if one doesn't exist,
    // or UPDATE the existing one. Perfect for profiles.
    const { error } = await supabase.from("profiles").upsert(updates);

    if (error) {
      console.error("❌ Error updating profile:", error);
      alert(error.message);
      setLoading(false);
    } else {
      console.log("✅ Profile saved to database successfully");
      console.log("Current state after save:", {
        isOnboarding,
        hasSetLocation,
        fullName,
        fullNameLength: fullName?.length,
      });
      setMessage(
        "Profile updated successfully! Now click 'Set My Current Location'"
      );

      // If this is onboarding and they have set location, redirect to home
      if (isOnboarding && hasSetLocation && fullName) {
        console.log(
          "✅ ALL CONDITIONS MET - Profile + Location complete, redirecting"
        );
        setMessage("Profile complete! Redirecting to dashboard...");
        setTimeout(() => {
          console.log("⏰ EXECUTING REDIRECT to /home");
          window.location.href = "/home";
        }, 1000);
      } else {
        console.log("⏳ Profile saved, but waiting for location");
        if (!isOnboarding) console.log("  - Not in onboarding mode");
        if (!hasSetLocation)
          console.log(
            "  - Location not set yet - please click 'Set My Current Location'"
          );
        if (!fullName) console.log("  - Name not set");
        setLoading(false);
      }
    }
  }

  /**
   * This function handles updating *only* the user's location
   */
  const updateLocation = useCallback(async () => {
    if (!user || !geoData) {
      console.log("updateLocation: Missing user or geoData", {
        user: !!user,
        geoData: !!geoData,
      });
      return;
    }

    setLoading(true);
    setMessage("");

    // Format the location data for PostGIS
    // PostGIS format is 'POINT(Longitude Latitude)'
    const locationPoint = `POINT(${geoData.longitude} ${geoData.latitude})`;

    console.log("=== UPDATING LOCATION ===");
    console.log("Location point:", locationPoint);
    console.log("Current state:", {
      isOnboarding,
      fullName,
      hasSetLocation,
      userId: user.id,
    });

    const { error } = await supabase
      .from("profiles")
      .update({ location: locationPoint })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating location:", error);
      alert(`Error updating location: ${error.message}`);
      setLoading(false);
    } else {
      console.log("✅ Location saved to database successfully");
      setMessage("Your location has been set!");
      setHasSetLocation(true);

      // Check redirect conditions
      console.log("=== CHECKING REDIRECT CONDITIONS ===");
      console.log("isOnboarding:", isOnboarding);
      console.log("fullName:", fullName);
      console.log("fullName length:", fullName?.length);
      console.log("fullName truthy:", !!fullName);

      // If onboarding and profile info is complete, redirect to home
      if (isOnboarding && fullName && fullName.trim().length > 0) {
        console.log("✅ ALL CONDITIONS MET - INITIATING REDIRECT");
        setMessage("Profile complete! Redirecting to dashboard...");
        setLoading(false); // Clear loading before redirect

        setTimeout(() => {
          console.log("⏰ EXECUTING REDIRECT NOW to /home");
          window.location.href = "/home";
        }, 1500);
      } else {
        console.log("❌ Cannot redirect - conditions not met:");
        if (!isOnboarding)
          console.log("  - Not in onboarding mode (isOnboarding=false)");
        if (!fullName) console.log("  - fullName is empty/null/undefined");
        if (fullName && fullName.trim().length === 0)
          console.log("  - fullName is only whitespace");
        setLoading(false);
      }
    }
  }, [user, geoData, isOnboarding, fullName]);

  // When we get new geoData, call updateLocation to save it
  useEffect(() => {
    if (geoData && user) {
      updateLocation();
    }
  }, [geoData, user, updateLocation]); // Dependency array ensures this runs only when geoData changes

  // --- The Component UI ---

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 dark:bg-gray-950 p-4 pt-16">
      {isOnboarding && (
        <div className="w-full max-w-2xl mb-6 p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-lg text-white">
          <h2 className="text-2xl font-bold mb-2">👋 Welcome to Radius!</h2>
          <p className="text-emerald-50">
            Complete your profile to start connecting with your community:
          </p>
          <ol className="mt-3 space-y-2 text-sm">
            <li
              className={fullName ? "line-through opacity-75" : "font-semibold"}
            >
              ✓ Step 1: Enter your full name and bio below
            </li>
            <li
              className={
                fullName
                  ? hasSetLocation
                    ? "line-through opacity-75"
                    : "font-semibold"
                  : "opacity-50"
              }
            >
              ✓ Step 2: Click "Set My Current Location" button
            </li>
            <li
              className={
                fullName && hasSetLocation
                  ? "font-semibold text-yellow-200"
                  : "opacity-50"
              }
            >
              ✓ Step 3: Profile complete! You'll be redirected automatically
            </li>
          </ol>
        </div>
      )}

      <Card className="w-full max-w-2xl border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {isOnboarding ? "Complete Your Profile" : "Your Provider Profile"}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {isOnboarding
              ? "Fill in your details to start connecting with your community."
              : "This information will be visible to others on Radius."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Section 1: Update Name and Bio */}
          <form onSubmit={updateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-gray-700 dark:text-gray-300"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={user ? user.email : ""}
                disabled
                className="dark:bg-gray-800 dark:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="fullName"
                className="text-gray-700 dark:text-gray-300"
              >
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="e.g., Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="dark:bg-gray-900 dark:text-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-gray-700 dark:text-gray-300">
                Your Bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell the community about your skills (e.g., 'I am a professional musician with 10 years of experience...')"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[100px] dark:bg-gray-900 dark:text-gray-50"
              />
            </div>
            <div>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-gray-900"
                disabled={loading || !fullName}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isOnboarding ? "Save Name & Bio" : "Update Profile"}
              </Button>
              {isOnboarding && !fullName && (
                <p className="text-xs text-gray-500 mt-1">
                  Please enter your full name first
                </p>
              )}
            </div>
          </form>

          {/* Section 2: Set Location */}
          <div className="space-y-3">
            <Label className="text-gray-700 dark:text-gray-300">
              {isOnboarding ? "Step 2: " : ""}Set Your Location{" "}
              {isOnboarding && "*"}
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This is essential for the geo-location search. We only store your
              coordinates, not your address.
            </p>
            <Button
              variant="outline"
              className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-500 dark:text-emerald-500 dark:hover:bg-gray-900"
              onClick={getGeolocation} // This triggers the browser permission pop-up
              disabled={geoLoading || loading || !fullName}
            >
              {geoLoading || loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              {hasSetLocation ? "Update Location" : "Set My Current Location"}
            </Button>
            {isOnboarding && !fullName && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                💡 Please save your name first before setting location
              </p>
            )}

            {/* Display status messages */}
            {geoError && (
              <p className="text-sm font-medium text-red-600 dark:text-red-500">
                Error: {geoError.message}. Please enable location permissions.
              </p>
            )}
            {message && (
              <p className="text-sm font-medium text-green-600 dark:text-green-500">
                {message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
