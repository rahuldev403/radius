"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useGeolocation } from "../app/hooks/use-geolocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  X,
  MapPin,
  User as UserIcon,
  Check,
  Loader2,
  Camera,
} from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { toast } from "sonner";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isOnboarding?: boolean;
}

export function ProfileModal({
  isOpen,
  onClose,
  user,
  isOnboarding = false,
}: ProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasSetLocation, setHasSetLocation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    loading: geoLoading,
    error: geoError,
    data: geoData,
    getGeolocation,
  } = useGeolocation();

  // Load existing profile data
  useEffect(() => {
    if (user && isOpen) {
      loadProfile();
      // Reset location state when modal opens
      setHasSetLocation(false);
      setMessage("");
    }
  }, [user, isOpen]);

  const loadProfile = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, bio, avatar_url")
      .eq("id", user.id)
      .single();

    if (profile) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  };

  // Upload avatar
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user?.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      setMessage("Avatar updated successfully!");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  // Update profile
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage("");

    const updates = {
      id: user.id,
      full_name: fullName,
      bio: bio,
      avatar_url: avatarUrl,
    };

    const { error } = await supabase.from("profiles").upsert(updates);

    if (error) {
      setMessage("Error updating profile");
      setLoading(false);
    } else {
      setMessage("Profile saved! Now set your location.");
      setCurrentStep(2);
      setLoading(false);
    }
  };

  // Update location
  const updateLocation = useCallback(async () => {
    if (!user || !geoData) return;

    setLoading(true);
    const locationPoint = `POINT(${geoData.longitude} ${geoData.latitude})`;

    const { error } = await supabase
      .from("profiles")
      .update({ location: locationPoint })
      .eq("id", user.id);

    if (error) {
      setMessage("Error setting location");
      setLoading(false);
      toast.error("Failed to update location", {
        description: "Please try again or check your permissions.",
      });
    } else {
      setMessage("Location updated successfully!");
      setHasSetLocation(true);
      setLoading(false);
      toast.success("Location Updated!", {
        description: "Your location has been updated successfully.",
      });

      if (isOnboarding && fullName) {
        setTimeout(() => {
          window.location.href = "/home";
        }, 1500);
      }
    }
  }, [user, geoData, isOnboarding, fullName]);

  useEffect(() => {
    if (geoData && user) {
      updateLocation();
    }
  }, [geoData, user, updateLocation]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-5xl h-[600px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex"
          >
            {/* Close Button */}
            {!isOnboarding && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Left Side - Form */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="mb-8">
                  <div className="inline-flex p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mb-4">
                    <UserIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {isOnboarding ? "Complete Your Profile" : "Edit Profile"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {isOnboarding
                      ? "Let's get you set up in just a few steps"
                      : "Update your information"}
                  </p>
                </div>

                {/* Progress Steps */}
                {isOnboarding && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className={`flex-1 h-2 rounded-full ${
                          currentStep >= 1
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : "bg-gray-200"
                        }`}
                      />
                      <div
                        className={`flex-1 h-2 rounded-full ${
                          currentStep >= 2
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : "bg-gray-200"
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span
                        className={
                          currentStep >= 1
                            ? "text-emerald-600 font-semibold"
                            : "text-gray-400"
                        }
                      >
                        Profile Info
                      </span>
                      <span
                        className={
                          currentStep >= 2
                            ? "text-emerald-600 font-semibold"
                            : "text-gray-400"
                        }
                      >
                        Location
                      </span>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={updateProfile} className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                      <Avatar className="w-24 h-24 border-4 border-emerald-100">
                        <AvatarImage src={avatarUrl} alt={fullName || "User"} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-2xl">
                          {fullName
                            ? fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : user?.email?.[0].toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-all group-hover:scale-110"
                        title="Upload avatar"
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={uploadAvatar}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                      Click camera to upload photo
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Location Button - Always visible */}
                  <Button
                    type="button"
                    onClick={getGeolocation}
                    disabled={geoLoading || hasSetLocation}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-base font-semibold shadow-lg"
                  >
                    {geoLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Getting Location...
                      </>
                    ) : hasSetLocation ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Location {isOnboarding ? "Set!" : "Updated!"}
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5 mr-2" />
                        {isOnboarding
                          ? "Set My Location"
                          : "Update My Location"}
                      </>
                    )}
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading || !fullName.trim()}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-6 text-base font-semibold shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </form>

                {/* Helper messages */}
                {hasSetLocation && !isOnboarding && (
                  <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
                    Your location has been updated. Close this modal to see
                    changes.
                  </p>
                )}

                {/* Message */}
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm text-center font-medium"
                  >
                    {message}
                  </motion.div>
                )}

                {geoError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                    {geoError.message}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Lottie Animation */}
            <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 items-center justify-center p-8">
              <div className="text-center text-white space-y-6">
                {/* Lottie Animation Container */}
                <div className="w-80 h-80 mx-auto">
                  <DotLottieReact
                    src="https://lottie.host/c925259b-e34f-4ab5-ab68-ea151c9cb447/IRJhod0Nzk.lottie"
                    loop
                    autoplay
                  />
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {isOnboarding
                      ? "Welcome to Radius!"
                      : "Update Your Profile"}
                  </h3>
                  <p className="text-emerald-50">
                    {isOnboarding
                      ? "Connect with your community and share your skills"
                      : "Keep your information up to date"}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="text-emerald-50">
                      {isOnboarding
                        ? "Create and discover local services"
                        : "Update your name and bio"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="text-emerald-50">
                      {isOnboarding
                        ? "Connect with nearby providers"
                        : "Update your location"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="text-emerald-50">
                      {isOnboarding
                        ? "Build your local network"
                        : "Changes save automatically"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
