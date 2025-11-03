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
import { getAvailableMeals, updateMealPreference } from "../../lib/meals";
import { getBookingById } from "../../lib/bookings";
import { COLORS } from "../../constants/colors";

// Meal category icons/emojis
const categoryIcons = {
  vegetarian: "🥗",
  "non-vegetarian": "🍗",
  vegan: "🌱",
  seafood: "🐟",
  custom: "👨‍🍳",
  none: "🚫",
};

export default function MealSelection() {
  const { id, from } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(null);
  const [meals, setMeals] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);

      // Load booking first
      const bookingData = await getBookingById(id);
      setBooking(bookingData);

      // Get available meals for travel class
      const mealsRes = await getAvailableMeals(bookingData.travelClass);
      setMeals(mealsRes.meals || []);

      // Initialize selected meals
      const initialSelections = {};

      // For multi-passenger bookings
      if (bookingData.passengers && bookingData.passengers.length > 0) {
        bookingData.passengers.forEach((passenger) => {
          initialSelections[passenger.seatNumber] =
            passenger.mealPreference || "no-meal";
        });
      } else {
        // Single passenger
        initialSelections[bookingData.seatNumber] =
          bookingData.mealPreference || "no-meal";
      }

      setSelectedMeals(initialSelections);
    } catch (error) {
      console.error("Load meals error:", error);
      toast.error({
        title: "Error",
        message: error?.message || "Failed to load data",
      });
      router.back();
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  }

  async function handleContinue() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSaving(true);

      // Prepare passenger meals array
      const passengerMeals = Object.entries(selectedMeals).map(
        ([seatNumber, mealId]) => ({
          seatNumber,
          mealId,
        })
      );

      await updateMealPreference(id, { passengerMeals });
      toast.success({
        title: "Success",
        message: "Meal preferences saved!",
      });

      // Navigate to next step
      if (from === "booking") {
        router.push({
          pathname: "/baggage-info/[id]",
          params: { id, from: "booking" },
        });
      } else if (from === "checkin") {
        router.push({
          pathname: "/check-in/[id]",
          params: { id },
        });
      } else {
        router.push("/tickets");
      }
    } catch (error) {
      console.error("Save meals error:", error);
      toast.error({
        title: "Error",
        message: error?.message || "Failed to save meal preferences",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (from === "booking") {
      router.push({
        pathname: "/baggage-info/[id]",
        params: { id, from: "booking" },
      });
    } else if (from === "checkin") {
      router.push({
        pathname: "/check-in/[id]",
        params: { id },
      });
    } else {
      router.push("/tickets");
    }
  }

  function selectMeal(seatNumber, mealId) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMeals((prev) => ({
      ...prev,
      [seatNumber]: mealId,
    }));
  }

  if (loading) {
    return <Loader message="Loading meals" subtitle="Please wait..." />;
  }

  if (!booking) {
    return null;
  }

  const passengers =
    booking.passengers && booking.passengers.length > 0
      ? booking.passengers
      : [{ seatNumber: booking.seatNumber, fullName: "Passenger" }];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} className="px-6 pt-6">
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
            Select Meals
          </Text>
          <View className="w-14" />
        </View>

        <Text className="text-sm font-urbanist-medium text-primary/60 mb-2">
          Choose your preferred meal for the flight
        </Text>

        <View className="bg-green-500/10 rounded-2xl px-4 py-2 flex-row items-center self-start mb-2">
          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
          <Text className="text-xs font-urbanist-semibold text-green-600 ml-2">
            Complimentary - No additional charges
          </Text>
        </View>

        <View className="bg-primary/10 rounded-xl px-3 py-1.5 self-start">
          <Text className="text-xs font-urbanist-semibold text-primary capitalize">
            {booking.travelClass} Class
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Meal Selection for Each Passenger */}
        {passengers.map((passenger, passengerIndex) => (
          <Animated.View
            key={passenger.seatNumber}
            entering={FadeInUp.duration(600).delay(100 + passengerIndex * 50)}
            className="mx-6 mt-4 bg-secondary/40 rounded-[24px] p-5 border border-primary/10"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-urbanist-bold text-primary">
                {passenger.fullName || `Passenger ${passengerIndex + 1}`}
              </Text>
              <View className="bg-primary/10 rounded-lg px-3 py-1">
                <Text className="text-xs font-urbanist-semibold text-primary">
                  Seat {passenger.seatNumber}
                </Text>
              </View>
            </View>

            {/* Meal Options */}
            <View className="gap-3">
              {meals.map((meal, mealIndex) => {
                const isSelected =
                  selectedMeals[passenger.seatNumber] === meal.id;

                return (
                  <TouchableOpacity
                    key={meal.id}
                    onPress={() => selectMeal(passenger.seatNumber, meal.id)}
                    className={`rounded-2xl p-4 border-2 ${
                      isSelected
                        ? "bg-primary/5 border-primary"
                        : "bg-secondary/20 border-primary/10"
                    }`}
                  >
                    <View className="flex-row items-start">
                      <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                        <Text className="text-2xl">
                          {categoryIcons[meal.category] || "🍽️"}
                        </Text>
                      </View>

                      <View className="flex-1">
                        <Text className="text-sm font-urbanist-bold text-primary">
                          {meal.name}
                        </Text>
                        <Text className="text-xs font-urbanist-medium text-primary/60 mt-1">
                          {meal.description}
                        </Text>
                        {meal.price > 0 && (
                          <Text className="text-xs font-urbanist-semibold text-primary mt-1">
                            ₹{meal.price}
                          </Text>
                        )}
                      </View>

                      {isSelected ? (
                        <View className="w-6 h-6 rounded-full bg-primary items-center justify-center ml-2">
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      ) : (
                        <View className="w-6 h-6 rounded-full border-2 border-primary/20 ml-2" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        ))}

        {/* Info Note */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(200 + passengers.length * 50)}
          className="mx-6 mt-6"
        >
          <Text className="text-xs font-urbanist-medium text-primary/60 text-center">
            💡 You can change your meal preference anytime before check-in
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(300)}
        className="absolute bottom-0 left-0 right-0 bg-background border-t border-primary/10 px-6 py-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleSkip}
            disabled={saving}
            className="flex-1 bg-secondary/40 rounded-2xl py-4 items-center justify-center border border-primary/10"
          >
            <Text className="text-sm font-urbanist-bold text-primary">
              Skip for Now
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinue}
            disabled={saving}
            className="flex-1 bg-primary rounded-2xl py-4 items-center justify-center flex-row"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text className="text-sm font-urbanist-bold text-white mr-2">
                  Save & Continue
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
