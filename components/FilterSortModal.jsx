import { View, Text, TouchableOpacity, Modal } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

export default function FilterSortModal({
  visible,
  onClose,
  sortBy,
  onSortChange,
}) {
  const sortOptions = [
    {
      id: "price-low",
      label: "Price: Low to High",
      icon: "arrow-up",
      description: "Cheapest flights first",
    },
    {
      id: "price-high",
      label: "Price: High to Low",
      icon: "arrow-down",
      description: "Most expensive first",
    },
    {
      id: "duration-short",
      label: "Duration: Shortest",
      icon: "time-outline",
      description: "Fastest flights first",
    },
    {
      id: "duration-long",
      label: "Duration: Longest",
      icon: "time",
      description: "Longest flights first",
    },
    {
      id: "departure-early",
      label: "Departure: Earliest",
      icon: "sunny-outline",
      description: "Early morning flights",
    },
    {
      id: "departure-late",
      label: "Departure: Latest",
      icon: "moon-outline",
      description: "Evening flights",
    },
  ];

  const handleSelect = async (optionId) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onSortChange(optionId);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={40} tint="dark" className="flex-1 justify-end">
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="flex-1"
        />
        <Animated.View
          entering={FadeInUp.duration(400).springify()}
          className="bg-background rounded-t-[32px] overflow-hidden"
        >
          {/* Header */}
          <View className="px-6 py-5 border-b border-primary/10">
            <View className="flex-row items-center justify-between">
              <Text className="text-primary font-urbanist-bold text-xl">
                Sort Flights
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await Haptics.selectionAsync();
                  } catch {}
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#541424" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sort Options */}
          <View className="px-6 py-4">
            {sortOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleSelect(option.id)}
                activeOpacity={0.7}
                className={`flex-row items-center justify-between py-4 ${
                  index !== sortOptions.length - 1
                    ? "border-b border-primary/5"
                    : ""
                }`}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className={`w-12 h-12 rounded-2xl items-center justify-center ${
                      sortBy === option.id ? "bg-primary" : "bg-primary/5"
                    }`}
                  >
                    <Ionicons
                      name={option.icon}
                      size={22}
                      color={sortBy === option.id ? "#e3d7cb" : "#541424"}
                    />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text
                      className={`font-urbanist-semibold text-base ${
                        sortBy === option.id
                          ? "text-primary"
                          : "text-primary/90"
                      }`}
                    >
                      {option.label}
                    </Text>
                    <Text className="text-primary/60 font-urbanist text-xs mt-0.5">
                      {option.description}
                    </Text>
                  </View>
                </View>
                {sortBy === option.id && (
                  <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                    <Ionicons name="checkmark" size={16} color="#e3d7cb" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom padding for safe area */}
          <View className="h-8" />
        </Animated.View>
      </BlurView>
    </Modal>
  );
}
