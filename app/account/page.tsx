"use client";

import { useEffect, useState, Suspense } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ProfileModal } from "@/components/ProfileModal";

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, [isOnboarding]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    setUser(user);

    // If onboarding, open modal automatically
    if (isOnboarding) {
      setIsModalOpen(true);
    } else {
      // If not onboarding, redirect to dashboard
      router.push("/dashboard");
    }
  };

  return (
    <div>
      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (!isOnboarding) {
            router.push("/dashboard");
          }
        }}
        user={user}
        isOnboarding={isOnboarding}
      />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}
