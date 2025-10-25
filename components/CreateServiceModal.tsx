"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateServiceModal({
  isOpen,
  onClose,
}: CreateServiceModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const categories = [
    "Tutoring",
    "Home Services",
    "Tech Support",
    "Creative Services",
    "Fitness & Wellness",
    "Food & Catering",
    "Pet Services",
    "Transportation",
    "Events & Entertainment",
    "Professional Services",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a service.");
      }

      const { error: insertError } = await supabase.from("services").insert({
        provider_id: user.id,
        title: title,
        description: description,
        category: category,
      });

      if (insertError) {
        throw insertError;
      }

      toast.success("Service Created!", {
        description: "Your service is now live and visible to others.",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");

      // Close modal and refresh
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 500);
    } catch (error: any) {
      toast.error("Failed to create service", {
        description: error.message || "Please try again.",
      });
      console.error("Error creating service:", error);
    } finally {
      setLoading(false);
    }
  };

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
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side - Form */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="mb-8">
                  <div className="inline-flex p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Create New Service
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Share your skills with the community
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Service Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="e.g., Math Tutoring for High School Students"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={category}
                      onValueChange={setCategory}
                      required
                    >
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium"
                    >
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your service, experience, and what makes you unique..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={6}
                      className="text-base resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      {description.length} / 500 characters
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      !title.trim() ||
                      !description.trim() ||
                      !category
                    }
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-6 text-base font-semibold shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Service...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Create Service
                      </>
                    )}
                  </Button>
                </form>

                {/* Helper Text */}
                <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
                  Your service will be visible to people searching in your area
                </p>
              </div>
            </div>

            {/* Right Side - Lottie Animation */}
            <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 items-center justify-center p-8">
              <div className="text-center text-white space-y-6">
                {/* Lottie Animation Container */}
                <div className="w-80 h-80 mx-auto">
                  <DotLottieReact
                    src="https://lottie.host/embed/b0f6c3d3-5d42-4f5e-8c0e-1c5a5e5a5e5a/animation.lottie"
                    loop
                    autoplay
                  />
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-2">Share Your Skills</h3>
                  <p className="text-purple-50">
                    Connect with people who need your expertise
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 text-left max-w-sm mx-auto">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold">Get Discovered</p>
                      <p className="text-sm text-purple-100">
                        Be found by people in your area
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold">Build Your Reputation</p>
                      <p className="text-sm text-purple-100">
                        Get reviews and ratings from clients
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold">Manage Bookings</p>
                      <p className="text-sm text-purple-100">
                        Easy scheduling and communication
                      </p>
                    </div>
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
