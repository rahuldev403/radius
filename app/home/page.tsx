"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useGeolocation } from "../hooks/use-geolocation";
import { AiRecommendations } from "@/components/AiRecommendations";
import { Navbar } from "@/components/Navbar";

// --- shadcn/ui components ---
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
// ----------------------------

// Define the type for our service data
// This must match the structure of the data returned by our RPC function
type Service = {
  id: number;
  title: string;
  description: string;
  category: string;
  provider: {
    id: string;
    full_name: string;
    location: {
      type: string;
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
};

export default function HomePage() {
  const router = useRouter();
  const { data: location, error: geoError, getGeolocation } = useGeolocation();

  const [services, setServices] = useState<Service[]>([]);
  const [radius, setRadius] = useState(5); // Default radius in km
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [showListView, setShowListView] = useState(false);

  // Dynamically import the Map component only on the client-side
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/map"), {
        loading: () => (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ),
        ssr: false, // This is crucial for Leaflet
      }),
    []
  );

  // Check if user has completed profile on mount
  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in, redirect to landing page
        console.log("No user found, redirecting to landing page");
        window.location.href = "/";
        return;
      }

      // Fetch user profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, bio, location")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        // If profile doesn't exist yet, redirect to account setup
        if (error.code === "PGRST116") {
          console.log("Profile not found, redirecting to account setup");
          window.location.href = "/account?onboarding=true";
          return;
        }
      }

      console.log("Profile data:", profile);
      console.log("Profile full_name:", profile?.full_name);
      console.log("Profile location raw:", profile?.location);

      // Check if profile is complete
      const isProfileComplete =
        profile && profile.full_name && profile.location;

      console.log("Is profile complete?", isProfileComplete);

      if (!isProfileComplete) {
        // Redirect to account page to complete profile
        console.log("Profile incomplete, redirecting to account setup");
        window.location.href = "/account?onboarding=true";
        return;
      }

      // Profile is complete!
      // For now, we'll just use browser geolocation for the map
      // The important thing is they have a location saved (profile complete)
      console.log("Profile is complete, will use browser geolocation for map");

      setCheckingProfile(false);

      // Automatically trigger geolocation to get user's current position
      console.log("Requesting browser geolocation...");
      getGeolocation();
    } catch (err) {
      console.error("Error checking profile:", err);
      setCheckingProfile(false);
      // Still try to get geolocation even if profile check fails
      getGeolocation();
    }
  };

  const fetchServices = useCallback(async () => {
    // Use userLocation (from profile) if available, otherwise use browser geolocation
    const currentLocation = userLocation
      ? { latitude: userLocation[0], longitude: userLocation[1] }
      : location;

    if (!currentLocation) {
      console.log("No location available yet for fetching services");
      return;
    }

    console.log(
      "Fetching services with location:",
      currentLocation,
      "radius:",
      radius
    );
    setLoading(true);
    setError(null);

    try {
      // Call our Supabase Database Function (RPC)
      const { data, error } = await supabase.rpc("get_services_nearby", {
        user_lat: currentLocation.latitude,
        user_lng: currentLocation.longitude,
        distance_meters: radius * 1000, // Convert km to meters
      });

      if (error) {
        throw error;
      }

      console.log("Fetched services (raw):", data);

      // The RPC function returns services with provider data
      // We need to make sure the location is properly formatted
      const servicesWithLocation =
        data?.map((service: any) => {
          // If provider_location exists, format it properly
          if (service.provider_location) {
            return {
              ...service,
              provider: {
                id: service.provider_id,
                full_name: service.provider_name,
                location: service.provider_location,
              },
            };
          }
          return service;
        }) || [];

      console.log("Fetched services (formatted):", servicesWithLocation);
      setServices(servicesWithLocation);

      if (servicesWithLocation && servicesWithLocation.length > 0) {
        toast.success(
          `Found ${servicesWithLocation.length} service${
            servicesWithLocation.length === 1 ? "" : "s"
          } nearby`
        );
      }
    } catch (err: any) {
      console.error("Error fetching services:", err);
      setError("Could not load nearby services. " + err.message);
      toast.error("Failed to load services", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [userLocation, location, radius]);

  useEffect(() => {
    // Only fetch services after profile check is complete
    if (!checkingProfile) {
      // Use profile location if available, otherwise use browser geolocation
      if (userLocation || location) {
        console.log("Triggering fetchServices from useEffect");
        fetchServices();
      } else {
        console.log("No location available, skipping service fetch");
      }
    }
  }, [checkingProfile, userLocation, location, radius, fetchServices]);

  const userCoords: [number, number] | null =
    userLocation || (location ? [location.latitude, location.longitude] : null);

  // Show loading screen while checking profile
  if (checkingProfile) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-100">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
        <p className="text-lg text-gray-600">Setting up your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-gray-50">
      {/* --- Fixed Navbar --- */}
      <Navbar />

      {/* --- AI Recommendations Section --- */}
      <div className="pt-4 px-4 max-w-7xl mx-auto">
        <AiRecommendations />
      </div>

      {/* --- Map/List View Container --- */}
      <div className="relative w-full h-[calc(100vh-180px)] mt-4">
        {/* --- Control Panel --- */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4">
          <div className="p-4 bg-white rounded-lg shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="radius" className="text-base font-semibold">
                Search Radius
              </Label>
              <span className="px-2 py-1 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-md">
                {radius} km
              </span>
            </div>
            <Slider
              id="radius"
              min={1}
              max={50}
              step={1}
              value={[radius]}
              onValueChange={(value) => setRadius(value[0])}
            />
            <p className="mt-2 text-xs text-gray-500">
              Found {services.length} service{services.length !== 1 ? "s" : ""}{" "}
              nearby
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowListView(!showListView)}
                className="flex-1"
              >
                {showListView ? "📍 Map View" : "📋 List View"}
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/services/new")}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                ➕ Create Service
              </Button>
            </div>
          </div>
        </div>

        {/* --- Map or List Container --- */}
        <div className="w-full h-full">
          {geoError && (
            <div className="flex items-center justify-center w-full h-full bg-gray-100">
              <div className="text-center">
                <p className="text-red-500 mb-4">{geoError.message}</p>
                <Button onClick={getGeolocation}>Retry</Button>
              </div>
            </div>
          )}

          {!userCoords && !geoError && (
            <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="mt-2 text-lg text-gray-600">
                Getting your location...
              </p>
            </div>
          )}

          {userCoords && !showListView && (
            <Map
              key={`map-${userCoords[0]}-${userCoords[1]}-${showListView}`}
              services={services}
              center={userCoords}
            />
          )}

          {userCoords && showListView && (
            <div className="w-full h-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="max-w-5xl mx-auto p-6 pt-32 pb-8 space-y-6">
                  {/* Empty State */}
                  {services.length === 0 && !loading && (
                    <Card className="border-2 border-dashed border-gray-300 bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-gray-900">
                          No Services Found
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          There are no services available in your area yet. Be
                          the first to share your skills!
                        </p>
                        <Button
                          onClick={() => router.push("/services/new")}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-6 text-base shadow-lg"
                        >
                          ➕ Create Your First Service
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Service Cards */}
                  {services.map((service, index) => (
                    <Card
                      key={service.id}
                      className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm hover:-translate-y-1"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                {service.title}
                              </CardTitle>
                            </div>
                            <CardDescription className="flex items-center gap-2 text-base">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                              <span className="font-medium text-gray-700">
                                by {service.provider.full_name}
                              </span>
                            </CardDescription>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200 px-4 py-1 text-sm font-semibold"
                          >
                            {service.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-gray-600 leading-relaxed line-clamp-2">
                          {service.description}
                        </p>
                        <div className="flex gap-3">
                          <Button
                            onClick={() =>
                              router.push(`/services/${service.id}`)
                            }
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all"
                          >
                            View Details →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Bottom Spacing */}
                  <div className="h-4"></div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* --- Loading/Status Overlay --- */}
        {loading && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-lg">
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-emerald-500" />
              <span className="text-sm font-medium text-gray-700">
                Finding services...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-10">
            <div className="px-4 py-2 font-medium text-white bg-red-500 rounded-full shadow-lg">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
