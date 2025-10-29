import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

// Notch for ticket design
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

export default function BookingCard({ booking, onPress, delay = 0 }) {
  const flight = booking.flightId;
  const departureDate = new Date(flight.departureTime);
  const arrivalDate = new Date(flight.arrivalTime);
  const now = new Date();
  const hoursUntilDeparture = (departureDate - now) / (1000 * 60 * 60);

  const canShowBoardingPass =
    hoursUntilDeparture <= 24 && hoursUntilDeparture > 0;

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDuration = () => {
    const diff = (arrivalDate - departureDate) / 60000;
    const h = Math.floor(diff / 60);
    const m = Math.round(diff % 60);
    return `${h}h ${m}m`;
  };

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay).springify()}>
      <Pressable onPress={onPress} className="relative mt-4">
        <View className="bg-primary rounded-[28px] overflow-hidden">
          {/* Top row times/cities + arc */}
          <View className="flex-row items-center justify-between pt-5 px-5 pb-2">
            <View>
              <Text className="text-text/90 font-urbanist-semibold text-[11px]">
                {flight.source}
              </Text>
              <Text className="text-text font-urbanist-bold text-2xl mt-1">
                {formatTime(departureDate)}
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
                {flight.destination}
              </Text>
              <Text className="text-text font-urbanist-bold text-2xl mt-1">
                {formatTime(arrivalDate)}
              </Text>
            </View>
          </View>

          {/* Duration */}
          <Text className="text-text/70 font-urbanist-medium text-[11px] text-center mt-2 px-5">
            {formatDuration()}
          </Text>

          {/* Bottom info bar */}
          <View className="flex-row items-center justify-between mt-4 px-5 pb-3">
            <View>
              <Text className="text-text/70 font-urbanist-medium text-[10px]">
                {flight.flightNumber} •{" "}
                {booking.passengers && booking.passengers.length > 0
                  ? `${booking.passengers.length} Passenger${booking.passengers.length > 1 ? "s" : ""}`
                  : `Seat ${booking.seatNumber}`}
              </Text>
              <Text className="text-text font-urbanist-bold text-lg mt-0.5">
                {booking.travelClass.charAt(0).toUpperCase() +
                  booking.travelClass.slice(1)}
                {booking.passengers && booking.passengers.length > 0 && (
                  <Text className="text-[9px] font-urbanist-medium">
                    {" "}
                    ({booking.passengers.map((p) => p.seatNumber).join(", ")})
                  </Text>
                )}
              </Text>
            </View>
            <Text className="text-text font-urbanist-bold text-xl">
              ₹{booking.price.toLocaleString("en-IN")}
            </Text>
          </View>

          {/* Boarding pass indicator */}
          {canShowBoardingPass && booking.status === "confirmed" && (
            <View className="mt-3 pt-3 border-t border-text/20 px-5 pb-2">
              <View className="flex-row items-center justify-center">
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text className="text-green-400 font-urbanist-semibold text-xs ml-2">
                  Boarding pass ready
                </Text>
              </View>
            </View>
          )}

          {/* Bottom padding for badge */}
          <View className="pb-8" />

          {/* Status Badge - Bottom Center */}
          <View className="absolute bottom-2 left-0 right-0 items-center z-10">
            <View
              className={`px-3 py-1 rounded-full ${
                booking.status === "confirmed"
                  ? "bg-secondary/30"
                  : "bg-red-200/50"
              }`}
            >
              <Text
                className={`font-urbanist-semibold text-[10px] ${
                  booking.status === "confirmed"
                    ? "text-secondary"
                    : "text-red-800"
                }`}
              >
                {booking.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Ticket notches */}
        <Notch side="left" />
        <Notch side="right" />
      </Pressable>
    </Animated.View>
  );
}
