"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    start_date: "",
    end_date: "",
    max_participants: "",
    goals: "",
    skills_needed: "",
  });

  const categories = [
    "Community Development",
    "Technology",
    "Education",
    "Environment",
    "Arts & Culture",
    "Health & Wellness",
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
        throw new Error("You must be logged in to create a project.");
      }

      const { error } = await supabase.from("community_projects").insert({
        creator_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        max_participants: formData.max_participants
          ? parseInt(formData.max_participants)
          : null,
        goals: formData.goals || null,
        skills_needed: formData.skills_needed || null,
        status: "planning",
      });

      if (error) throw error;

      toast.success("Project Created!", {
        description: "Your community project is now live.",
      });

      router.push("/projects");
    } catch (error: any) {
      toast.error("Failed to create project", {
        description: error.message || "Please try again.",
      });
      console.error("Error creating project:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 hover:bg-emerald-50 text-emerald-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Create Community Project
              </h1>
              <p className="text-gray-600 mt-1">
                Start a collaborative project and bring the community together
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="border-2 border-emerald-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Project Details
            </CardTitle>
            <CardDescription>
              Fill in the information about your community project
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Project Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Build a Community Garden"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="text-base"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
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

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project, what you want to achieve, and why it matters..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={5}
                  className="text-base resize-none"
                />
                <p className="text-xs text-gray-500">
                  {formData.description.length} / 1000 characters
                </p>
              </div>

              {/* Goals */}
              <div className="space-y-2">
                <Label htmlFor="goals" className="text-sm font-medium">
                  Project Goals
                </Label>
                <Textarea
                  id="goals"
                  placeholder="What are the main objectives? (Optional)"
                  value={formData.goals}
                  onChange={(e) =>
                    setFormData({ ...formData, goals: e.target.value })
                  }
                  rows={3}
                  className="text-base resize-none"
                />
              </div>

              {/* Skills Needed */}
              <div className="space-y-2">
                <Label htmlFor="skills_needed" className="text-sm font-medium">
                  Skills Needed
                </Label>
                <Input
                  id="skills_needed"
                  type="text"
                  placeholder="e.g., Gardening, Carpentry, Design (Optional)"
                  value={formData.skills_needed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skills_needed: e.target.value,
                    })
                  }
                  className="text-base"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-sm font-medium">
                    Start Date
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-sm font-medium">
                    End Date
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="text-base"
                  />
                </div>
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <Label
                  htmlFor="max_participants"
                  className="text-sm font-medium"
                >
                  Maximum Participants
                </Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="2"
                  placeholder="e.g., 10 (Optional - leave empty for unlimited)"
                  value={formData.max_participants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_participants: e.target.value,
                    })
                  }
                  className="text-base"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !formData.title.trim() ||
                    !formData.description.trim() ||
                    !formData.category
                  }
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-6 text-base font-semibold shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Project...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Helper Text */}
        <p className="mt-6 text-sm text-center text-gray-500">
          Your project will be visible to the community once created. You can
          manage participants and updates from the project page.
        </p>
      </motion.div>
    </div>
  );
}
