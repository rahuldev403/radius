"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Award,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Calendar,
  Users,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { UserBadges } from "@/components/UserBadges";

type CreditBalance = {
  balance: number;
  total_earned: number;
  total_spent: number;
  total_received: number;
};

type Transaction = {
  id: number;
  from_user_id: string | null;
  to_user_id: string | null;
  amount: number;
  transaction_type: string;
  reason: string | null;
  created_at: string;
  from_user?: {
    full_name: string;
    avatar_url: string;
  };
  to_user?: {
    full_name: string;
    avatar_url: string;
  };
};

export default function CreditsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCreditsData();
  }, []);

  const fetchCreditsData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setCurrentUser(user);

      // Fetch credit balance
      const { data: balanceData, error: balanceError } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (balanceError && balanceError.code !== "PGRST116") {
        throw balanceError;
      }

      setBalance(balanceData);

      // Fetch transactions (sent and received)
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("credit_transactions")
          .select(
            `
          *,
          from_user:profiles!credit_transactions_from_user_id_fkey (
            full_name,
            avatar_url
          ),
          to_user:profiles!credit_transactions_to_user_id_fkey (
            full_name,
            avatar_url
          )
        `
          )
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(50);

      if (transactionsError) throw transactionsError;

      // Transform transactions
      const transformedTransactions = (transactionsData || []).map(
        (t: any) => ({
          ...t,
          from_user: Array.isArray(t.from_user) ? t.from_user[0] : t.from_user,
          to_user: Array.isArray(t.to_user) ? t.to_user[0] : t.to_user,
        })
      );

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error("Error fetching credits data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "tip":
      case "reward":
        return Gift;
      case "signup":
      case "referral":
        return Award;
      default:
        return Coins;
    }
  };

  const getTransactionColor = (transaction: Transaction, userId: string) => {
    const isReceived = transaction.to_user_id === userId;
    return isReceived ? "text-emerald-600" : "text-orange-600";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl text-white">
              <Coins className="w-8 h-8" />
            </div>
            Credits Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your credits, view transactions, and track your achievements
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  Current Balance
                </p>
              </div>
              <p className="text-3xl font-bold text-amber-900">
                {balance?.balance || 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">Available to spend</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  Total Earned
                </p>
              </div>
              <p className="text-3xl font-bold text-emerald-900">
                {balance?.total_earned || 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">From rewards</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  Total Received
                </p>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {balance?.total_received || 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">From community</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
              </div>
              <p className="text-3xl font-bold text-orange-900">
                {balance?.total_spent || 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">Given to others</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Transaction History
                </CardTitle>
                <CardDescription>
                  Your recent credit transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Coins className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No transactions yet</p>
                    <p className="text-sm mt-1">
                      Start giving credits to providers!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {transactions.map((transaction) => {
                      const isReceived =
                        transaction.to_user_id === currentUser?.id;
                      const Icon = getTransactionIcon(
                        transaction.transaction_type
                      );
                      const otherUser = isReceived
                        ? transaction.from_user
                        : transaction.to_user;

                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all"
                        >
                          <div
                            className={`p-3 rounded-full ${
                              isReceived
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-orange-100 text-orange-600"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {otherUser && (
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={otherUser.avatar_url} />
                                  <AvatarFallback className="text-xs bg-gray-200 text-gray-700">
                                    {getInitials(otherUser.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <p className="font-semibold text-gray-900 truncate">
                                {isReceived ? "Received from" : "Sent to"}{" "}
                                {otherUser?.full_name || "System"}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {transaction.reason ||
                                transaction.transaction_type}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(
                                new Date(transaction.created_at),
                                "MMM d, yyyy 'at' h:mm a"
                              )}
                            </p>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-xl font-bold ${getTransactionColor(
                                transaction,
                                currentUser.id
                              )}`}
                            >
                              {isReceived ? "+" : "-"}
                              {transaction.amount}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                isReceived
                                  ? "border-emerald-300 text-emerald-700"
                                  : "border-orange-300 text-orange-700"
                              }`}
                            >
                              {transaction.transaction_type}
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Badges Section */}
          <div>
            {currentUser && <UserBadges userId={currentUser.id} showTitle />}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
