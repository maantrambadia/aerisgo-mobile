import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Loader from "../../components/Loader";
import PrimaryButton from "../../components/PrimaryButton";
import { toast } from "../../lib/toast";
import { checkEligibility, performCheckIn } from "../../lib/checkin";
import { getBookingById } from "../../lib/bookings";
import { COLORS } from "../../constants/colors";

export default function CheckIn() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [booking, setBooking] = useState(null);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [bookingData, eligibilityData] = await Promise.all([
        getBookingById(id),
        checkEligibility(id).catch(() => null),
      ]);

      setBooking(bookingData);
      setEligibility(eligibilityData);
    } catch (error) {
      console.error("Load check-in error:", error);
      toast.error({
        title: "Error",
        message: error?.message || "Failed to load booking",
      });
      router.back();
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  }

  async function handleCheckIn() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setChecking(true);

      const response = await performCheckIn(id);
      const gate =
        response.boardingPass?.gate || booking.flightId?.gate || "TBA";

      toast.success({
        title: "Check-in Successful!",
        message: `Gate: ${gate}`,
      });

      // Navigate back to tickets after 1.5 seconds
      setTimeout(() => {
        router.push("/tickets");
      }, 1500);
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error({
        title: "Check-in Failed",
        message: error?.message || "Unable to complete check-in",
      });
    } finally {
      setChecking(false);
    }
  }

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "--:--";
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  if (loading) {
    return <Loader message="Loading check-in" subtitle="Please wait..." />;
  }

  if (!booking || !booking.flightId) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        <Text className="text-xl font-urbanist-bold text-primary mt-4">
          Booking Not Found
        </Text>
        <Text className="text-sm font-urbanist-medium text-primary/60 text-center mt-2">
          We couldn't find this booking. Please try again.
        </Text>
        <PrimaryButton
          title="Go Back"
          onPress={() => router.back()}
          className="mt-6"
        />
      </View>
    );
  }

  const flight = booking.flightId;
  const isEligible = eligibility?.eligible === true;
  const hoursUntilCheckIn = eligibility?.hoursUntilCheckIn;

  // Already checked in
  if (booking.isCheckedIn) {
    return (
      <View className="flex-1 bg-background">
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 pt-6"
        >
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15"
          >
            <Ionicons name="chevron-back" size={22} color="#541424" />
          </TouchableOpacity>
        </Animated.View>

        <View className="flex-1 items-center justify-center px-6">
          <Animated.View
            entering={FadeInUp.duration(600).delay(200)}
            className="items-center"
          >
            <View className="w-20 h-20 rounded-full bg-green-500/10 items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
            </View>
            <Text className="text-2xl font-urbanist-bold text-primary text-center">
              Already Checked In
            </Text>
            <Text className="text-sm font-urbanist-medium text-primary/60 text-center mt-2 mb-6">
              You have already completed check-in for this flight.
            </Text>

            {(booking.boardingPass?.gate || flight.gate) && (
              <View className="bg-primary/10 rounded-2xl px-6 py-4 mb-6">
                <Text className="text-xs font-urbanist-semibold text-primary/70 text-center">
                  GATE
                </Text>
                <Text className="text-4xl font-urbanist-bold text-primary text-center">
                  {booking.boardingPass?.gate || flight.gate}
                </Text>
              </View>
            )}

            <PrimaryButton
              title="View Boarding Pass"
              onPress={() => router.push("/tickets")}
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} className="px-6 pt-6">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15"
          >
            <Ionicons name="chevron-back" size={22} color="#541424" />
          </TouchableOpacity>
          <Text className="text-lg font-urbanist-bold text-primary">
            Web Check-in
          </Text>
          <View className="w-14" />
        </View>
      </Animated.View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Flight Info */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(100)}
          className="mx-6 mt-6 bg-secondary/40 rounded-[24px] p-5 border border-primary/10"
        >
          <View className="flex-row items-center mb-3">
            <Ionicons name="airplane" size={20} color={COLORS.primary} />
            <Text className="text-base font-urbanist-bold text-primary ml-2">
              Flight {flight.flightNumber}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <View className="flex-1">
              <Text className="text-xs font-urbanist-medium text-primary/60">
                Route
              </Text>
              <Text className="text-sm font-urbanist-semibold text-primary">
                {flight.source} → {flight.destination}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between mt-2">
            <View className="flex-1">
              <Text className="text-xs font-urbanist-medium text-primary/60">
                Departure
              </Text>
              <Text className="text-sm font-urbanist-semibold text-primary">
                {formatDate(flight.departureTime)}
              </Text>
              <Text className="text-base font-urbanist-bold text-primary">
                {formatTime(flight.departureTime)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Passenger Details */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(150)}
          className="mx-6 mt-4 bg-secondary/40 rounded-[24px] p-5 border border-primary/10"
        >
          <View className="flex-row items-center mb-3">
            <Ionicons name="person" size={20} color={COLORS.primary} />
            <Text className="text-base font-urbanist-bold text-primary ml-2">
              Passenger Details
            </Text>
          </View>

          {booking.passengers && booking.passengers.length > 0 ? (
            booking.passengers.map((passenger, index) => {
              const age = passenger.dateOfBirth
                ? Math.floor(
                    (new Date() - new Date(passenger.dateOfBirth)) /
                      (365.25 * 24 * 60 * 60 * 1000)
                  )
                : null;

              return (
                <View
                  key={index}
                  className={`${
                    index > 0 ? "border-t border-primary/10 pt-3" : ""
                  } ${index < booking.passengers.length - 1 ? "pb-3" : ""}`}
                >
                  <View className="flex-row justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-urbanist-semibold text-primary">
                        {passenger.fullName}
                      </Text>
                      <Text className="text-xs font-urbanist-medium text-primary/60 mt-1">
                        {age ? `${age} years` : "—"} • {passenger.gender}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs font-urbanist-medium text-primary/60">
                        Seat
                      </Text>
                      <Text className="text-sm font-urbanist-bold text-primary">
                        {passenger.seatNumber}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs font-urbanist-medium text-primary/60">
                  Seat Number
                </Text>
                <Text className="text-sm font-urbanist-semibold text-primary">
                  {booking.seatNumber}
                </Text>
              </View>
              <View>
                <Text className="text-xs font-urbanist-medium text-primary/60">
                  Class
                </Text>
                <Text className="text-sm font-urbanist-semibold text-primary capitalize">
                  {booking.travelClass}
                </Text>
              </View>
              <View>
                <Text className="text-xs font-urbanist-medium text-primary/60">
                  PNR
                </Text>
                <Text className="text-sm font-urbanist-semibold text-primary font-mono">
                  {booking.pnr}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Enhance Your Journey - Only if eligible */}
        {isEligible && (
          <Animated.View
            entering={FadeInUp.duration(600).delay(200)}
            className="mx-6 mt-6"
          >
            <Text className="text-base font-urbanist-bold text-primary mb-3">
              Enhance Your Journey
            </Text>

            <View className="flex-row gap-3">
              {/* Meal Selection */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/meal-selection/[id]",
                    params: { id: booking._id, from: "checkin" },
                  });
                }}
                className="flex-1 bg-orange-500/10 rounded-[20px] p-4 border border-orange-500/20"
              >
                <View className="w-12 h-12 rounded-xl bg-orange-500/20 items-center justify-center mb-3">
                  <Ionicons name="restaurant" size={24} color="#f97316" />
                </View>
                <Text className="text-sm font-urbanist-bold text-primary mb-1">
                  Select Meals
                </Text>
                <Text className="text-xs font-urbanist-medium text-primary/60 mb-3">
                  {booking.mealPreference ||
                  (booking.passengers &&
                    booking.passengers.some((p) => p.mealPreference))
                    ? "Meals selected"
                    : "Pre-order meals"}
                </Text>
                {(booking.mealPreference ||
                  (booking.passengers &&
                    booking.passengers.some((p) => p.mealPreference))) && (
                  <View className="flex-row items-center mb-2">
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#22c55e"
                    />
                    <Text className="text-xs font-urbanist-semibold text-green-600 ml-1">
                      Selected
                    </Text>
                  </View>
                )}
                <View className="flex-row items-center">
                  <Text className="text-xs font-urbanist-semibold text-orange-600">
                    {booking.mealPreference ||
                    (booking.passengers &&
                      booking.passengers.some((p) => p.mealPreference))
                      ? "Change"
                      : "Choose"}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#f97316" />
                </View>
              </TouchableOpacity>

              {/* Baggage Info */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/baggage-info/[id]",
                    params: { id: booking._id, from: "checkin" },
                  });
                }}
                className="flex-1 bg-blue-500/10 rounded-[20px] p-4 border border-blue-500/20"
              >
                <View className="w-12 h-12 rounded-xl bg-blue-500/20 items-center justify-center mb-3">
                  <Ionicons name="briefcase" size={24} color="#3b82f6" />
                </View>
                <Text className="text-sm font-urbanist-bold text-primary mb-1">
                  Baggage
                </Text>
                <Text className="text-xs font-urbanist-medium text-primary/60 mb-3">
                  View allowance
                </Text>
                <View className="flex-row items-center mt-auto">
                  <Text className="text-xs font-urbanist-semibold text-blue-600">
                    View
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#3b82f6" />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Not Eligible Warning */}
        {!isEligible && (
          <Animated.View
            entering={FadeInUp.duration(600).delay(200)}
            className="mx-6 mt-6 bg-yellow-500/10 rounded-[24px] p-5 border border-yellow-500/20"
          >
            <View className="flex-row items-start">
              <Ionicons name="alert-circle" size={20} color="#eab308" />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-urbanist-bold text-yellow-700">
                  {eligibility?.message || "Check-in not available"}
                </Text>
                {hoursUntilCheckIn > 0 && (
                  <Text className="text-xs font-urbanist-medium text-yellow-600 mt-1">
                    Check-in opens in {Math.floor(hoursUntilCheckIn)} hours
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Check-in Button */}
        {isEligible && (
          <Animated.View
            entering={FadeInUp.duration(600).delay(250)}
            className="mx-6 mt-6"
          >
            <View className="bg-secondary/40 rounded-[24px] p-6 border border-primary/10 items-center">
              <View className="w-16 h-16 rounded-full bg-green-500/10 items-center justify-center mb-4">
                <Ionicons name="checkmark-circle" size={40} color="#22c55e" />
              </View>
              <Text className="text-lg font-urbanist-bold text-primary mb-2">
                Ready for Check-in
              </Text>
              <Text className="text-sm font-urbanist-medium text-primary/60 text-center mb-6">
                Please confirm your details and complete check-in to receive
                your boarding pass
              </Text>

              <PrimaryButton
                title={checking ? "Processing..." : "Complete Check-in"}
                onPress={handleCheckIn}
                disabled={checking}
                className="w-full"
                icon={
                  checking ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="airplane" size={20} color="#fff" />
                  )
                }
              />
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
