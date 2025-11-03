import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import BottomSheetModal from "./BottomSheetModal";
import PrimaryButton from "./PrimaryButton";
import { getCancellationPreview, cancelBooking } from "../lib/bookings";
import { toast } from "../lib/toast";
import { COLORS } from "../constants/colors";

const CANCELLATION_REASONS = [
  { value: "change-of-plans", label: "Change of Plans" },
  { value: "medical-emergency", label: "Medical Emergency" },
  { value: "flight-rescheduled", label: "Flight Rescheduled" },
  { value: "better-price", label: "Found Better Price" },
  { value: "personal-reasons", label: "Personal Reasons" },
  { value: "other", label: "Other" },
];

export default function CancellationModal({
  visible,
  onClose,
  booking,
  onSuccess,
}) {
  const [step, setStep] = useState(1); // 1: Preview, 2: Reason
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedReason, setSelectedReason] = useState("");

  useEffect(() => {
    if (visible && booking) {
      loadPreview();
    } else {
      // Reset state when modal closes
      setStep(1);
      setSelectedReason("");
      setPreview(null);
    }
  }, [visible, booking]);

  async function loadPreview() {
    try {
      setLoading(true);
      const data = await getCancellationPreview(booking._id);
      setPreview(data);
    } catch (error) {
      toast.error({
        title: "Error",
        message: "Failed to load cancellation preview",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!selectedReason) {
      toast.error({
        title: "Required",
        message: "Please select a cancellation reason",
      });
      return;
    }

    try {
      setCancelling(true);
      const reasonText =
        CANCELLATION_REASONS.find((r) => r.value === selectedReason)?.label ||
        selectedReason;

      await cancelBooking(booking._id, reasonText);

      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch {}

      toast.success({
        title: "Booking Cancelled",
        message: "Your booking has been cancelled successfully",
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error({
        title: "Cancellation Failed",
        message: error?.message || "Failed to cancel booking",
      });
    } finally {
      setCancelling(false);
    }
  }

  if (!booking) return null;

  const flight = booking.flightId;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={step === 1 ? "Cancel Booking" : "Cancellation Reason"}
      subtitle={
        step === 1
          ? "Review the cancellation details"
          : "Tell us why you're cancelling"
      }
      maxHeight="85%"
      minHeight="60%"
    >
      <View>
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-sm font-urbanist-medium text-primary/60 mt-4">
              Loading cancellation details...
            </Text>
          </View>
        ) : step === 1 ? (
          // Step 1: Preview
          <View>
            {/* Booking Details */}
            <View className="bg-primary/5 rounded-2xl p-4 mb-4">
              <Text className="text-primary font-urbanist-bold text-base mb-3">
                Booking Details
              </Text>
              <View className="flex-row justify-between mb-2">
                <Text className="text-primary/60 font-urbanist text-sm">
                  PNR
                </Text>
                <Text className="text-primary font-urbanist-semibold font-mono">
                  {booking.pnr}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-primary/60 font-urbanist text-sm">
                  Flight
                </Text>
                <Text className="text-primary font-urbanist-semibold">
                  {flight?.flightNumber}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-primary/60 font-urbanist text-sm">
                  Route
                </Text>
                <Text className="text-primary font-urbanist-semibold">
                  {flight?.source} → {flight?.destination}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-primary/60 font-urbanist text-sm">
                  Seat
                </Text>
                <Text className="text-primary font-urbanist-semibold">
                  {booking.seatNumber}
                </Text>
              </View>
            </View>

            {/* Cancellation Policy */}
            {preview?.canCancel ? (
              <>
                <View className="bg-yellow-50 rounded-2xl p-4 mb-4 border border-yellow-500/30">
                  <View className="flex-row items-center mb-3">
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color="#ca8a04"
                    />
                    <Text className="text-yellow-900 font-urbanist-bold text-base ml-2">
                      Cancellation Policy
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-yellow-800 font-urbanist text-sm">
                      Cancellation Tier:
                    </Text>
                    <View className="bg-yellow-100 rounded-full px-3 py-1 border border-yellow-500/30">
                      <Text className="text-yellow-900 font-urbanist-semibold text-xs capitalize">
                        {typeof preview.tier === "object"
                          ? preview.tier.label
                          : preview.tier}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-yellow-800 font-urbanist text-sm">
                      Cancellation Fee:
                    </Text>
                    <Text className="text-yellow-900 font-urbanist-semibold">
                      ₹{preview.cancellationFee?.toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-yellow-800 font-urbanist text-sm">
                      Original Amount:
                    </Text>
                    <Text className="text-yellow-900 font-urbanist-semibold">
                      ₹{booking.price?.toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View className="h-px bg-yellow-500/30 my-2" />
                  <View className="flex-row justify-between items-center">
                    <Text className="text-yellow-900 font-urbanist-bold text-base">
                      Refund Amount:
                    </Text>
                    <Text className="text-yellow-900 font-urbanist-bold text-lg">
                      ₹{preview.refundAmount?.toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>

                {/* Refund Timeline */}
                <View className="bg-primary/5 rounded-2xl p-4 mb-4">
                  <View className="flex-row items-start">
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-primary font-urbanist-bold text-base mb-1">
                        Refund Processing
                      </Text>
                      <Text className="text-primary/60 font-urbanist text-sm">
                        Your refund will be processed within{" "}
                        <Text className="text-primary font-urbanist-semibold">
                          {preview.refundProcessingDays || 7} business days
                        </Text>{" "}
                        to your original payment method.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Warning */}
                <View className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-500/30">
                  <View className="flex-row items-start">
                    <Ionicons name="warning" size={20} color="#dc2626" />
                    <View className="flex-1 ml-3">
                      <Text className="text-red-900 font-urbanist-bold text-base mb-1">
                        Important Notice
                      </Text>
                      <Text className="text-red-800 font-urbanist text-sm">
                        This action cannot be undone. Once cancelled, you will
                        need to make a new booking if you wish to travel.
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <View className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-500/30">
                <View className="flex-row items-start">
                  <Ionicons name="warning" size={20} color="#dc2626" />
                  <View className="flex-1 ml-3">
                    <Text className="text-red-900 font-urbanist-bold text-base mb-1">
                      Cannot Cancel
                    </Text>
                    <Text className="text-red-800 font-urbanist text-sm">
                      {preview?.reason ||
                        "This booking cannot be cancelled at this time."}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        ) : (
          // Step 2: Reason Selection
          <View>
            <Text className="text-primary font-urbanist-semibold text-sm mb-3">
              Reason for Cancellation *
            </Text>
            {CANCELLATION_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                onPress={async () => {
                  try {
                    await Haptics.selectionAsync();
                  } catch {}
                  setSelectedReason(reason.value);
                }}
                className={`rounded-2xl p-4 mb-3 border-2 ${
                  selectedReason === reason.value
                    ? "bg-primary/5 border-primary"
                    : "bg-secondary/20 border-primary/10"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`font-urbanist-semibold text-sm ${
                      selectedReason === reason.value
                        ? "text-primary"
                        : "text-primary/80"
                    }`}
                  >
                    {reason.label}
                  </Text>
                  {selectedReason === reason.value ? (
                    <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  ) : (
                    <View className="w-6 h-6 rounded-full border-2 border-primary/20" />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <View className="bg-yellow-50 rounded-2xl p-3 border border-yellow-500/30 mt-2">
              <Text className="text-yellow-800 font-urbanist text-xs">
                Your feedback helps us improve our service. Thank you for
                sharing.
              </Text>
            </View>
          </View>
        )}
        {/* Footer Buttons */}
        <View className="space-y-3 mt-4">
          {preview?.canCancel && step === 2 && (
            <PrimaryButton
              title={cancelling ? "Processing..." : "Confirm Cancellation"}
              onPress={handleCancel}
              disabled={cancelling || !selectedReason}
              className="w-full"
            />
          )}
          {preview?.canCancel && step === 1 && (
            <TouchableOpacity
              onPress={async () => {
                try {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch {}
                setStep(2);
              }}
              activeOpacity={0.7}
              className="bg-red-500 rounded-full px-4 py-3 items-center justify-center"
            >
              <Text className="text-base font-urbanist-bold text-white">
                Proceed to Cancel
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={async () => {
              try {
                await Haptics.selectionAsync();
              } catch {}
              if (step === 2) {
                setStep(1);
              } else {
                onClose();
              }
            }}
            disabled={cancelling}
            activeOpacity={0.7}
            className="bg-secondary/40 rounded-full px-4 py-3 items-center justify-center border border-primary/10 mt-3"
          >
            <Text className="text-base font-urbanist-semibold text-primary">
              {step === 1 ? "Keep Booking" : "Back"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModal>
  );
}
