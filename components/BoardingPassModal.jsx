import { View, Text, Modal, TouchableOpacity } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

export default function BoardingPassModal({ visible, onClose, booking }) {
  if (!booking || !booking.flightId) return null;

  const flight = booking.flightId;
  const departureDate = new Date(flight.departureTime);
  const arrivalDate = new Date(flight.arrivalTime);

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
    });
  };

  const getCityCode = (city) => {
    const codes = {
      Rajkot: "RAJ",
      Mumbai: "BOM",
      Delhi: "DEL",
      Bangalore: "BLR",
      Hyderabad: "HYD",
      Chennai: "MAA",
      Kolkata: "CCU",
      Ahmedabad: "AMD",
      Pune: "PNQ",
      Jaipur: "JAI",
    };
    return codes[city] || city.substring(0, 3).toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={40}
        tint="dark"
        className="flex-1 justify-center px-6"
      >
        <Animated.View
          entering={FadeInUp.duration(400).springify()}
          className="bg-secondary rounded-[32px] overflow-hidden"
        >
          {/* Header */}
          <View className="bg-primary px-6 py-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-secondary font-urbanist-bold text-xl">
                Boarding Pass
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await Haptics.selectionAsync();
                  } catch {}
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-secondary/20 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#e3d7cb" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View className="px-6 py-6">
            {/* Airline */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-primary font-urbanist-bold text-lg">
                AerisGo Airlines
              </Text>
              <Text className="text-primary/60 font-urbanist-medium text-sm">
                {flight.flightNumber}
              </Text>
            </View>

            {/* Route */}
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-primary/70 font-urbanist-medium text-xs">
                  {formatTime(departureDate)}
                </Text>
                <Text className="text-primary font-urbanist-bold text-4xl mt-1">
                  {getCityCode(flight.source)}
                </Text>
              </View>
              <View className="items-center">
                <View className="w-12 h-12 rounded-full items-center justify-center border-2 border-primary/20">
                  <Ionicons
                    name="airplane"
                    size={20}
                    color="#541424"
                    style={{ transform: [{ rotate: "90deg" }] }}
                  />
                </View>
                <Text className="text-primary font-urbanist-medium text-xs mt-1">
                  {formatDate(departureDate)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-primary/70 font-urbanist-medium text-xs">
                  {formatTime(arrivalDate)}
                </Text>
                <Text className="text-primary font-urbanist-bold text-4xl mt-1">
                  {getCityCode(flight.destination)}
                </Text>
              </View>
            </View>

            {/* Details Grid */}
            <View className="space-y-4">
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-primary/60 text-xs font-urbanist-medium">
                    Passenger
                  </Text>
                  <Text className="text-primary font-urbanist-semibold text-base mt-1">
                    {booking.userId?.name || "Passenger"}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-primary/60 text-xs font-urbanist-medium">
                    Seat
                  </Text>
                  <Text className="text-primary font-urbanist-semibold text-base mt-1">
                    {booking.seatNumber}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-primary/60 text-xs font-urbanist-medium">
                    Class
                  </Text>
                  <Text className="text-primary font-urbanist-semibold text-base mt-1 capitalize">
                    {booking.travelClass}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-primary/60 text-xs font-urbanist-medium">
                    Gate
                  </Text>
                  <Text className="text-primary font-urbanist-semibold text-base mt-1">
                    A{Math.floor(Math.random() * 20) + 1}
                  </Text>
                </View>
              </View>
            </View>

            {/* Barcode */}
            <View className="mt-6 h-16 rounded-2xl bg-primary/10 overflow-hidden">
              <View className="flex-row h-full items-end px-2">
                {Array.from({ length: 40 }).map((_, i) => (
                  <View
                    key={i}
                    className="bg-primary mr-1"
                    style={{
                      width: Math.random() > 0.5 ? 2 : 3,
                      height: "100%",
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Booking ID */}
            <Text className="text-center text-primary/60 font-urbanist-medium text-xs mt-3">
              Booking ID: {booking._id?.substring(0, 12).toUpperCase()}
            </Text>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}
