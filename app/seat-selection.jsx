import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Loader from "../components/Loader";
import PrimaryButton from "../components/PrimaryButton";
import { toast } from "../lib/toast";
import { apiFetch } from "../lib/api";

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

const SeatButton = ({ seat, selected, onPress, rowClass }) => {
  const getSeatColor = () => {
    if (selected) return "#541424"; // Primary - Selected
    if (!seat.isAvailable) return "#dc2626"; // Red - Occupied
    if (seat.isExtraLegroom) return "#eab308"; // Yellow - Extra Legroom
    if (rowClass === "first") return "#a855f7"; // Purple - First Class
    if (rowClass === "business") return "#3b82f6"; // Blue - Business
    return "#6b7280"; // Grey - Economy
  };

  const getBorderColor = () => {
    if (selected) return "#6b1a2f";
    if (!seat.isAvailable) return "#991b1b";
    if (seat.isExtraLegroom) return "#ca8a04";
    if (rowClass === "first") return "#7c3aed";
    if (rowClass === "business") return "#2563eb";
    return "#4b5563";
  };

  const handlePress = () => {
    if (!seat.isAvailable) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast.warn({
        title: "Unavailable",
        message: "This seat is already booked",
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(seat);
  };

  return (
    <ScaleOnPress onPress={handlePress}>
      <View
        className="w-11 h-11 rounded-[12px] items-center justify-center border-2"
        style={{
          backgroundColor: getSeatColor(),
          borderColor: getBorderColor(),
        }}
      >
        <Ionicons
          name={seat.isAvailable ? "square-outline" : "close"}
          size={14}
          color="#e3d7cb"
        />
        <Text className="text-[8px] font-urbanist-bold text-text mt-0.5">
          {seat.seatNumber}
        </Text>
      </View>
    </ScaleOnPress>
  );
};

export default function SeatSelection() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);

  const flight = useMemo(() => {
    try {
      return JSON.parse(params.flight || "{}");
    } catch {
      return {};
    }
  }, [params.flight]);

  const { from, to, date, passengers } = params;
  const maxSeats = parseInt(passengers || 1);

  useEffect(() => {
    fetchData();
  }, [flight]);

  async function fetchData() {
    try {
      setLoading(true);

      // Check if user already has a booking on this flight
      const bookingsRes = await apiFetch("/bookings/my-bookings", {
        method: "GET",
        auth: true,
      });

      const existingBooking = bookingsRes.data?.items?.find(
        (booking) =>
          booking.flightId?._id === flight._id &&
          (booking.status === "confirmed" || booking.status === "pending")
      );

      if (existingBooking) {
        setLoading(false);
        toast.error({
          title: "Already Booked",
          message: `You already have a booking on this flight (Seat ${existingBooking.seatNumber})`,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => {
          router.back();
        }, 2000);
        return;
      }

      // Fetch seats
      const seatsRes = await apiFetch(`/seats/flight/${flight._id}`, {
        method: "GET",
        auth: true,
      });

      // Fetch pricing config
      const pricingRes = await apiFetch("/pricing/config", {
        method: "GET",
        auth: true,
      });

      setSeats(seatsRes.data.seats || []);
      setPricingConfig(pricingRes.data.config);
    } catch (err) {
      toast.error({
        title: "Error",
        message: err?.message || "Failed to load seats",
      });
      router.back();
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  }

  function handleSeatSelect(seat) {
    const isAlreadySelected = selectedSeats.some(
      (s) => s.seatNumber === seat.seatNumber
    );

    if (isAlreadySelected) {
      setSelectedSeats(
        selectedSeats.filter((s) => s.seatNumber !== seat.seatNumber)
      );
    } else {
      if (selectedSeats.length >= maxSeats) {
        toast.warn({
          title: "Limit Reached",
          message: `You can only select ${maxSeats} seat(s)`,
        });
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  }

  function handleContinue() {
    if (selectedSeats.length === 0) {
      toast.warn({
        title: "No Seat Selected",
        message: "Please select at least one seat",
      });
      return;
    }

    if (selectedSeats.length < maxSeats) {
      toast.warn({
        title: "Incomplete Selection",
        message: `Please select ${maxSeats} seat(s)`,
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: "/booking-confirmation",
      params: {
        flight: JSON.stringify(flight),
        seats: JSON.stringify(selectedSeats),
        from,
        to,
        date,
        passengers,
      },
    });
  }

  // Group seats by row
  const seatsByRow = useMemo(() => {
    const rows = {};
    seats.forEach((seat) => {
      const match = seat.seatNumber.match(/^(\d+)([A-F])$/);
      if (match) {
        const rowNum = parseInt(match[1]);
        if (!rows[rowNum]) rows[rowNum] = {};
        rows[rowNum][match[2]] = seat;
      }
    });
    return rows;
  }, [seats]);

  const rowNumbers = Object.keys(seatsByRow)
    .map(Number)
    .sort((a, b) => a - b);

  const getRowClass = (rowNum) => {
    if (rowNum <= 2) return "first";
    if (rowNum <= 7) return "business";
    return "economy";
  };

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!pricingConfig) return 0;

    let total = 0;
    selectedSeats.forEach((seat) => {
      const classMultiplier =
        pricingConfig.travelClass[seat.travelClass]?.multiplier || 1;
      const classPrice = flight.baseFare * classMultiplier;
      const extraLegroom = seat.isExtraLegroom
        ? pricingConfig.extraLegroom.charge
        : 0;
      const subtotal = classPrice + extraLegroom;

      // Add taxes
      const gst = subtotal * pricingConfig.taxes.gst;
      const fuelSurcharge = subtotal * pricingConfig.taxes.fuelSurcharge;
      const airportFee = pricingConfig.taxes.airportFee;

      total += subtotal + gst + fuelSurcharge + airportFee;
    });

    return Math.round(total * 100) / 100;
  }, [selectedSeats, pricingConfig, flight.baseFare]);

  if (loading) {
    return <Loader message="Loading seat map" subtitle="Please wait..." />;
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
            Select Seats
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
              Choose
            </Text>
            <Text className="text-primary font-urbanist-bold text-3xl leading-9 -mt-1">
              Your Seat
            </Text>
          </View>
          <RoutePill from={from} to={to} />
        </View>
      </Animated.View>

      {/* Selection Info */}
      <Animated.View
        entering={FadeInDown.duration(550).delay(120).springify()}
        className="px-6 mt-4"
      >
        <View className="bg-secondary/40 rounded-[20px] p-4 border border-primary/10">
          <View className="flex-row items-center justify-between">
            <Text className="text-primary/70 font-urbanist-medium text-sm">
              Selected
            </Text>
            <Text className="text-primary font-urbanist-bold text-lg">
              {selectedSeats.length} / {maxSeats}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Horizontal Seat Map */}
      <Animated.View
        entering={FadeInRight.duration(600).delay(150).springify()}
        className="flex-1 mt-4"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
          snapToInterval={100}
          decelerationRate="fast"
        >
          {/* Cockpit */}
          <View className="w-20 mr-3">
            {/* Top spacing to match row labels (h-4 + h-6 + mb-1 + mb-1 = 44px) */}
            <View className="h-11" />
            <View className="w-16 h-[340px] bg-primary/10 rounded-l-[32px] border-2 border-primary/20 items-center justify-center">
              <Ionicons name="airplane" size={28} color="#541424" />
              <Text className="text-primary font-urbanist-bold text-[10px] mt-2">
                COCKPIT
              </Text>
            </View>
          </View>

          {/* Seat Rows */}
          {rowNumbers.map((rowNum, index) => {
            const row = seatsByRow[rowNum];
            const rowClass = getRowClass(rowNum);
            const isExitRow = rowNum === 10 || rowNum === 11;
            const isFirstOfClass = rowNum === 1 || rowNum === 3 || rowNum === 8;

            return (
              <Animated.View
                key={rowNum}
                entering={FadeInRight.duration(400).delay(200 + index * 20)}
                className="w-24 mr-1.5"
              >
                {/* Class Label - Fixed height container for consistent alignment */}
                <View className="items-center mb-1 h-4">
                  {isFirstOfClass && (
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        rowClass === "first"
                          ? "bg-purple-500/20"
                          : rowClass === "business"
                            ? "bg-blue-500/20"
                            : "bg-gray-500/20"
                      }`}
                    >
                      <Text
                        className={`font-urbanist-bold text-[9px] ${
                          rowClass === "first"
                            ? "text-purple-700"
                            : rowClass === "business"
                              ? "text-blue-700"
                              : "text-gray-700"
                        }`}
                      >
                        {rowClass === "first"
                          ? "FIRST"
                          : rowClass === "business"
                            ? "BUSINESS"
                            : "ECONOMY"}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Row Number Top - Fixed height container */}
                <View className="items-center mb-1 h-6">
                  <Text className="text-primary/50 font-urbanist-bold text-[11px]">
                    {rowNum}
                  </Text>
                  {isExitRow && (
                    <View className="bg-yellow-500/20 px-1.5 py-0.5 rounded-full mt-0.5">
                      <Text className="text-yellow-700 font-urbanist-bold text-[8px]">
                        EXIT
                      </Text>
                    </View>
                  )}
                </View>

                {/* Seats Column - Vertical arrangement from bottom to top (A to F) */}
                <View className="h-[300px] justify-center items-center">
                  <View className="gap-2">
                    {/* Window Seat F (Right side) - TOP */}
                    {["F"].map((letter) => {
                      const seat = row[letter];
                      if (!seat) return <View key={letter} className="h-11" />;
                      return (
                        <SeatButton
                          key={letter}
                          seat={seat}
                          selected={selectedSeats.some(
                            (s) => s.seatNumber === seat.seatNumber
                          )}
                          onPress={handleSeatSelect}
                          rowClass={rowClass}
                        />
                      );
                    })}

                    {/* Middle Seat E (Right side) */}
                    {["E"].map((letter) => {
                      const seat = row[letter];
                      if (!seat) return <View key={letter} className="h-11" />;
                      return (
                        <SeatButton
                          key={letter}
                          seat={seat}
                          selected={selectedSeats.some(
                            (s) => s.seatNumber === seat.seatNumber
                          )}
                          onPress={handleSeatSelect}
                          rowClass={rowClass}
                        />
                      );
                    })}

                    {/* Aisle Seat D (Right side) */}
                    {["D"].map((letter) => {
                      const seat = row[letter];
                      if (!seat) return <View key={letter} className="h-11" />;
                      return (
                        <SeatButton
                          key={letter}
                          seat={seat}
                          selected={selectedSeats.some(
                            (s) => s.seatNumber === seat.seatNumber
                          )}
                          onPress={handleSeatSelect}
                          rowClass={rowClass}
                        />
                      );
                    })}

                    {/* Aisle Separator */}
                    <View className="h-4 items-center justify-center">
                      <View className="w-full h-[2px] bg-blue-300/40" />
                    </View>

                    {/* Aisle Seat C (Left side) */}
                    {["C"].map((letter) => {
                      const seat = row[letter];
                      if (!seat) return <View key={letter} className="h-11" />;
                      return (
                        <SeatButton
                          key={letter}
                          seat={seat}
                          selected={selectedSeats.some(
                            (s) => s.seatNumber === seat.seatNumber
                          )}
                          onPress={handleSeatSelect}
                          rowClass={rowClass}
                        />
                      );
                    })}

                    {/* Middle Seat B (Left side) */}
                    {["B"].map((letter) => {
                      const seat = row[letter];
                      if (!seat) return <View key={letter} className="h-11" />;
                      return (
                        <SeatButton
                          key={letter}
                          seat={seat}
                          selected={selectedSeats.some(
                            (s) => s.seatNumber === seat.seatNumber
                          )}
                          onPress={handleSeatSelect}
                          rowClass={rowClass}
                        />
                      );
                    })}

                    {/* Window Seat A (Left side) - BOTTOM */}
                    {["A"].map((letter) => {
                      const seat = row[letter];
                      if (!seat) return <View key={letter} className="h-11" />;
                      return (
                        <SeatButton
                          key={letter}
                          seat={seat}
                          selected={selectedSeats.some(
                            (s) => s.seatNumber === seat.seatNumber
                          )}
                          onPress={handleSeatSelect}
                          rowClass={rowClass}
                        />
                      );
                    })}
                  </View>
                </View>

                {/* Row Number Bottom - Fixed height container */}
                <View className="items-center mt-1 h-4">
                  <Text className="text-primary/50 font-urbanist-bold text-[11px]">
                    {rowNum}
                  </Text>
                </View>
              </Animated.View>
            );
          })}

          {/* Tail */}
          <View className="w-20 ml-3">
            {/* Top spacing to match row labels (h-4 + h-6 + mb-1 + mb-1 = 44px) */}
            <View className="h-11" />
            <View className="w-16 h-[340px] bg-primary/10 rounded-r-[32px] border-2 border-primary/20 items-center justify-center">
              <Ionicons name="exit-outline" size={24} color="#541424" />
              <Text className="text-primary font-urbanist-bold text-[10px] mt-2">
                TAIL
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Legend */}
      <Animated.View
        entering={FadeInUp.duration(550).delay(200).springify()}
        className="px-6 mt-2"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 rounded bg-purple-500" />
            <Text className="text-primary/70 font-urbanist-medium text-xs">
              First
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 rounded bg-blue-500" />
            <Text className="text-primary/70 font-urbanist-medium text-xs">
              Business
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 rounded bg-gray-500" />
            <Text className="text-primary/70 font-urbanist-medium text-xs">
              Economy
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 rounded bg-yellow-500" />
            <Text className="text-primary/70 font-urbanist-medium text-xs">
              Extra Legroom
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 rounded bg-red-600" />
            <Text className="text-primary/70 font-urbanist-medium text-xs">
              Occupied
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 rounded bg-primary" />
            <Text className="text-primary/70 font-urbanist-medium text-xs">
              Selected
            </Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Bottom Button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6"
        style={{ paddingBottom: insets.bottom + 5 }}
      >
        <View className="bg-secondary/40 rounded-[20px] p-3 mb-2 border border-primary/10">
          <View className="flex-row items-center justify-between">
            <Text className="text-primary/70 font-urbanist-medium text-sm">
              Total Fare
            </Text>
            <Text className="text-primary font-urbanist-bold text-xl">
              ₹ {totalPrice.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>
        <PrimaryButton
          title="Continue to Payment"
          onPress={handleContinue}
          disabled={selectedSeats.length === 0}
        />
      </View>
    </View>
  );
}
