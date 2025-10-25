"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Send, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type GiveCreditsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  bookingId?: number;
  serviceId?: number;
};

const QUICK_AMOUNTS = [10, 25, 50, 100];

export function GiveCreditsModal({
  isOpen,
  onClose,
  providerId,
  providerName,
  providerAvatar,
  bookingId,
  serviceId,
}: GiveCreditsModalProps) {
  const [amount, setAmount] = useState<number>(25);
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  // Fetch user's credit balance when modal opens
  useState(() => {
    if (isOpen) {
      fetchUserBalance();
    }
  });

  const fetchUserBalance = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setUserBalance(data?.balance || 0);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const handleGiveCredits = async () => {
    if (amount <= 0) {
      toast.error("Invalid amount", {
        description: "Please enter a positive amount",
      });
      return;
    }

    if (userBalance !== null && amount > userBalance) {
      toast.error("Insufficient credits", {
        description: `You only have ${userBalance} credits available`,
      });
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to give credits");
        return;
      }

      // Call the give_credits function
      const { data, error } = await supabase.rpc("give_credits", {
        p_from_user_id: user.id,
        p_to_user_id: providerId,
        p_amount: amount,
        p_transaction_type: "tip",
        p_reason: reason || `Thank you for your great service!`,
        p_reference_type: bookingId ? "booking" : serviceId ? "service" : null,
        p_reference_id: bookingId || serviceId || null,
      });

      if (error) throw error;

      if (data && !data.success) {
        throw new Error(data.error || "Failed to give credits");
      }

      toast.success("Credits sent!", {
        description: `You gave ${amount} credits to ${providerName}`,
        icon: "🎉",
      });

      // Update local balance
      if (data && data.new_balance !== undefined) {
        setUserBalance(data.new_balance);
      }

      // Reset form
      setAmount(25);
      setReason("");
      onClose();
    } catch (error: any) {
      console.error("Error giving credits:", error);
      toast.error("Failed to send credits", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[10001] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <Coins className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Give Credits</h2>
                    <p className="text-amber-100 text-sm">
                      Reward great service
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Provider Info */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                  <Avatar className="w-12 h-12 ring-2 ring-amber-300">
                    <AvatarImage src={providerAvatar} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold">
                      {getInitials(providerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {providerName}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Service Provider
                    </p>
                  </div>
                </div>

                {/* User Balance */}
                {userBalance !== null && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600">Your Balance:</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {userBalance} credits
                    </span>
                  </div>
                )}

                {/* Quick Amount Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Amount
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_AMOUNTS.map((quickAmount) => (
                      <button
                        key={quickAmount}
                        onClick={() => setAmount(quickAmount)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          amount === quickAmount
                            ? "border-amber-500 bg-amber-50 text-amber-700 font-bold scale-105"
                            : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
                        }`}
                      >
                        {quickAmount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or Enter Custom Amount
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    min="1"
                    max={userBalance || undefined}
                    placeholder="Enter amount"
                    className="text-lg font-semibold"
                  />
                </div>

                {/* Reason (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Add a thank you message..."
                    rows={3}
                    maxLength={200}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reason.length}/200 characters
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGiveCredits}
                    disabled={loading || amount <= 0}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                  >
                    {loading ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send {amount} Credits
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
