"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

type VideoCallProps = {
  bookingId: string;
  onClose?: () => void;
};

export function VideoCall({ bookingId, onClose }: VideoCallProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    initializeCall();
  }, [bookingId]);

  const initializeCall = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to join the call");
        return;
      }

      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setUserName(profile?.full_name || "User");

      // Generate or retrieve room name
      const generatedRoomName = `radius-session-${bookingId}`;
      setRoomName(generatedRoomName);

      // Load Jitsi Meet API
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => {
        initJitsi(generatedRoomName, profile?.full_name || "User");
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } catch (error) {
      console.error("Error initializing call:", error);
      toast.error("Failed to initialize video call");
    }
  };

  const initJitsi = (room: string, displayName: string) => {
    const domain = "meet.jit.si";
    const options = {
      roomName: room,
      width: "100%",
      height: "100%",
      parentNode: document.querySelector("#jitsi-container"),
      userInfo: {
        displayName: displayName,
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          "microphone",
          "camera",
          "closedcaptions",
          "desktop",
          "fullscreen",
          "fodeviceselection",
          "hangup",
          "chat",
          "recording",
          "livestreaming",
          "shareaudio",
          "settings",
          "raisehand",
          "videoquality",
          "filmstrip",
          "stats",
          "shortcuts",
          "tileview",
          "videobackgroundblur",
          "help",
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false,
      },
    };

    // @ts-ignore
    const api = new window.JitsiMeetExternalAPI(domain, options);

    api.addEventListener("readyToClose", () => {
      if (onClose) {
        onClose();
      } else {
        router.back();
      }
    });

    api.addEventListener("videoConferenceJoined", () => {
      setLoading(false);
      toast.success("Joined video call successfully!");
    });

    api.addEventListener("participantLeft", () => {
      toast.info("Participant left the call");
    });

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {loading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-white text-lg">Connecting to video call...</p>
            <p className="text-gray-400 text-sm mt-2">Room: {roomName}</p>
          </div>
        </div>
      )}

      <div id="jitsi-container" className="w-full h-full" />

      {onClose && (
        <Button
          onClick={onClose}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700"
          size="icon"
        >
          <X className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
