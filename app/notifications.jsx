import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Loader from "../components/Loader";
import { getMyNotifications, markNotificationRead } from "../lib/notifications";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchNotifications({ initial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchNotifications({ initial = false } = {}) {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const list = await getMyNotifications({ limit: 50 });
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setTimeout(() => {
        if (initial) {
          setLoading(false);
        }
        setRefreshing(false);
      }, 200);
    }
  }

  function formatDateTime(value) {
    if (!value) return "";
    try {
      const d = new Date(value);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  }

  function getTypeMeta(type) {
    switch (type) {
      case "alert":
        return {
          icon: "alert-circle-outline",
          tint: "#b91c1c",
          pillClass: "bg-red-50 border-red-200",
          pillTextClass: "text-red-700",
        };
      case "reminder":
        return {
          icon: "time-outline",
          tint: "#92400e",
          pillClass: "bg-amber-50 border-amber-200",
          pillTextClass: "text-amber-700",
        };
      default:
        return {
          icon: "information-circle-outline",
          tint: "#1d4ed8",
          pillClass: "bg-blue-50 border-blue-200",
          pillTextClass: "text-blue-700",
        };
    }
  }

  async function handlePressNotification(item) {
    try {
      await Haptics.selectionAsync();
    } catch {}

    if (!item?._id) return;

    if (!item.isRead) {
      // Optimistic update
      setItems((prev) =>
        prev.map((n) =>
          n._id === item._id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );

      try {
        await markNotificationRead(item._id);
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    // Future: deep-link to booking / flight using item.data
  }

  if (loading) {
    return (
      <Loader
        message="Loading notifications"
        subtitle="Fetching your latest updates"
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))}
        className="px-6 pt-6 pb-4 border-b border-primary/10"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            accessibilityLabel="Go back"
            className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15"
            onPress={async () => {
              try {
                await Haptics.selectionAsync();
              } catch {}
              router.back();
            }}
          >
            <Ionicons name="chevron-back" size={22} color="#541424" />
          </TouchableOpacity>
          <Text className="text-primary font-urbanist-semibold text-lg">
            Notifications
          </Text>
          {/* Placeholder to keep header balanced */}
          <View className="w-14 h-14 rounded-full bg-transparent" />
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View
        entering={FadeInUp.duration(400)
          .delay(100)
          .easing(Easing.out(Easing.cubic))}
        className="flex-1"
      >
        {items.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
              <Ionicons
                name="notifications-off-outline"
                size={36}
                color="#541424"
              />
            </View>
            <Text className="text-primary font-urbanist-bold text-xl mb-1 text-center">
              No notifications yet
            </Text>
            <Text className="text-primary/70 font-urbanist text-sm text-center">
              Booking updates, flight changes, and reminders will appear here.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: insets.bottom + 24,
              paddingTop: 8,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchNotifications({ initial: false })}
                tintColor="#541424"
              />
            }
          >
            {items.map((item) => {
              const meta = getTypeMeta(item.type);
              const isRead = item.isRead;
              const containerCls =
                "mb-3 p-4 rounded-3xl border flex-row gap-3 " +
                (isRead
                  ? "bg-secondary/40 border-primary/10"
                  : "bg-primary/10 border-primary/20");

              return (
                <TouchableOpacity
                  key={item._id}
                  activeOpacity={0.8}
                  onPress={() => handlePressNotification(item)}
                >
                  <View className={containerCls}>
                    <View className="w-10 h-10 rounded-full items-center justify-center bg-background/60">
                      <Ionicons name={meta.icon} size={20} color={meta.tint} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text
                          numberOfLines={1}
                          className="text-primary font-urbanist-semibold text-sm mr-2"
                        >
                          {item.title}
                        </Text>
                        <Text className="text-primary/50 font-urbanist text-[10px]">
                          {formatDateTime(item.createdAt)}
                        </Text>
                      </View>
                      <Text className="text-primary/80 font-urbanist text-xs mb-2">
                        {item.message}
                      </Text>
                      <View className="flex-row items-center justify-between">
                        <View
                          className={`px-2 py-1 rounded-full border ${meta.pillClass}`}
                        >
                          <Text
                            className={`text-[10px] font-urbanist-semibold uppercase ${meta.pillTextClass}`}
                          >
                            {item.type || "info"}
                          </Text>
                        </View>
                        {!isRead && (
                          <View className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}
