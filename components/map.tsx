// This component isolates the Leaflet map logic.
// We will load this component 'dynamically' on the homepage.
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css"; // Re-CSS
import "leaflet-defaulticon-compatibility"; // Re-JS
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

// Define the shape of our service data
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

interface MapProps {
  services: Service[];
  center: [number, number]; // [latitude, longitude]
  zoom?: number;
}

export function Map({ services, center, zoom = 13 }: MapProps) {
  if (!center || !center[0] || !center[1]) {
    return <div>Loading map...</div>;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="w-full h-full rounded-lg"
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
        const [longitude, latitude] = service.provider.location.coordinates;
        const position: LatLngExpression = [latitude, longitude];

        return (
          <Marker key={service.id} position={position}>
            <Popup>
              <Card className="border-none shadow-none w-64">
                <CardHeader className="p-2">
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription>
                    by {service.provider.full_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2">
                  <p className="text-sm line-clamp-3">{service.description}</p>
                  <Link href={`/services/${service.id}`} passHref>
                    <Button className="w-full mt-2" size="sm">
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
