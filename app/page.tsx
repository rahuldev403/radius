"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useGeolocation } from "./hooks/use-geolocation"; // Our hook from Hour 2

// --- shadcn/ui components ---
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
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
  const supabase = createClientComponentClient();
  const { data: location, error: geoError } = useGeolocation();

  const [services, setServices] = useState<Service[]>([]);
  const [radius, setRadius] = useState(5); // Default radius in km
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamically import the Map component only on the client-side
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/map").then((mod) => mod.Map), {
        loading: () => (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ),
        ssr: false, // This is crucial for Leaflet
      }),
    []
  );

  useEffect(() => {
    if (location) {
      fetchServices();
    }
  }, [location, radius]); // Re-fetch when location or radius changes

  const fetchServices = async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      // Call our Supabase Database Function (RPC)
      const { data, error } = await supabase.rpc("get_services_nearby", {
        user_lat: location.latitude,
        user_lng: location.longitude,
        distance_meters: radius * 1000, // Convert km to meters
      });

      if (error) {
        throw error;
      }

      setServices(data || []);
    } catch (err: any) {
      console.error("Error fetching services:", err);
      setError("Could not fetch services. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const userCoords: [number, number] | null = location
    ? [location.latitude, location.longitude]
    : null;

  return (
    <div className="relative w-full h-screen">
      {/* --- Control Panel --- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md p-2">
        <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200">
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
        </div>
      </div>

      {/* --- Map Container --- */}
      <div className="w-full h-full">
        {geoError && (
          <div className="flex items-center justify-center w-full h-full bg-gray-100">
            <p className="text-red-500">{geoError.message}</p>
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

        {userCoords && <Map services={services} center={userCoords} />}
      </div>

      {/* --- Loading/Status Overlay --- */}
      {loading && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-lg">
            <Loader2 className="w-5 h-5 mr-2 animate-spin text-emerald-500" />
            <span className="text-sm font-medium text-gray-700">
              Finding services...
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="px-4 py-2 font-medium text-white bg-red-500 rounded-full shadow-lg">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
