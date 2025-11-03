import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import BottomSheetModal from "./BottomSheetModal";
import PrimaryButton from "./PrimaryButton";
import { getBookingPriceBreakdown } from "../lib/bookings";
import { toast } from "../lib/toast";

export default function BookingDetailsModal({
  visible,
  onClose,
  booking,
  onShowBoardingPass,
  onCancel,
}) {
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  useEffect(() => {
    if (visible && booking) {
      fetchPriceBreakdown();
    }
  }, [visible, booking]);

  const fetchPriceBreakdown = async () => {
    if (!booking || !booking._id) return;

    setLoadingBreakdown(true);
    try {
      const data = await getBookingPriceBreakdown(booking._id);
      setPriceBreakdown(data);
    } catch (err) {
      console.error("Failed to fetch price breakdown:", err);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  if (!booking || !booking.flightId) return null;

  const flight = booking.flightId;
  const departureDate = new Date(flight.departureTime);
  const arrivalDate = new Date(flight.arrivalTime);
  const now = new Date();
  const hoursUntilDeparture = (departureDate - now) / (1000 * 60 * 60);

  const checkInOpen =
    hoursUntilDeparture <= 24 &&
    hoursUntilDeparture > 1 &&
    booking.status === "confirmed";
  const canShowBoardingPass =
    booking.isCheckedIn &&
    booking.status === "confirmed" &&
    hoursUntilDeparture > 0;
  const canCancel =
    hoursUntilDeparture > 24 &&
    !booking.isCheckedIn &&
    booking.status === "confirmed";
  const isPast = departureDate < now;

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleBoardingPassPress = async () => {
    if (booking.status === "cancelled") {
      toast.warn({
        title: "Cancelled Booking",
        message: "Boarding pass is not available for cancelled bookings",
      });
      return;
    }
    if (isPast) {
      toast.warn({
        title: "Past Flight",
        message: "Boarding pass is not available for past flights",
      });
      return;
    }
    if (!canShowBoardingPass) {
      toast.info({
        title: "Not Available Yet",
        message: "Boarding pass will be available 24 hours before departure",
      });
      return;
    }
    onShowBoardingPass();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Booking Details"
      maxHeight="85%"
      minHeight="50%"
    >
      <View>
        {/* Flight Info */}
        <View className="bg-primary/5 rounded-2xl p-4 mb-4">
          <Text className="text-primary font-urbanist-bold text-lg mb-3">
            {flight.flightNumber}
          </Text>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-primary/60 font-urbanist text-xs">
                From
              </Text>
              <Text className="text-primary font-urbanist-bold text-lg">
                {flight.source}
              </Text>
              <Text className="text-primary/70 font-urbanist text-sm">
                {formatTime(departureDate)}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#541424" />
            <View className="items-end">
              <Text className="text-primary/60 font-urbanist text-xs">To</Text>
              <Text className="text-primary font-urbanist-bold text-lg">
                {flight.destination}
              </Text>
              <Text className="text-primary/70 font-urbanist text-sm">
                {formatTime(arrivalDate)}
              </Text>
            </View>
          </View>
          <Text className="text-primary/60 font-urbanist text-sm text-center mt-3">
            {formatDate(departureDate)}
          </Text>
        </View>

        {/* Passenger & Seat Info */}
        <View className="bg-primary/5 rounded-2xl p-4 mb-4">
          <Text className="text-primary font-urbanist-bold text-base mb-3">
            Passenger Information
          </Text>
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-primary/60 font-urbanist text-sm">
                Name
              </Text>
              <Text className="text-primary font-urbanist-semibold">
                {booking.userId?.name || "Passenger"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-primary/60 font-urbanist text-sm">
                Seat
                {booking.passengers && booking.passengers.length > 1 ? "s" : ""}
              </Text>
              <Text className="text-primary font-urbanist-semibold">
                {booking.passengers && booking.passengers.length > 0
                  ? booking.passengers.map((p) => p.seatNumber).join(", ")
                  : booking.seatNumber}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-primary/60 font-urbanist text-sm">
                Class
              </Text>
              <Text className="text-primary font-urbanist-semibold capitalize">
                {booking.travelClass}
              </Text>
            </View>
            {booking.isExtraLegroom && (
              <View className="flex-row justify-between">
                <Text className="text-primary/60 font-urbanist text-sm">
                  Extra
                </Text>
                <Text className="text-primary font-urbanist-semibold">
                  Extra Legroom
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Passenger Details */}
        {booking.passengers && booking.passengers.length > 0 && (
          <View className="bg-primary/5 rounded-2xl p-4 mb-4">
            <Text className="text-primary font-urbanist-bold text-base mb-3">
              Passenger Details ({booking.passengers.length})
            </Text>
            {booking.passengers.map((passenger, index) => (
              <View
                key={index}
                className={`${index > 0 ? "mt-3 pt-3 border-t border-primary/10" : ""}`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-primary font-urbanist-semibold">
                    {passenger.fullName}
                  </Text>
                  {passenger.isPrimary && (
                    <View className="px-2 py-1 rounded-full bg-primary/10">
                      <Text className="text-primary font-urbanist-semibold text-xs">
                        You
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-primary/60 font-urbanist text-sm mb-2">
                  Seat {passenger.seatNumber} •{" "}
                  {passenger.gender.charAt(0).toUpperCase() +
                    passenger.gender.slice(1)}
                </Text>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-primary/60 font-urbanist text-xs">
                    Document
                  </Text>
                  <Text className="text-primary font-urbanist-medium text-xs">
                    {passenger.documentType.toUpperCase()}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-primary/60 font-urbanist text-xs">
                    Document No.
                  </Text>
                  <Text className="text-primary font-urbanist-medium text-xs">
                    {passenger.documentNumber}
                  </Text>
                </View>
                {passenger.email && (
                  <View className="flex-row justify-between mt-1">
                    <Text className="text-primary/60 font-urbanist text-xs">
                      Email
                    </Text>
                    <Text className="text-primary font-urbanist-medium text-xs">
                      {passenger.email}
                    </Text>
                  </View>
                )}
                {passenger.phone && (
                  <View className="flex-row justify-between mt-1">
                    <Text className="text-primary/60 font-urbanist text-xs">
                      Phone
                    </Text>
                    <Text className="text-primary font-urbanist-medium text-xs">
                      {passenger.phone}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Price Breakdown */}
        <View className="bg-primary/5 rounded-2xl p-4 mb-4">
          <Text className="text-primary font-urbanist-bold text-base mb-3">
            Price Breakdown
          </Text>
          {loadingBreakdown ? (
            <Text className="text-primary/60 font-urbanist text-sm text-center py-4">
              Loading...
            </Text>
          ) : priceBreakdown ? (
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-primary/60 font-urbanist text-sm">
                  Base Fare ({booking.travelClass})
                </Text>
                <Text className="text-primary font-urbanist-semibold">
                  ₹{priceBreakdown.classPrice?.toLocaleString("en-IN")}
                </Text>
              </View>
              {priceBreakdown.extraLegroomCharge > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-primary/60 font-urbanist text-sm">
                    Extra Legroom
                  </Text>
                  <Text className="text-primary font-urbanist-semibold">
                    ₹
                    {priceBreakdown.extraLegroomCharge?.toLocaleString("en-IN")}
                  </Text>
                </View>
              )}
              <View className="h-px bg-primary/10 my-2" />
              <View className="flex-row justify-between">
                <Text className="text-primary/60 font-urbanist text-sm">
                  Subtotal
                </Text>
                <Text className="text-primary font-urbanist-semibold">
                  ₹{priceBreakdown.subtotal?.toLocaleString("en-IN")}
                </Text>
              </View>
              {priceBreakdown.taxes && (
                <>
                  <View className="flex-row justify-between">
                    <Text className="text-primary/60 font-urbanist text-sm">
                      GST (5%)
                    </Text>
                    <Text className="text-primary font-urbanist-semibold">
                      ₹{priceBreakdown.taxes.gst?.toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-primary/60 font-urbanist text-sm">
                      Airport Fee
                    </Text>
                    <Text className="text-primary font-urbanist-semibold">
                      ₹
                      {priceBreakdown.taxes.airportFee?.toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-primary/60 font-urbanist text-sm">
                      Fuel Surcharge
                    </Text>
                    <Text className="text-primary font-urbanist-semibold">
                      ₹
                      {priceBreakdown.taxes.fuelSurcharge?.toLocaleString(
                        "en-IN"
                      )}
                    </Text>
                  </View>
                </>
              )}
              <View className="h-px bg-primary/10 my-2" />
              <View className="flex-row justify-between">
                <Text className="text-primary font-urbanist-bold text-base">
                  Total Paid
                </Text>
                <Text className="text-primary font-urbanist-bold text-lg">
                  ₹{priceBreakdown.total?.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
          ) : (
            <View className="flex-row justify-between">
              <Text className="text-primary font-urbanist-bold text-base">
                Total Paid
              </Text>
              <Text className="text-primary font-urbanist-bold text-lg">
                ₹{booking.price?.toLocaleString("en-IN")}
              </Text>
            </View>
          )}
        </View>

        {/* PNR & Booking ID */}
        <View className="bg-primary/5 rounded-2xl p-4 mb-4">
          {/* PNR - Prominent Display */}
          <Text className="text-primary/60 font-urbanist text-xs mb-1">
            PNR (Booking Reference)
          </Text>
          <Text className="text-primary font-urbanist-bold text-2xl mb-4 tracking-widest font-mono">
            {booking.pnr || "N/A"}
          </Text>

          {/* Booking ID */}
          <View className="pt-3 border-t border-primary/10">
            <Text className="text-primary/60 font-urbanist text-xs mb-1">
              Booking ID
            </Text>
            <Text className="text-primary font-urbanist-semibold text-xs">
              {booking._id?.substring(0, 24).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="space-y-3">
          {/* Check-in Button - Show when check-in is open but not checked in */}
          {checkInOpen && !booking.isCheckedIn && (
            <PrimaryButton
              title="Web Check-in"
              onPress={async () => {
                try {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch {}
                onClose();
                router.push({
                  pathname: "/check-in/[id]",
                  params: { id: booking._id },
                });
              }}
              className="w-full"
              icon={<Ionicons name="airplane" size={20} color="#fff" />}
            />
          )}

          {/* Boarding Pass Button - Only show when checked in */}
          {canShowBoardingPass && (
            <PrimaryButton
              title="View Boarding Pass"
              onPress={handleBoardingPassPress}
              className="w-full"
              withHaptics
            />
          )}

          {/* Cancel Button */}
          {canCancel && (
            <TouchableOpacity
              onPress={async () => {
                try {
                  await Haptics.selectionAsync();
                } catch {}
                onCancel();
              }}
              activeOpacity={0.7}
              className="bg-red-50 rounded-full px-4 py-3 flex-row items-center justify-center border border-red-200 mt-3"
            >
              <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
              <Text className="text-red-600 font-urbanist-semibold text-base ml-2">
                Cancel Booking
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </BottomSheetModal>
  );
}
