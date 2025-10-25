"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useEffect, useState } from "react";
import {
  Home,
  MapPin,
  Calendar,
  Users,
  Coins,
  User,
  Sparkles,
  LogOut,
} from "lucide-react";

interface AnimatedIconProps {
  type:
    | "home"
    | "explore"
    | "calendar"
    | "users"
    | "coins"
    | "profile"
    | "sparkles"
    | "logout";
  className?: string;
  isActive?: boolean;
  size?: number;
}

// Working animated icons from LottieFiles public library
const iconUrls = {
  home: "https://assets2.lottiefiles.com/packages/lf20_puciaact.json",
  explore: "https://assets5.lottiefiles.com/packages/lf20_V9t630.json",
  calendar: "https://assets9.lottiefiles.com/packages/lf20_edwrdo6o.json",
  users: "https://assets4.lottiefiles.com/packages/lf20_kyu7xb1v.json",
  coins: "https://assets10.lottiefiles.com/packages/lf20_uu0x8lqv.json",
  profile: "https://assets1.lottiefiles.com/packages/lf20_x62chJ.json",
  sparkles:
    "https://lottie.host/e0421b96-449c-4e72-964a-f615f15968b4/2PeNfxJ1HD.lottie",
  logout: "https://assets3.lottiefiles.com/packages/lf20_jbrw0kua.json",
};

// Fallback Lucide icons
const fallbackIcons = {
  home: Home,
  explore: MapPin,
  calendar: Calendar,
  users: Users,
  coins: Coins,
  profile: User,
  sparkles: Sparkles,
  logout: LogOut,
};

export function AnimatedIcon({
  type,
  className = "",
  isActive = false,
  size = 24,
}: AnimatedIconProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Trigger animation when active
    if (isActive) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  // If there's an error loading the animation, use fallback Lucide icon
  if (hasError) {
    const FallbackIcon = fallbackIcons[type];
    return <FallbackIcon className={className} width={size} height={size} />;
  }

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <DotLottieReact
        src={iconUrls[type]}
        loop={isActive || shouldAnimate}
        autoplay={isActive || shouldAnimate}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

// Individual exports for easy use
export function HomeIcon(props: Omit<AnimatedIconProps, "type">) {
  return <AnimatedIcon type="home" {...props} />;
}

export function ExploreIcon(props: Omit<AnimatedIconProps, "type">) {
  return <AnimatedIcon type="explore" {...props} />;
}

export function CalendarIcon(props: Omit<AnimatedIconProps, "type">) {
  return <AnimatedIcon type="calendar" {...props} />;
}

export function UsersIcon(props: Omit<AnimatedIconProps, "type">) {
  return <AnimatedIcon type="users" {...props} />;
}

export function CoinsIcon(props: Omit<AnimatedIconProps, "type">) {
  return <AnimatedIcon type="coins" {...props} />;
}

export function ProfileIcon(props: Omit<AnimatedIconProps, "type">) {
  return <AnimatedIcon type="profile" {...props} />;
}

export function SparklesIcon(props: Omit<AnimatedIconProps, "type">) {
  return <AnimatedIcon type="sparkles" {...props} />;
}

export function LogoutIcon(props: Omit<AnimatedIconProps, "type">) {
  return <AnimatedIcon type="logout" {...props} />;
}
