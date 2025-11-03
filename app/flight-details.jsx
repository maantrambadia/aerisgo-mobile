import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from "react-native";
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

  // Parse outbound and return flights for round-trip
  const outboundFlight = useMemo(() => {
    try {
      return JSON.parse(params.outboundFlight || "{}");
    } catch {
      return {};
    }
  }, [params.outboundFlight]);

  const returnFlight = useMemo(() => {
    try {
      return JSON.parse(params.returnFlight || "{}");
    } catch {
      return {};
    }
  }, [params.returnFlight]);

  const {
    from,
    to,
    date,
    passengers,
    tripType = "oneway",
    returnDate,
  } = params;
  const isRoundTrip = tripType === "roundtrip";
  const displayFlight = isRoundTrip ? outboundFlight : flight;

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

    if (isRoundTrip) {
      router.push({
        pathname: "/seat-selection",
        params: {
          outboundFlight: JSON.stringify(outboundFlight),
          returnFlight: JSON.stringify(returnFlight),
          from,
          to,
          date,
          returnDate,
          passengers,
          tripType: "roundtrip",
        },
      });
    } else {
      router.push({
        pathname: "/seat-selection",
        params: {
          flight: JSON.stringify(flight),
          from,
          to,
          date,
          passengers,
          tripType: "oneway",
        },
      });
    }
  }

  if (loading) {
    return (
      <Loader message="Loading flight details" subtitle="Please wait..." />
    );
  }

  const duration = fmtDuration(
    displayFlight.departureTime,
    displayFlight.arrivalTime
  );
  const departTime = fmtTime(displayFlight.departureTime);
  const arriveTime = fmtTime(displayFlight.arrivalTime);
  const price = Number(displayFlight.baseFare || 0).toLocaleString("en-IN");

  // Return flight details
  const returnDuration = isRoundTrip
    ? fmtDuration(returnFlight.departureTime, returnFlight.arrivalTime)
    : null;
  const returnDepartTime = isRoundTrip
    ? fmtTime(returnFlight.departureTime)
    : null;
  const returnArriveTime = isRoundTrip
    ? fmtTime(returnFlight.arrivalTime)
    : null;
  const returnPrice = isRoundTrip
    ? Number(returnFlight.baseFare || 0).toLocaleString("en-IN")
    : null;

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
              {isRoundTrip ? "Flights" : "Flight"}
            </Text>
            {isRoundTrip && (
              <Text className="text-primary/60 font-urbanist-medium text-sm mt-1">
                Round Trip
              </Text>
            )}
          </View>
          <RoutePill from={from} to={to} />
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        className="flex-1"
      >
        <Animated.View
          entering={FadeInUp.duration(600).delay(180).springify()}
          className="px-6 mt-4"
        >
          {/* Outbound Flight Label */}
          {isRoundTrip && (
            <View className="mb-2 flex-row items-center gap-2">
              <Text className="text-primary font-urbanist-bold text-base">
                Outbound Flight
              </Text>
              <Text className="text-primary/60 font-urbanist text-xs">
                {new Date(date).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>
          )}

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
                  {displayFlight.flightNumber || "AG-101"}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-primary/70 font-urbanist-medium text-sm">
                  Aircraft
                </Text>
                <Text className="text-primary font-urbanist-semibold text-sm">
                  {displayFlight.aircraft || "A320 Neo"}
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

          {/* Return Flight Card - Only for round-trip */}
          {isRoundTrip && returnFlight && (
            <>
              {/* Return Flight Label */}
              <View className="mt-8 mb-2 flex-row items-center gap-2">
                <Text className="text-primary font-urbanist-bold text-base">
                  Return Flight
                </Text>
                <Text className="text-primary/60 font-urbanist text-xs">
                  {new Date(returnDate).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>

              {/* Return Flight Ticket Card */}
              <View className="relative mt-4">
                <View className="bg-primary rounded-[28px] p-5 overflow-hidden">
                  {/* Top row times/cities + arc */}
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-text/90 font-urbanist-semibold text-[11px]">
                        {to}
                      </Text>
                      <Text className="text-text font-urbanist-bold text-2xl mt-1">
                        {returnDepartTime}
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
                        {from}
                      </Text>
                      <Text className="text-text font-urbanist-bold text-2xl mt-1">
                        {returnArriveTime}
                      </Text>
                    </View>
                  </View>

                  {/* Duration */}
                  <Text className="text-text/70 font-urbanist-medium text-[11px] text-center mt-2">
                    {returnDuration}
                  </Text>

                  {/* Bottom brand/price bar */}
                  <View className="flex-row items-center justify-between mt-4">
                    <Text className="text-text font-urbanist-bold text-2xl">
                      AerisGo
                    </Text>
                    <Text className="text-text font-urbanist-bold text-xl">
                      ₹ {returnPrice}
                    </Text>
                  </View>
                </View>

                {/* Ticket notches */}
                <Notch side="left" />
                <Notch side="right" />
              </View>

              {/* Return Flight Info Section */}
              <View className="mt-6 bg-secondary/40 rounded-[24px] p-5 border border-primary/10">
                <Text className="text-primary font-urbanist-bold text-base mb-4">
                  Return Flight Information
                </Text>

                <View className="space-y-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-primary/70 font-urbanist-medium text-sm">
                      Flight Number
                    </Text>
                    <Text className="text-primary font-urbanist-semibold text-sm">
                      {returnFlight.flightNumber || "AG-102"}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-primary/70 font-urbanist-medium text-sm">
                      Aircraft
                    </Text>
                    <Text className="text-primary font-urbanist-semibold text-sm">
                      {returnFlight.aircraft || "A320 Neo"}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-primary/70 font-urbanist-medium text-sm">
                      Date
                    </Text>
                    <Text className="text-primary font-urbanist-semibold text-sm">
                      {new Date(returnDate).toLocaleDateString()}
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
            </>
          )}

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

          {/* Select Seat Button - Inside scrollable content */}
          <View className="mt-8 mb-4">
            <PrimaryButton title="Select Seat" onPress={handleSelectSeat} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
