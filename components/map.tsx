// This component isolates the Leaflet map logic.
// We will load this component 'dynamically' on the homepage.
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"; // Use standard CSS instead of webpack CSS
import "leaflet-defaulticon-compatibility"; // Re-JS
import L from "leaflet";
import { LatLngExpression } from "leaflet";
// --- CORRECTED IMPORTS ---
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// -------------------------
import Link from "next/link";

// Fix for Leaflet default icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Define the shape of our service data
type Service = {
  id: number;
  title: string;
  description: string;
  category: string;
  provider?: {
    id: string;
    full_name: string;
    location: {
      type: string;
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
};

interface MapProps {
  services: Service[];
  center: [number, number]; // [latitude, longitude]
  zoom?: number;
}

export function Map({ services, center, zoom = 13 }: MapProps) {
  const mapRef = useRef<any>(null);

  // Cleanup function to properly destroy the map instance
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);

  if (!center || !center[0] || !center[1]) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  // Validate that center coordinates are valid numbers
  if (isNaN(center[0]) || isNaN(center[1])) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-red-500">Invalid map coordinates</p>
      </div>
    );
  }

  return (
    <MapContainer
      key={`map-${center[0]}-${center[1]}`}
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="w-full h-full rounded-lg"
      ref={mapRef}
      whenReady={() => {
        console.log("Map is ready");
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Marker for the user's location */}
      <Marker position={center}>
        <Popup>Your Location</Popup>
      </Marker>

      {/* Markers for each service */}
      {services.map((service) => {
        // Safely access location coordinates
        if (!service.provider?.location?.coordinates) {
          console.warn(`Service ${service.id} missing location data:`, service);
          return null;
        }

        const [longitude, latitude] = service.provider.location.coordinates;

        // Validate coordinates
        if (typeof latitude !== "number" || typeof longitude !== "number") {
          console.warn(
            `Invalid coordinates for service ${service.id}:`,
            latitude,
            longitude
          );
          return null;
        }

        const position: LatLngExpression = [latitude, longitude];

        return (
          <Marker key={service.id} position={position}>
            <Popup closeButton={true} autoClose={false} closeOnClick={false}>
              <Card
                className="border-none shadow-none w-64"
                onClick={(e) => e.stopPropagation()}
              >
                <CardHeader className="p-2">
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription>
                    by {service.provider?.full_name || "Unknown Provider"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2">
                  <p className="text-sm line-clamp-3">{service.description}</p>
                  <Link href={`/services/${service.id}`} passHref>
                    <Button
                      className="w-full mt-2"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      View Service
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default Map;
