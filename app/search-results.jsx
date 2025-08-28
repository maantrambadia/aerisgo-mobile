import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { searchFlightsApi } from "../lib/flights";
import { toast } from "../lib/toast";

// Micro-interaction: press-scale wrapper used across header buttons and chips
const ScaleOnPress = ({ children, className = "", onPress, ...rest }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 220 });
      }}
      onPress={onPress}
      className={className}
      {...rest}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
};

const Chip = ({
  label,
  icon,
  active = false,
  onPress,
  variant = "default",
  disabled = false,
  disabledMessage,
}) => {
  const isPrimary = active || variant === "primary";
  const isGhost = variant === "ghost";
  const containerCls =
    "items-center justify-center px-5 py-3 rounded-full border " +
    (isPrimary
      ? "bg-primary border-transparent"
      : isGhost
        ? "bg-primary/10 border-primary/20"
        : "bg-secondary border-primary/15");
  const tint = isPrimary ? "#e3d7cb" : "#541424";
  if (disabled) {
    // Still allow press to show a toast, but visually disabled
    return (
      <Pressable
        onPress={() => {
          if (disabledMessage) {
            toast.warn({ title: "Unavailable", message: disabledMessage });
          }
        }}
        className={containerCls + " opacity-50"}
        style={{ width: 140 }}
      >
        <View className="flex-row items-center justify-center gap-2">
          {icon ? <Ionicons name={icon} size={18} color={tint} /> : null}
          <Text
            numberOfLines={1}
            className={
              (isPrimary ? "text-text " : "text-primary/90 ") +
              "font-urbanist-medium text-sm"
            }
          >
            {label}
          </Text>
        </View>
      </Pressable>
    );
  }
  return (
    <ScaleOnPress
      onPress={onPress}
      className={containerCls}
      style={{ width: 140 }}
    >
      <View className="flex-row items-center justify-center gap-2">
        {icon ? <Ionicons name={icon} size={18} color={tint} /> : null}
        <Text
          numberOfLines={1}
          className={
            (isPrimary ? "text-text " : "text-primary/90 ") +
            "font-urbanist-medium text-sm"
          }
        >
          {label}
        </Text>
      </View>
    </ScaleOnPress>
  );
};

// Route pill replacing the earth widget
const RoutePill = ({ from, to }) => {
  const fromShort = String(from).split(",")[0].trim();
  const toShort = String(to).split(",")[0].trim();
  return (
    <View className="rounded-full bg-secondary/60 px-4 py-2 flex-row items-center gap-2 border border-primary/10">
      <Ionicons
        name="airplane"
        size={16}
        color="#541424"
        style={{ transform: [{ rotate: "90deg" }] }}
      />
      <Text className="text-primary font-urbanist-medium">{fromShort}</Text>
      <Ionicons name="arrow-forward" size={16} color="#541424" />
      <Text className="text-primary font-urbanist-medium">{toShort}</Text>
    </View>
  );
};

const Notch = ({ side = "left" }) => (
  <View
    className="absolute w-4 h-4 rounded-full bg-background"
    style={{
      [side]: -8,
      top: "50%",
      marginTop: -8,
      borderWidth: 1,
      borderColor: "#e3d7cb",
    }}
  />
);

const TicketResultCard = ({
  fromCity = "From",
  toCity = "To",
  departTime = "12:30",
  arriveTime = "11:30",
  duration = "--",
  priceInr = 0,
}) => {
  const priceText = useMemo(
    () => `₹ ${Number(priceInr || 0).toLocaleString("en-IN")}`,
    [priceInr]
  );
  return (
    <View className="relative mt-4">
      <View className="bg-primary rounded-[28px] p-5 overflow-hidden">
        {/* Top row times/cities + arc */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-text/90 font-urbanist-semibold text-[11px]">
              {fromCity}
            </Text>
            <Text className="text-text font-urbanist-bold text-2xl mt-1">
              {departTime}
            </Text>
          </View>

          {/* Arc with plane */}
          <View style={{ width: 110, alignItems: "center" }}>
            <View
              style={{
                width: 100,
                height: 44,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: "rgba(227,215,203,0.45)",
                }}
              />
            </View>
            <View className="w-9 h-9 rounded-full items-center justify-center border border-text/40 -mt-6 bg-primary">
              <Ionicons
                name="airplane"
                size={16}
                color="#e3d7cb"
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </View>
          </View>

          <View className="items-end">
            <Text className="text-text/90 font-urbanist-semibold text-[11px]">
              {toCity}
            </Text>
            <Text className="text-text font-urbanist-bold text-2xl mt-1">
              {arriveTime}
            </Text>
          </View>
        </View>

        {/* Duration */}
        <Text className="text-text/70 font-urbanist-medium text-[11px] text-center mt-2">
          {duration}
        </Text>

        {/* Bottom brand/price bar */}
        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-text font-urbanist-bold text-2xl">AerisGo</Text>
          <Text className="text-text font-urbanist-bold text-xl">
            {priceText}
          </Text>
        </View>
      </View>

      {/* Ticket notches */}
      <Notch side="left" />
      <Notch side="right" />
    </View>
  );
};

export default function SearchResults() {
  const params = useLocalSearchParams();
  const { from = "", to = "", date = "", passengers = "1" } = params;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flights, setFlights] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await searchFlightsApi({
          source: from,
          destination: to,
          date,
          passengers: Number(passengers || 1),
        });
        if (!mounted) return;
        setFlights(Array.isArray(res?.flights) ? res.flights : []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to fetch flights");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [from, to, date, passengers]);

  const countText = useMemo(() => {
    const n = flights.length;
    return `${n} ${n === 1 ? "Flight" : "Flights"}`;
  }, [flights.length]);

  function fmtTime(t) {
    try {
      const d = new Date(t);
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "--:--";
    }
  }

  function fmtDuration(a, b) {
    try {
      const start = new Date(a).getTime();
      const end = new Date(b).getTime();
      const diff = Math.max(0, end - start) / 60000; // mins
      const h = Math.floor(diff / 60);
      const m = Math.round(diff % 60);
      return `${h}h ${m}m`;
    } catch {
      return "--";
    }
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="px-6 pt-6"
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
            Search Result
          </Text>

          <TouchableOpacity
            className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15"
            onPress={async () => {
              try {
                await Haptics.selectionAsync();
              } catch {}
            }}
          >
            <Ionicons name="notifications-outline" size={22} color="#541424" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Stats + route */}
      <Animated.View
        entering={FadeInDown.duration(550).delay(80).springify()}
        className="px-6 mt-4"
      >
        <View className="flex-row items-start justify-between">
          <View style={{ maxWidth: "60%" }}>
            <Text className="text-primary font-urbanist-bold text-3xl leading-9">
              {countText}
            </Text>
            <Text className="text-primary font-urbanist-bold text-3xl leading-9 -mt-1">
              Available
            </Text>
          </View>
          <RoutePill from={from} to={to} />
        </View>
      </Animated.View>

      {/* Chips */}
      <Animated.View
        entering={FadeInDown.duration(550).delay(120).springify()}
        className="px-6 mt-4"
      >
        <View className="flex-row items-center gap-3">
          <Chip label="Economy" variant="primary" />
          <Chip
            label="Modify"
            icon="options-outline"
            variant="ghost"
            disabled
            disabledMessage="Modify is currently disabled. This feature will be available soon."
          />
        </View>
      </Animated.View>

      {/* Scrollable results only */}
      <Animated.View
        entering={FadeInUp.duration(600).delay(180).springify()}
        className="flex-1 px-6 mt-4"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {loading ? (
            <View className="mt-8 items-center justify-center">
              <ActivityIndicator color="#541424" />
              <Text className="text-primary/70 mt-3">Searching flights...</Text>
            </View>
          ) : error ? (
            <View className="mt-8 items-center justify-center">
              <Text className="text-primary text-center px-6">{error}</Text>
            </View>
          ) : flights.length === 0 ? (
            <View className="mt-8 items-center justify-center">
              <Text className="text-primary/80">No flights found</Text>
            </View>
          ) : (
            flights.map((f, i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.duration(600)
                  .delay(200 + i * 60)
                  .springify()}
              >
                <TicketResultCard
                  fromCity={from}
                  toCity={to}
                  departTime={fmtTime(f.departureTime)}
                  arriveTime={fmtTime(f.arrivalTime)}
                  duration={fmtDuration(f.departureTime, f.arrivalTime)}
                  priceInr={f.baseFare}
                />
              </Animated.View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
