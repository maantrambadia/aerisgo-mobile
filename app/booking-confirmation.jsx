import { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { toast } from "../lib/toast";
import { apiFetch } from "../lib/api";
import { getRewardBalance } from "../lib/rewards";
import Loader from "../components/Loader";
import PrimaryButton from "../components/PrimaryButton";

const ScaleOnPress = ({
  children,
  className = "",
  onPress,
  disabled,
  ...rest
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      onPressIn={() => {
        if (!disabled)
          scale.value = withSpring(0.97, { damping: 15, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 220 });
      }}
      onPress={onPress}
      disabled={disabled}
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
      <Text className="text-primary font-urbanist-medium text-sm">
        {fromShort}
      </Text>
      <Ionicons name="arrow-forward" size={16} color="#541424" />
      <Text className="text-primary font-urbanist-medium text-sm">
        {toShort}
      </Text>
    </View>
  );
};

export default function BookingConfirmation() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [rewardPointsToUse, setRewardPointsToUse] = useState(0);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);

  const flight = useMemo(() => {
    try {
      return JSON.parse(params.flight || "{}");
    } catch {
      return {};
    }
  }, [params.flight]);

  const seats = useMemo(() => {
    try {
      return JSON.parse(params.seats || "[]");
    } catch {
      return [];
    }
  }, [params.seats]);

  const { from, to, date, passengers } = params;

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const [rewardsData, pricingData] = await Promise.all([
        getRewardBalance().catch(() => ({ balance: 0 })),
        apiFetch("/pricing/config", { method: "GET", auth: true }).catch(
          () => ({ data: null })
        ),
      ]);
      setRewardBalance(rewardsData.balance || 0);
      setPricingConfig(pricingData.data?.config);
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  }

  const pricing = useMemo(() => {
    const baseFare = Number(flight.baseFare || 0);

    if (!pricingConfig || seats.length === 0) {
      // Fallback calculation
      const seatCharges = seats.reduce(
        (sum, seat) => sum + (seat.isExtraLegroom ? 500 : 0),
        0
      );
      const subtotal = baseFare * seats.length + seatCharges;
      const taxes = Math.round(subtotal * 0.12);
      const total = subtotal + taxes;
      return {
        subtotal: subtotal || 0,
        extraLegroomTotal: seatCharges || 0,
        gst: taxes || 0,
        fuelSurcharge: 0,
        airportFee: 0,
        total: total || 0,
        breakdown: [],
      };
    }

    let subtotal = 0;
    let totalGst = 0;
    let totalFuelSurcharge = 0;
    let totalAirportFee = 0;
    let extraLegroomTotal = 0;

    const breakdown = seats.map((seat) => {
      const classMultiplier =
        pricingConfig.travelClass[seat.travelClass]?.multiplier || 1;
      const classPrice = baseFare * classMultiplier;
      const extraLegroom = seat.isExtraLegroom
        ? pricingConfig.extraLegroom.charge
        : 0;
      const seatSubtotal = classPrice + extraLegroom;

      const gst = seatSubtotal * pricingConfig.taxes.gst;
      const fuelSurcharge = seatSubtotal * pricingConfig.taxes.fuelSurcharge;
      const airportFee = pricingConfig.taxes.airportFee;

      subtotal += seatSubtotal;
      totalGst += gst;
      totalFuelSurcharge += fuelSurcharge;
      totalAirportFee += airportFee;
      extraLegroomTotal += extraLegroom;

      return {
        seatNumber: seat.seatNumber,
        travelClass: seat.travelClass,
        classPrice,
        extraLegroom,
        subtotal: seatSubtotal,
        total: seatSubtotal + gst + fuelSurcharge + airportFee,
      };
    });

    const total = subtotal + totalGst + totalFuelSurcharge + totalAirportFee;

    return {
      subtotal: Math.round(subtotal * 100) / 100 || 0,
      extraLegroomTotal: Math.round(extraLegroomTotal * 100) / 100 || 0,
      gst: Math.round(totalGst * 100) / 100 || 0,
      fuelSurcharge: Math.round(totalFuelSurcharge * 100) / 100 || 0,
      airportFee: Math.round(totalAirportFee * 100) / 100 || 0,
      total: Math.round(total * 100) / 100 || 0,
      breakdown,
    };
  }, [flight.baseFare, seats, pricingConfig]);

  const finalAmount = useMemo(() => {
    const rewardDiscount = rewardPointsToUse; // 1 point = ₹1
    return Math.max(0, pricing.total - rewardDiscount);
  }, [pricing.total, rewardPointsToUse]);

  function handleUseRewards() {
    const maxUsable = Math.min(rewardBalance, Math.floor(pricing.total));
    setRewardPointsToUse(maxUsable);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success({
      title: "Rewards Applied",
      message: `${maxUsable} points applied (₹${maxUsable} discount)`,
    });
  }

  function handleRemoveRewards() {
    setRewardPointsToUse(0);
    Haptics.selectionAsync();
  }

  async function handlePayment() {
    setShowPaymentModal(false);
    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create booking
      const bookingData = {
        flightId: flight._id,
        seatNumbers: seats.map((s) => s.seatNumber),
        totalAmount: finalAmount,
        paymentMethod: "card",
        rewardPointsUsed: rewardPointsToUse,
      };

      const res = await apiFetch("/bookings/create", {
        method: "POST",
        auth: true,
        json: bookingData,
      });

      // Store points earned from response
      if (res.data?.pointsEarned) {
        setPointsEarned(res.data.pointsEarned);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);

      // Navigate to tickets after 3 seconds
      setTimeout(() => {
        router.replace("/tickets");
      }, 3000);
    } catch (err) {
      // Check if error is due to missing documents
      if (err?.requiresDocument) {
        toast.error({
          title: "Document Required",
          message: err?.message || "Please add your identification document",
        });
        setTimeout(() => {
          router.push("/user-documents");
        }, 2000);
      } else {
        toast.error({
          title: "Booking Failed",
          message: err?.message || "Failed to complete booking",
        });
      }
      setProcessing(false);
    }
  }

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

  if (loading) {
    return (
      <Loader
        message="Loading booking details"
        subtitle="Preparing your confirmation"
      />
    );
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
            disabled={processing}
          >
            <Ionicons name="chevron-back" size={22} color="#541424" />
          </TouchableOpacity>
          <Text className="text-primary font-urbanist-semibold text-lg">
            Confirm Booking
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
              Review &
            </Text>
            <Text className="text-primary font-urbanist-bold text-3xl leading-9 -mt-1">
              Confirm
            </Text>
          </View>
          <RoutePill from={from} to={to} />
        </View>
      </Animated.View>

      {/* Flight Ticket Card - Sticky */}
      <Animated.View
        entering={FadeInUp.duration(600).delay(120).springify()}
        className="px-6 mt-4 mb-3"
      >
        <View className="relative">
          <View className="bg-primary rounded-[28px] p-5 overflow-hidden">
            {/* Top row times/cities + arc */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-text/90 font-urbanist-semibold text-[11px]">
                  {from}
                </Text>
                <Text className="text-text font-urbanist-bold text-2xl mt-1">
                  {fmtTime(flight.departureTime)}
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
                  {fmtTime(flight.arrivalTime)}
                </Text>
              </View>
            </View>

            {/* Duration */}
            <Text className="text-text/70 font-urbanist-medium text-[11px] text-center mt-2">
              {fmtDuration(flight.departureTime, flight.arrivalTime)}
            </Text>

            {/* Bottom brand/price bar */}
            <View className="flex-row items-center justify-between mt-4">
              <View>
                <Text className="text-text font-urbanist-bold text-2xl">
                  AerisGo
                </Text>
                <Text className="text-text/70 font-urbanist-medium text-xs mt-0.5">
                  {flight.flightNumber || "AG-101"}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-text/70 font-urbanist-medium text-xs">
                  {new Date(date).toLocaleDateString()}
                </Text>
                <Text className="text-text font-urbanist-semibold text-sm mt-0.5">
                  {passengers} Passenger{passengers > 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          </View>

          {/* Ticket notches */}
          <Notch side="left" />
          <Notch side="right" />
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Selected Seats */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(160).springify()}
          className="px-6 mt-6"
        >
          <Text className="text-primary font-urbanist-bold text-base mb-3">
            Selected Seats
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {seats.map((seat, i) => {
              const classColor =
                seat.travelClass === "first"
                  ? "#a855f7"
                  : seat.travelClass === "business"
                    ? "#3b82f6"
                    : "#6b7280";
              return (
                <Animated.View
                  key={i}
                  entering={ZoomIn.duration(400).delay(200 + i * 50)}
                >
                  <View className="bg-secondary/40 rounded-[16px] px-4 py-3 flex-row items-center gap-3 border border-primary/10">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: classColor }}
                    >
                      <Text className="text-white font-urbanist-bold text-sm">
                        {seat.seatNumber}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-primary font-urbanist-semibold text-sm capitalize">
                        {seat.travelClass}
                      </Text>
                      {seat.isExtraLegroom && (
                        <Text className="text-yellow-600 font-urbanist-medium text-[10px]">
                          Extra Legroom
                        </Text>
                      )}
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Price Breakdown */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(200).springify()}
          className="px-6 mt-6"
        >
          <Text className="text-primary font-urbanist-bold text-base mb-3">
            Price Summary
          </Text>
          <View className="bg-secondary/40 rounded-[24px] p-5 border border-primary/10">
            {/* Subtotal */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-primary/70 font-urbanist-medium text-sm">
                Subtotal ({seats.length} seat{seats.length > 1 ? "s" : ""})
              </Text>
              <Text className="text-primary font-urbanist-semibold text-sm">
                ₹ {pricing.subtotal.toLocaleString("en-IN")}
              </Text>
            </View>

            {/* Extra Legroom */}
            {pricing.extraLegroomTotal > 0 && (
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-primary/70 font-urbanist-medium text-sm">
                  Extra Legroom
                </Text>
                <Text className="text-primary font-urbanist-semibold text-sm">
                  ₹ {pricing.extraLegroomTotal.toLocaleString("en-IN")}
                </Text>
              </View>
            )}

            {/* GST */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-primary/70 font-urbanist-medium text-sm">
                GST (5%)
              </Text>
              <Text className="text-primary font-urbanist-semibold text-sm">
                ₹ {pricing.gst.toLocaleString("en-IN")}
              </Text>
            </View>

            {/* Fuel Surcharge */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-primary/70 font-urbanist-medium text-sm">
                Fuel Surcharge (3%)
              </Text>
              <Text className="text-primary font-urbanist-semibold text-sm">
                ₹ {pricing.fuelSurcharge.toLocaleString("en-IN")}
              </Text>
            </View>

            {/* Airport Fee */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-primary/70 font-urbanist-medium text-sm">
                Airport Fee
              </Text>
              <Text className="text-primary font-urbanist-semibold text-sm">
                ₹ {pricing.airportFee.toLocaleString("en-IN")}
              </Text>
            </View>

            <View className="h-px bg-primary/20 my-2" />

            {/* Total */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-primary font-urbanist-bold text-base">
                Total Amount
              </Text>
              <Text className="text-primary font-urbanist-bold text-lg">
                ₹ {pricing.total.toLocaleString("en-IN")}
              </Text>
            </View>

            {/* Rewards Section */}
            {rewardBalance > 0 && (
              <>
                <View className="h-px bg-primary/20 my-2" />
                {rewardPointsToUse === 0 ? (
                  <ScaleOnPress
                    onPress={handleUseRewards}
                    className="bg-primary/10 rounded-[16px] p-3 flex-row items-center justify-between border border-primary/15"
                  >
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="gift" size={18} color="#541424" />
                      <View>
                        <Text className="text-primary font-urbanist-semibold text-sm">
                          Use Reward Points
                        </Text>
                        <Text className="text-primary/60 font-urbanist-medium text-xs">
                          {rewardBalance} points available
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#541424"
                    />
                  </ScaleOnPress>
                ) : (
                  <View className="bg-green-500/10 rounded-[16px] p-3 border border-green-500/20">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="gift" size={18} color="#10b981" />
                        <Text className="text-green-700 font-urbanist-semibold text-sm">
                          Rewards Applied
                        </Text>
                      </View>
                      <TouchableOpacity onPress={handleRemoveRewards}>
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#10b981"
                        />
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-green-700/70 font-urbanist-medium text-sm">
                        {rewardPointsToUse} points used
                      </Text>
                      <Text className="text-green-700 font-urbanist-bold text-sm">
                        - ₹ {rewardPointsToUse.toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Final Amount */}
            {rewardPointsToUse > 0 && (
              <>
                <View className="h-px bg-primary/20 my-3" />
                <View className="flex-row items-center justify-between">
                  <Text className="text-primary font-urbanist-bold text-lg">
                    Final Amount
                  </Text>
                  <Text className="text-primary font-urbanist-bold text-2xl">
                    ₹ {finalAmount.toLocaleString("en-IN")}
                  </Text>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        {/* Total Amount & Payment Button - At Bottom of ScrollView */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(240).springify()}
          className="px-6 mt-6"
        >
          <View className="bg-secondary/40 rounded-[20px] p-3 mb-3 border border-primary/10">
            <View className="flex-row items-center justify-between">
              <Text className="text-primary/70 font-urbanist-medium text-sm">
                {rewardPointsToUse > 0 ? "Final Amount" : "Total Amount"}
              </Text>
              <Text className="text-primary font-urbanist-bold text-xl">
                ₹{" "}
                {(rewardPointsToUse > 0
                  ? finalAmount
                  : pricing.total
                ).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
          <PrimaryButton
            title={processing ? "Processing..." : "Proceed to Payment"}
            onPress={async () => {
              if (processing) return;
              try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch {}
              setShowPaymentModal(true);
            }}
            disabled={processing}
            leftIconName={processing ? undefined : "card-outline"}
            withHaptics={false}
          />
        </Animated.View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => !processing && setShowPaymentModal(false)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <Pressable
            className="flex-1"
            onPress={() => !processing && setShowPaymentModal(false)}
          />
          <Animated.View entering={FadeInUp.duration(300).springify()}>
            <View className="bg-background rounded-t-[32px] border-t-2 border-primary/10">
              <View
                className="p-6"
                style={{ paddingBottom: insets.bottom + 24 }}
              >
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-primary font-urbanist-bold text-xl">
                    Payment Details
                  </Text>
                  <TouchableOpacity
                    onPress={() => !processing && setShowPaymentModal(false)}
                    disabled={processing}
                    className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
                  >
                    <Ionicons name="close" size={22} color="#541424" />
                  </TouchableOpacity>
                </View>

                {/* Payment Summary Card */}
                <View className="bg-primary/5 rounded-[24px] p-5 mb-6 border border-primary/15">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-primary/70 font-urbanist-medium text-sm mb-1">
                        Amount to Pay
                      </Text>
                      <Text className="text-primary font-urbanist-bold text-3xl">
                        ₹{" "}
                        {(rewardPointsToUse > 0
                          ? finalAmount
                          : pricing.total
                        ).toLocaleString("en-IN")}
                      </Text>
                    </View>
                    <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
                      <Ionicons name="card" size={28} color="#541424" />
                    </View>
                  </View>
                  {rewardPointsToUse > 0 && (
                    <View className="flex-row items-center gap-2 mt-4 pt-4 border-t border-primary/10">
                      <Ionicons name="gift" size={16} color="#10b981" />
                      <Text className="text-green-700 font-urbanist-semibold text-sm">
                        {rewardPointsToUse} reward points applied
                      </Text>
                    </View>
                  )}
                </View>

                {/* Payment Method */}
                <View className="mb-6">
                  <Text className="text-primary font-urbanist-bold text-base mb-3">
                    Payment Method
                  </Text>
                  <View className="bg-primary rounded-[24px] p-5 border border-primary/20">
                    <View className="flex-row items-center gap-4">
                      <View className="w-14 h-14 rounded-full items-center justify-center bg-text/15">
                        <Ionicons name="card" size={24} color="#e3d7cb" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-text font-urbanist-bold text-base">
                          Credit/Debit Card
                        </Text>
                        <Text className="text-text/70 font-urbanist-medium text-sm mt-1">
                          Secure payment gateway
                        </Text>
                      </View>
                      <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center">
                        <Ionicons name="checkmark" size={18} color="white" />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Confirm Button */}
                <PrimaryButton
                  title={
                    processing
                      ? "Processing Payment..."
                      : `Confirm & Pay ₹${(rewardPointsToUse > 0 ? finalAmount : pricing.total).toLocaleString("en-IN")}`
                  }
                  onPress={handlePayment}
                  disabled={processing}
                  leftIconName={processing ? undefined : "shield-checkmark"}
                  withHaptics={false}
                />

                {/* Security Note */}
                <View className="flex-row items-center justify-center gap-2 mt-5 pt-4 border-t border-primary/10">
                  <Ionicons name="lock-closed" size={16} color="#541424" />
                  <Text className="text-primary/70 font-urbanist-semibold text-sm">
                    Your payment is secure and encrypted
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <Animated.View entering={ZoomIn.duration(400).springify()}>
            <View className="bg-background rounded-[32px] border-2 border-primary/15 overflow-hidden">
              <View className="p-8 items-center">
                {/* Success Icon */}
                <View className="w-24 h-24 rounded-full bg-green-500 items-center justify-center mb-5 shadow-lg">
                  <Ionicons name="checkmark" size={56} color="white" />
                </View>

                {/* Title */}
                <Text className="text-primary font-urbanist-bold text-3xl mb-2 text-center">
                  Booking Confirmed!
                </Text>

                {/* Subtitle */}
                <Text className="text-primary/70 font-urbanist-medium text-base text-center mb-4">
                  Your flight has been booked successfully
                </Text>

                {/* Divider */}
                <View className="w-full h-px bg-primary/10 my-2" />

                {/* Points Earned Badge */}
                {pointsEarned > 0 && (
                  <View className="bg-green-500/10 rounded-[20px] px-5 py-4 border border-green-500/20 mt-3 w-full">
                    <View className="flex-row items-center justify-center gap-2 mb-1">
                      <Ionicons name="gift" size={22} color="#10b981" />
                      <Text className="text-green-700 font-urbanist-bold text-base">
                        +{pointsEarned} Reward Points Earned!
                      </Text>
                    </View>
                    <Text className="text-green-700/70 font-urbanist-semibold text-xs text-center">
                      5% of booking amount added to your account
                    </Text>
                  </View>
                )}

                {/* Info Text */}
                <Text className="text-primary/60 font-urbanist-medium text-sm text-center mt-5">
                  Redirecting to your tickets...
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
