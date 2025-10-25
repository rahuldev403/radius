'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

// Import our new geolocation hook
import { useGeolocation } from '@/hooks/use-geolocation';

// --- shadcn/ui components ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // We'll add this
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react'; // Icons for location and loading
// ----------------------------

// Initialize the Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  
  // State for messages
  const [message, setMessage] = useState('');
  
  // Use our custom geolocation hook
  const { 
    loading: geoLoading, 
    error: geoError, 
    data: geoData, 
    getGeolocation 
  } = useGeolocation();

  // This function fetches the user's session and existing profile data
  const getProfile = useCallback(async () => {
    setLoading(true);
    
    // Get the current user from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      // Fetch the matching row from our public 'profiles' table
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, bio')
        .eq('id', user.id)
        .single(); // We only expect one row

      if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setFullName(data.full_name || '');
        setBio(data.bio || '');
      }
    }
    setLoading(false);
  }, []);

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
    setMessage('');

    if (!user) {
      setLoading(false);
      return;
    }

    const updates = {
      id: user.id, // The primary key
      full_name: fullName,
      bio: bio,
      updated_at: new Date().toISOString(),
    };

    // 'upsert' will INSERT a new row if one doesn't exist,
    // or UPDATE the existing one. Perfect for profiles.
    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      alert(error.message);
    } else {
      setMessage('Profile updated successfully!');
    }
    setLoading(false);
  }

  /**
   * This function handles updating *only* the user's location
   */
  async function updateLocation() {
    if (!user || !geoData) return;

    setLoading(true);
    setMessage('');

    // Format the location data for PostGIS
    // PostGIS format is 'POINT(Longitude Latitude)'
    const locationPoint = `POINT(${geoData.longitude} ${geoData.latitude})`;

    const { error } = await supabase
      .from('profiles')
      .update({ location: locationPoint })
      .eq('id', user.id);

    if (error) {
      alert(`Error updating location: ${error.message}`);
    } else {
      setMessage('Your location has been set!');
    }
    setLoading(false);
  }

  // When we get new geoData, call updateLocation to save it
  useEffect(() => {
    if (geoData) {
      updateLocation();
    }
  }, [geoData]); // Dependency array ensures this runs only when geoData changes


  // --- The Component UI ---

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 dark:bg-gray-950 p-4 pt-16">
      <Card className="w-full max-w-2xl border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Your Provider Profile
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            This information will be visible to others on 'Radius'.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Section 1: Update Name and Bio */}
          <form onSubmit={updateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={user ? user.email : ''}
                disabled
                className="dark:bg-gray-800 dark:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300">Full Name</Label>
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
              <Label htmlFor="bio" className="text-gray-700 dark:text-gray-300">Your Bio</Label>
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
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
            </div>
          </form>

          {/* Section 2: Set Location */}
          <div className="space-y-3">
            <Label className="text-gray-700 dark:text-gray-300">Set Your Location</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This is essential for the geo-location search. We only store your 
              coordinates, not your address.
            </p>
            <Button
              variant="outline"
              className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-500 dark:text-emerald-500 dark:hover:bg-gray-900"
              onClick={getGeolocation} // This triggers the browser permission pop-up
              disabled={geoLoading || loading}
            >
              {(geoLoading || loading) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              {geoLoading ? 'Finding You...' : 'Set My Current Location'}
            </Button>
            
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
