import { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
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
import Loader from "../components/Loader";
import PrimaryButton from "../components/PrimaryButton";

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

export default function FlightDetails() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  // Parse flight data from params
  const flight = useMemo(() => {
    try {
      return JSON.parse(params.flight || "{}");
    } catch {
      return {};
    }
  }, [params.flight]);

  const { from, to, date, passengers } = params;

  useEffect(() => {
    setTimeout(() => setLoading(false), 300);
  }, []);

  function fmtTime(t) {
    try {
      const d = new Date(t);
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "--:--";
    }
  }

  function fmtDuration(a, b) {
    try {
      const start = new Date(a).getTime();
      const end = new Date(b).getTime();
      const diff = Math.max(0, end - start) / 60000;
      const h = Math.floor(diff / 60);
      const m = Math.round(diff % 60);
      return `${h}h ${m}m`;
    } catch {
      return "--";
    }
  }

  function handleSelectSeat() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/seat-selection",
      params: {
        flight: JSON.stringify(flight),
        from,
        to,
        date,
        passengers,
      },
    });
  }

  if (loading) {
    return (
      <Loader message="Loading flight details" subtitle="Please wait..." />
    );
  }

  const duration = fmtDuration(flight.departureTime, flight.arrivalTime);
  const departTime = fmtTime(flight.departureTime);
  const arriveTime = fmtTime(flight.arrivalTime);
  const price = Number(flight.baseFare || 0).toLocaleString("en-IN");

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
            Flight Details
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

      {/* Title + Route */}
      <Animated.View
        entering={FadeInDown.duration(550).delay(80).springify()}
        className="px-6 mt-4"
      >
        <View className="flex-row items-start justify-between">
          <View style={{ maxWidth: "60%" }}>
            <Text className="text-primary font-urbanist-bold text-3xl leading-9">
              Selected
            </Text>
            <Text className="text-primary font-urbanist-bold text-3xl leading-9 -mt-1">
              Flight
            </Text>
          </View>
          <RoutePill from={from} to={to} />
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View
        entering={FadeInUp.duration(600).delay(180).springify()}
        className="flex-1 px-6 mt-4"
        style={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Flight Ticket Card */}
        <View className="relative mt-4">
          <View className="bg-primary rounded-[28px] p-5 overflow-hidden">
            {/* Top row times/cities + arc */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-text/90 font-urbanist-semibold text-[11px]">
                  {from}
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
                  {to}
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
              <Text className="text-text font-urbanist-bold text-2xl">
                AerisGo
              </Text>
              <Text className="text-text font-urbanist-bold text-xl">
                ₹ {price}
              </Text>
            </View>
          </View>

          {/* Ticket notches */}
          <Notch side="left" />
          <Notch side="right" />
        </View>

        {/* Flight Info Section */}
        <View className="mt-6 bg-secondary/40 rounded-[24px] p-5 border border-primary/10">
          <Text className="text-primary font-urbanist-bold text-base mb-4">
            Flight Information
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-primary/70 font-urbanist-medium text-sm">
                Flight Number
              </Text>
              <Text className="text-primary font-urbanist-semibold text-sm">
                {flight.flightNumber || "AG-101"}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-primary/70 font-urbanist-medium text-sm">
                Aircraft
              </Text>
              <Text className="text-primary font-urbanist-semibold text-sm">
                {flight.aircraft || "A320 Neo"}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-primary/70 font-urbanist-medium text-sm">
                Date
              </Text>
              <Text className="text-primary font-urbanist-semibold text-sm">
                {new Date(date).toLocaleDateString()}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-primary/70 font-urbanist-medium text-sm">
                Passengers
              </Text>
              <Text className="text-primary font-urbanist-semibold text-sm">
                {passengers || 1}
              </Text>
            </View>
          </View>
        </View>

        {/* Amenities */}
        <View className="mt-6 mb-4">
          <Text className="text-primary font-urbanist-bold text-base mb-4">
            Amenities
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {[
              { icon: "wifi", label: "Wi-Fi" },
              { icon: "restaurant", label: "Meals" },
              { icon: "tv", label: "Entertainment" },
              { icon: "briefcase", label: "Baggage" },
            ].map((item, i) => (
              <View
                key={i}
                className="bg-secondary/40 rounded-[20px] px-5 py-4 items-center border border-primary/10"
                style={{ width: "22%" }}
              >
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mb-2">
                  <Ionicons name={item.icon} size={20} color="#541424" />
                </View>
                <Text className="text-primary font-urbanist-medium text-xs text-center">
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Bottom Button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6"
        style={{ paddingBottom: insets.bottom + 5 }}
      >
        <PrimaryButton title="Select Seat" onPress={handleSelectSeat} />
      </View>
    </View>
  );
}
