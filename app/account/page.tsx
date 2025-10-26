"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ProfileModal } from "@/components/ProfileModal";

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";
  const { user, isLoaded } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        router.push("/");
        return;
      }
      setIsModalOpen(true);
    }
  }, [user, isLoaded, router]);

  return (
    <div>
      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          router.push(isOnboarding ? "/home" : "/dashboard");
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
