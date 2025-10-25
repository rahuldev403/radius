'use client';

import { useState } from 'react';

// Define the structure of the coordinates object
interface Coordinates {
  latitude: number;
  longitude: number;
}

// Define what the hook returns
interface GeolocationState {
  loading: boolean;
  error: GeolocationPositionError | null;
  data: Coordinates | null;
  getGeolocation: () => void; // A function to trigger the browser's location API
}

/**
 * A custom React hook to get the user's current geolocation.
 */
export function useGeolocation(): GeolocationState {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [data, setData] = useState<Coordinates | null>(null);

  const getGeolocation = () => {
    // Check if the geolocation API is available in the browser
    if (!navigator.geolocation) {
      setError(new GeolocationPositionError());
      console.error('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    // Call the browser's API
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
  };

  return { loading, error, data, getGeolocation };
}

// Custom error class in case geolocation is not supported
class GeolocationPositionError extends Error {
  readonly code: number = 0;
  readonly message: string = 'Geolocation is not supported by this browser.';
  readonly PERMISSION_DENIED: number = 1;
  readonly POSITION_UNAVAILABLE: number = 2;
  readonly TIMEOUT: number = 3;
  constructor() {
    super('Geolocation is not supported by this browser.');
    Object.setPrototypeOf(this, GeolocationPositionError.prototype);
  }
}
