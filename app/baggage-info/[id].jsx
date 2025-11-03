import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Loader from "../../components/Loader";
import PrimaryButton from "../../components/PrimaryButton";
import { toast } from "../../lib/toast";
import { getBaggageByBooking } from "../../lib/baggage";
import { COLORS } from "../../constants/colors";

export default function BaggageInfo() {
  const { id, from } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [baggageInfo, setBaggageInfo] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getBaggageByBooking(id);
      setBaggageInfo(data);
    } catch (error) {
      console.error("Load baggage error:", error);
      toast.error({
        title: "Error",
        message: error?.message || "Failed to load baggage information",
      });
      router.back();
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  }

  function handleContinue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toast.success({
      title: "Success",
      message: "Baggage allowance confirmed!",
    });

    if (from === "booking") {
      router.push("/tickets");
    } else if (from === "checkin") {
      router.push({
        pathname: "/check-in/[id]",
        params: { id },
      });
    } else {
      router.push("/tickets");
    }
  }

  if (loading) {
    return <Loader message="Loading baggage info" subtitle="Please wait..." />;
  }

  if (!baggageInfo) {
    return null;
  }

  const { allowance, travelClass } = baggageInfo;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))}
        className="px-6 pt-6 pb-4"
      >
        <View className="flex-row items-center justify-between mb-4">
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
            Baggage Allowance
          </Text>
          <View className="w-14" />
        </View>

        <Text className="text-sm font-urbanist-medium text-primary/60 mb-2">
          Your baggage allowance for this flight
        </Text>

        <View className="bg-green-500/10 rounded-2xl px-4 py-2 flex-row items-center self-start mb-2">
          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
          <Text className="text-xs font-urbanist-semibold text-green-600 ml-2">
            Included in your fare - No additional charges
          </Text>
        </View>

        <View className="bg-primary/10 rounded-xl px-3 py-1.5 self-start">
          <Text className="text-xs font-urbanist-semibold text-primary capitalize">
            {travelClass} Class
          </Text>
        </View>
      </Animated.View>

      <View className="h-px bg-primary/10" />

      {/* Grouped Content Animation */}
      <Animated.View
        entering={FadeInUp.duration(400)
          .delay(100)
          .easing(Easing.out(Easing.cubic))}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Cabin Baggage */}
          <View className="mx-6 mt-6 bg-secondary/40 rounded-[24px] p-5 border border-primary/10">
            <View className="flex-row items-center mb-4">
              <Ionicons name="briefcase" size={20} color={COLORS.primary} />
              <Text className="text-base font-urbanist-bold text-primary ml-2">
                Cabin Baggage
              </Text>
            </View>

            <View className="gap-3">
              <View className="bg-secondary/20 rounded-2xl p-4 border border-primary/5">
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="cube-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text className="text-xs font-urbanist-medium text-primary/60 ml-2">
                    Pieces
                  </Text>
                </View>
                <Text className="text-sm font-urbanist-bold text-primary">
                  {allowance.cabinBaggage.pieces}{" "}
                  {allowance.cabinBaggage.pieces === 1 ? "bag" : "bags"}
                </Text>
              </View>

              <View className="bg-secondary/20 rounded-2xl p-4 border border-primary/5">
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="scale-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text className="text-xs font-urbanist-medium text-primary/60 ml-2">
                    Max Weight
                  </Text>
                </View>
                <Text className="text-sm font-urbanist-bold text-primary">
                  {allowance.cabinBaggage.maxWeight} kg
                  {allowance.cabinBaggage.pieces > 1 && " each"}
                </Text>
              </View>

              <View className="bg-secondary/20 rounded-2xl p-4 border border-primary/5">
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="resize-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text className="text-xs font-urbanist-medium text-primary/60 ml-2">
                    Dimensions
                  </Text>
                </View>
                <Text className="text-sm font-urbanist-bold text-primary">
                  {allowance.cabinBaggage.maxDimensions}
                </Text>
              </View>
            </View>

            <Text className="text-xs font-urbanist-medium text-primary/60 mt-4">
              {allowance.cabinBaggage.description}
            </Text>
          </View>

          {/* Checked Baggage */}
          <View className="mx-6 mt-4 bg-secondary/40 rounded-[24px] p-5 border border-primary/10">
            <View className="flex-row items-center mb-4">
              <Ionicons name="bag-handle" size={20} color={COLORS.primary} />
              <Text className="text-base font-urbanist-bold text-primary ml-2">
                Checked Baggage
              </Text>
            </View>

            <View className="gap-3">
              <View className="bg-secondary/20 rounded-2xl p-4 border border-primary/5">
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="cube-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text className="text-xs font-urbanist-medium text-primary/60 ml-2">
                    Pieces
                  </Text>
                </View>
                <Text className="text-sm font-urbanist-bold text-primary">
                  {allowance.checkedBaggage.pieces}{" "}
                  {allowance.checkedBaggage.pieces === 1 ? "bag" : "bags"}
                </Text>
              </View>

              <View className="bg-secondary/20 rounded-2xl p-4 border border-primary/5">
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="scale-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text className="text-xs font-urbanist-medium text-primary/60 ml-2">
                    Max Weight
                  </Text>
                </View>
                <Text className="text-sm font-urbanist-bold text-primary">
                  {allowance.checkedBaggage.maxWeight} kg each
                </Text>
                <Text className="text-xs font-urbanist-medium text-primary/60 mt-1">
                  Total: {allowance.checkedBaggage.totalWeight} kg
                </Text>
              </View>

              <View className="bg-secondary/20 rounded-2xl p-4 border border-primary/5">
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="resize-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text className="text-xs font-urbanist-medium text-primary/60 ml-2">
                    Dimensions
                  </Text>
                </View>
                <Text className="text-sm font-urbanist-bold text-primary">
                  {allowance.checkedBaggage.maxDimensions}
                </Text>
              </View>
            </View>

            <Text className="text-xs font-urbanist-medium text-primary/60 mt-4">
              {allowance.checkedBaggage.description}
            </Text>
          </View>

          {/* Personal Item */}
          {allowance.personalItem && (
            <View className="mx-6 mt-4 bg-green-500/10 rounded-[24px] p-5 border border-green-500/20">
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text className="text-base font-urbanist-bold text-green-700 ml-2">
                  Personal Item Included
                </Text>
              </View>
              <Text className="text-xs font-urbanist-medium text-green-600 mb-2">
                {allowance.personalItem.description}
              </Text>
              <Text className="text-xs font-urbanist-semibold text-green-700">
                Max Dimensions: {allowance.personalItem.maxDimensions}
              </Text>
            </View>
          )}

          {/* Priority Benefits */}
          {allowance.priority && (
            <View className="mx-6 mt-4 bg-primary/10 rounded-[24px] p-5 border border-primary/20">
              <View className="flex-row items-center mb-3">
                <Ionicons name="star" size={20} color={COLORS.primary} />
                <Text className="text-base font-urbanist-bold text-primary ml-2">
                  Priority Benefits
                </Text>
              </View>
              <View className="gap-2">
                {allowance.priority.priorityBoarding && (
                  <View className="flex-row items-center">
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#22c55e"
                    />
                    <Text className="text-xs font-urbanist-medium text-primary ml-2">
                      Priority Boarding
                    </Text>
                  </View>
                )}
                {allowance.priority.priorityBaggage && (
                  <View className="flex-row items-center">
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#22c55e"
                    />
                    <Text className="text-xs font-urbanist-medium text-primary ml-2">
                      Priority Baggage Handling
                    </Text>
                  </View>
                )}
                {allowance.priority.fastTrackSecurity && (
                  <View className="flex-row items-center">
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#22c55e"
                    />
                    <Text className="text-xs font-urbanist-medium text-primary ml-2">
                      Fast-Track Security
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Important Notes */}
          <View className="mx-6 mt-4 bg-secondary/40 rounded-[24px] p-5 border border-primary/10">
            <Text className="text-base font-urbanist-bold text-primary mb-3">
              Important Notes
            </Text>
            <View className="gap-2">
              <Text className="text-xs font-urbanist-medium text-primary/60">
                • Baggage exceeding the allowed weight/dimensions may incur
                additional charges
              </Text>
              <Text className="text-xs font-urbanist-medium text-primary/60">
                • Prohibited items include sharp objects, flammable materials,
                and explosives
              </Text>
              <Text className="text-xs font-urbanist-medium text-primary/60">
                • Liquids in cabin baggage must be in containers of 100ml or
                less
              </Text>
              <Text className="text-xs font-urbanist-medium text-primary/60">
                • All baggage is subject to security screening
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-background border-t border-primary/10 px-6 py-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            icon={<Ionicons name="chevron-forward" size={20} color="#fff" />}
          />
        </View>
      </Animated.View>
    </View>
  );
}
