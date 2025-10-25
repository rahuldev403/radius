"use client";

// We'll use these React hooks for managing form state
import { useState } from "react";
// This hook is for programmatic navigation (e.g., redirecting after login)
// import { useRouter } from 'next/navigation'; // Removed for compatibility
// This is the essential Supabase helper for client-side auth in Next.js
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Switched to standard client
import { createClient } from "@supabase/supabase-js"; // Use standard Supabase client

// --- Our pre-built shadcn/ui components ---
// We'll add these to our project in the next step
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Compass } from "lucide-react"; // Our "Radius" logo icon!
// ------------------------------------------

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // This boolean state switches the form between "Sign In" and "Sign Up" mode
  const [isSignUp, setIsSignUp] = useState(false);

  // States for showing messages to the user
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // const router = useRouter(); // Removed for compatibility
  // Initialize the Supabase client for client-side operations
  // const supabase = createClientComponentClient();

  // Initialize the Supabase client using environment variables
  // Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are in your .env.local
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- Core Auth Functions ---

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(`Sign in failed: ${error.message}`);
    } else {
      setMessage("Logged in successfully! Redirecting...");
      // On success, send the user to the homepage
      // router.push('/');
      // router.refresh(); // This ensures the layout re-loads and knows we're logged in
      window.location.href = "/"; // Use standard redirect for compatibility
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Supabase will send a confirmation email to this address.
        // The link in the email will redirect back to our app.
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(`Sign up failed: ${error.message}`);
    } else {
      // We don't log them in yet. They must confirm their email first.
      setMessage("Sign up successful! Please check your email to verify.");
    }
  };

  // This one function handles both forms
  const handleSubmit = (e: React.FormEvent) => {
    if (isSignUp) {
      handleSignUp(e);
    } else {
      handleSignIn(e);
    }
  };

  // --- The Component UI ---

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md border-gray-200 dark:border-gray-800">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            {/* Our simple logo */}
            <div className="flex justify-center items-center text-emerald-600 dark:text-emerald-500">
              <Compass size={40} />
            </div>

            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {isSignUp ? "Create a Radius Account" : "Welcome to Radius"}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {isSignUp
                ? "Find and share skills in your neighborhood."
                : "Sign in to access your local skill network."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-gray-700 dark:text-gray-300"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="dark:bg-gray-900 dark:text-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-gray-700 dark:text-gray-300"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6} // Supabase default minimum
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="dark:bg-gray-900 dark:text-gray-50"
              />
            </div>

            {/* Display Success/Error Messages */}
            {message && (
              <p className="text-sm font-medium text-green-600 dark:text-green-500">
                {message}
              </p>
            )}
            {error && (
              <p className="text-sm font-medium text-red-600 dark:text-red-500">
                {error}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            {/* Our primary button - it will be Emerald Green */}
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-gray-900"
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            {/* The button to toggle between modes */}
            <Button
              type="button"
              variant="link"
              className="w-full text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setMessage("");
              }}
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
