import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from "@/components/AppLayout";
import { AccessibilityProvider } from "@/lib/accessibility-context";
import { AccessibilityButton } from "@/components/AccessibilityButton";
import { ClerkProvider } from '@clerk/nextjs'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radius - Skill Sharing Platform",
  description: "Connect, share skills, and book services in your area",
  icons: {
    icon: [
      { url: "/logo.png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <AccessibilityProvider>
            <a href="#main-content" className="skip-to-content">
              Skip to main content
            </a>
            <AppLayout>{children}</AppLayout>
            <AccessibilityButton />
            <Toaster />
          </AccessibilityProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
