import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { getRewardBalance } from "../lib/rewards";
import { toast } from "../lib/toast";

export default function RewardsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalRedeemed: 0,
    transactionCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [filter, setFilter] = useState("all"); // all, earn, redeem

  // Block Android hardware back from leaving the main tab
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => sub.remove();
    }, [])
  );

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const data = await getRewardBalance();
      setBalance(data.balance || 0);
      setStats({
        totalEarned: data.totalEarned || 0,
        totalRedeemed: data.totalRedeemed || 0,
        transactionCount: data.transactionCount || 0,
      });
      setRecentTransactions(data.recentTransactions || []);
    } catch (err) {
      console.error("Failed to fetch rewards:", err);
      toast.error({
        title: "Error",
        message: err?.message || "Failed to load rewards",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRewards();
  }, []);

  const handleFilterPress = async (newFilter) => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    setFilter(newFilter);
  };

  const filteredTransactions = recentTransactions.filter((txn) => {
    if (filter === "all") return true;
    return txn.type === filter;
  });

  const getTransactionIcon = (type) => {
    return type === "earn" ? "arrow-down-circle" : "arrow-up-circle";
  };

  const getTransactionColor = (type) => {
    return type === "earn" ? "#10b981" : "#ef4444";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#541424" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Sticky Header */}
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="px-6 pt-6 pb-4 bg-background"
      >
        <Text className="text-primary font-urbanist-bold text-3xl">
          Rewards
        </Text>
        <Text className="text-primary/70 font-urbanist-medium text-base mt-1">
          Earn points with every flight
        </Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Balance Card */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          className="mx-6 mb-6 overflow-hidden rounded-[36px] bg-primary border border-secondary/15"
        >
          <View className="p-6">
            {/* Decorative circles */}
            <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
            <View className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/5" />

            <View className="relative z-10">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="gift" size={20} color="#e3d7cb" />
                <Text className="text-text/80 font-urbanist text-sm">
                  Available Balance
                </Text>
              </View>
              <Text className="text-5xl font-urbanist-bold text-text mb-6">
                {balance.toLocaleString()}
              </Text>

              {/* Stats Row */}
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-text/60 font-urbanist text-xs mb-1">
                    Total Earned
                  </Text>
                  <Text className="text-text font-urbanist-semibold text-lg">
                    {stats.totalEarned.toLocaleString()}
                  </Text>
                </View>
                <View>
                  <Text className="text-text/60 font-urbanist text-xs mb-1">
                    Total Redeemed
                  </Text>
                  <Text className="text-text font-urbanist-semibold text-lg">
                    {stats.totalRedeemed.toLocaleString()}
                  </Text>
                </View>
                <View>
                  <Text className="text-text/60 font-urbanist text-xs mb-1">
                    Transactions
                  </Text>
                  <Text className="text-text font-urbanist-semibold text-lg">
                    {stats.transactionCount}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(300)}
          className="mx-6 mb-6 flex-row gap-3"
        >
          <Pressable className="flex-1 rounded-[28px] bg-primary/5 p-4 border border-primary/10">
            <View className="h-12 w-12 rounded-full bg-primary/10 items-center justify-center mb-3">
              <Ionicons name="airplane" size={24} color="#541424" />
            </View>
            <Text className="text-primary font-urbanist-semibold text-base mb-1">
              Earn More
            </Text>
            <Text className="text-primary/60 font-urbanist text-xs">
              Book flights to earn
            </Text>
          </Pressable>

          <Pressable className="flex-1 rounded-[28px] bg-primary/5 p-4 border border-primary/10">
            <View className="h-12 w-12 rounded-full bg-primary/10 items-center justify-center mb-3">
              <Ionicons name="card" size={24} color="#541424" />
            </View>
            <Text className="text-primary font-urbanist-semibold text-base mb-1">
              Redeem
            </Text>
            <Text className="text-primary/60 font-urbanist text-xs">
              Use your points
            </Text>
          </Pressable>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(400)} className="mx-6 mb-4">
          <BlurView
            intensity={20}
            tint="light"
            className="flex-row rounded-[28px] overflow-hidden border border-primary/10"
          >
            {["all", "earn", "redeem"].map((f) => (
              <Pressable
                key={f}
                onPress={() => handleFilterPress(f)}
                className={`flex-1 py-3 items-center ${
                  filter === f ? "bg-primary" : "bg-transparent"
                }`}
              >
                <Text
                  className={`font-urbanist-semibold text-sm capitalize ${
                    filter === f ? "text-text" : "text-primary/60"
                  }`}
                >
                  {f}
                </Text>
              </Pressable>
            ))}
          </BlurView>
        </Animated.View>

        {/* Transaction History */}
        <Animated.View entering={FadeInDown.delay(500)} className="mx-6">
          <Text className="text-lg font-urbanist-bold text-primary mb-4">
            Recent Activity
          </Text>

          {filteredTransactions.length === 0 ? (
            <View className="py-12 items-center">
              <Ionicons
                name="receipt-outline"
                size={48}
                color="#541424"
                opacity={0.3}
              />
              <Text className="text-primary/40 font-urbanist text-sm mt-3">
                No transactions yet
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {filteredTransactions.map((txn, index) => (
                <Animated.View
                  key={txn._id}
                  entering={FadeInUp.delay(index * 50)}
                  layout={Layout.springify()}
                >
                  <BlurView
                    intensity={40}
                    tint="light"
                    className="rounded-[28px] overflow-hidden border border-primary/10"
                  >
                    <View className="p-4 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1">
                        <View
                          className="h-12 w-12 rounded-full items-center justify-center"
                          style={{
                            backgroundColor: `${getTransactionColor(txn.type)}15`,
                          }}
                        >
                          <Ionicons
                            name={getTransactionIcon(txn.type)}
                            size={24}
                            color={getTransactionColor(txn.type)}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-primary font-urbanist-semibold text-base">
                            {txn.description ||
                              (txn.type === "earn"
                                ? "Points Earned"
                                : "Points Redeemed")}
                          </Text>
                          <Text className="text-primary/50 font-urbanist text-xs mt-0.5">
                            {formatDate(txn.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <Text
                        className="font-urbanist-bold text-lg"
                        style={{ color: getTransactionColor(txn.type) }}
                      >
                        {txn.type === "earn" ? "+" : "-"}
                        {txn.points}
                      </Text>
                    </View>
                  </BlurView>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
