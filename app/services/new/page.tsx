"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

// --- shadcn/ui components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
// ----------------------------

export default function CreateServicePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Get the currently logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to create a service.");
      }

      // 2. Insert the new service into the 'services' table
      const { error: insertError } = await supabase.from("services").insert({
        provider_id: user.id, // Link to the user
        title: title,
        description: description,
        category: category,
        // We will add the AI embedding later (in Bonus step)
      });

      if (insertError) {
        throw insertError;
      }

      // 3. Handle success
      setLoading(false);
      setSuccess(true);
      setTitle("");
      setDescription("");
      setCategory("");

      // Optional: redirect to their dashboard or the new service page
      // For now, just show a success message
      // router.push('/dashboard');
    } catch (error: any) {
      setLoading(false);
      setError(error.message);
      console.error("Error creating service:", error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>List a New Skill or Service</CardTitle>
            <CardDescription>
              What can you offer to your community? Fill out the details below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Service Title</Label>
              <Input
                id="title"
                placeholder="e.g., Acoustic Guitar Lessons"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={setCategory} value={category} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital & Tech</SelectItem>
                  <SelectItem value="crafts">Arts & Crafts</SelectItem>
                  <SelectItem value="tutoring">Tutoring & Learning</SelectItem>
                  <SelectItem value="fitness">Health & Fitness</SelectItem>
                  <SelectItem value="home">Home & Garden</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you're offering, your experience, and what people can expect."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "List My Service"
              )}
            </Button>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && (
              <p className="text-emerald-500 text-sm mt-2">
                Success! Your service has been listed.
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
