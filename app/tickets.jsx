import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  BackHandler,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import Loader from "../components/Loader";
import PrimaryButton from "../components/PrimaryButton";
import { getMyBookings, cancelBooking } from "../lib/bookings";
import { toast } from "../lib/toast";

// Micro-interaction: Scale on press
const ScalePress = ({
  children,
  onPress,
  className = "",
  disabled = false,
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        if (!disabled) {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 250 });
        }
      }}
      onPressOut={() => {
        if (!disabled) {
          scale.value = withSpring(1, { damping: 15, stiffness: 250 });
        }
      }}
      onPress={onPress}
      disabled={disabled}
      className={className}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
};

// Booking Card Component
const BookingCard = ({ booking, onPress, onCancel, delay = 0 }) => {
  const flight = booking.flightId;
  const departureDate = new Date(flight.departureTime);
  const arrivalDate = new Date(flight.arrivalTime);
  const now = new Date();
  const hoursUntilDeparture = (departureDate - now) / (1000 * 60 * 60);

  const canShowBoardingPass =
    hoursUntilDeparture <= 24 && hoursUntilDeparture > 0;
  const canCancel = hoursUntilDeparture > 24 && booking.status === "confirmed";
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
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = () => {
    if (booking.status === "cancelled") return "text-red-500";
    if (isPast) return "text-gray-500";
    if (canShowBoardingPass) return "text-green-600";
    return "text-primary";
  };

  const getStatusBg = () => {
    if (booking.status === "cancelled") return "bg-red-50 border-red-200";
    if (isPast) return "bg-gray-50 border-gray-200";
    if (canShowBoardingPass) return "bg-green-50 border-green-200";
    return "bg-secondary/40 border-primary/10";
  };

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay).springify()}>
      <ScalePress onPress={onPress}>
        <View className={`${getStatusBg()} border rounded-[28px] p-4 mb-3`}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Ionicons
                  name="airplane"
                  size={18}
                  color="#541424"
                  style={{ transform: [{ rotate: "90deg" }] }}
                />
              </View>
              <View>
                <Text className="text-primary font-urbanist-bold text-base">
                  {flight.flightNumber}
                </Text>
                <Text className="text-primary/60 font-urbanist text-xs">
                  {formatDate(departureDate)}
                </Text>
              </View>
            </View>
            <View
              className={`px-3 py-1 rounded-full ${
                booking.status === "confirmed" ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <Text
                className={`font-urbanist-semibold text-xs ${
                  booking.status === "confirmed"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {booking.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Route */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
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
            <View className="items-center px-4">
              <Ionicons name="arrow-forward" size={20} color="#541424" />
            </View>
            <View className="flex-1 items-end">
              <Text className="text-primary/60 font-urbanist text-xs">To</Text>
              <Text className="text-primary font-urbanist-bold text-lg">
                {flight.destination}
              </Text>
              <Text className="text-primary/70 font-urbanist text-sm">
                {formatTime(arrivalDate)}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View className="flex-row items-center justify-between pt-3 border-t border-primary/10">
            <View>
              <Text className="text-primary/60 font-urbanist text-xs">
                Seat
              </Text>
              <Text className="text-primary font-urbanist-semibold">
                {booking.seatNumber}
              </Text>
            </View>
            <View>
              <Text className="text-primary/60 font-urbanist text-xs">
                Class
              </Text>
              <Text className="text-primary font-urbanist-semibold capitalize">
                {booking.travelClass}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-primary/60 font-urbanist text-xs">
                Price
              </Text>
              <Text className="text-primary font-urbanist-semibold">
                ₹{booking.price.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Actions */}
          {canShowBoardingPass && booking.status === "confirmed" && (
            <View className="mt-3 pt-3 border-t border-primary/10">
              <View className="bg-green-100 rounded-2xl px-3 py-2 flex-row items-center">
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                <Text className="text-green-700 font-urbanist-semibold text-xs ml-2">
                  Boarding pass available - Tap to view
                </Text>
              </View>
            </View>
          )}

          {canCancel && (
            <View className="mt-3 pt-3 border-t border-primary/10">
              <TouchableOpacity
                onPress={async (e) => {
                  e.stopPropagation();
                  try {
                    await Haptics.selectionAsync();
                  } catch {}
                  onCancel();
                }}
                activeOpacity={0.7}
                className="bg-red-50 rounded-2xl px-3 py-2 flex-row items-center justify-center"
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color="#dc2626"
                />
                <Text className="text-red-600 font-urbanist-semibold text-sm ml-2">
                  Cancel Booking
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScalePress>
    </Animated.View>
  );
};

// Boarding Pass Modal
const BoardingPassModal = ({ visible, onClose, booking }) => {
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
};

export default function Tickets() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("upcoming"); // upcoming, past, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBoardingPass, setShowBoardingPass] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Block Android hardware back from leaving the main tab
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => sub.remove();
    }, [])
  );

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await getMyBookings({ limit: 100 });
      setBookings(data.items || []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      toast.error({
        title: "Error",
        message: err?.message || "Failed to load bookings",
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, 200);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}

    // Confirm cancellation
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch {}
      toast.success({
        title: "Booking cancelled",
        message: "Your booking has been cancelled successfully",
      });
      fetchBookings();
    } catch (err) {
      toast.error({
        title: "Cancellation failed",
        message: err?.message || "Failed to cancel booking",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleBookingPress = (booking) => {
    const flight = booking.flightId;
    const departureDate = new Date(flight.departureTime);
    const now = new Date();
    const hoursUntilDeparture = (departureDate - now) / (1000 * 60 * 60);

    if (
      hoursUntilDeparture <= 24 &&
      hoursUntilDeparture > 0 &&
      booking.status === "confirmed"
    ) {
      setSelectedBooking(booking);
      setShowBoardingPass(true);
    } else {
      // Show details toast
      toast.info({
        title: "Booking Details",
        message: `${flight.flightNumber} - ${flight.source} to ${flight.destination}`,
      });
    }
  };

  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter((booking) => {
      if (filter === "cancelled") {
        return booking.status === "cancelled";
      }
      if (filter === "past") {
        return (
          new Date(booking.flightId.departureTime) < now &&
          booking.status !== "cancelled"
        );
      }
      // upcoming
      return (
        new Date(booking.flightId.departureTime) >= now &&
        booking.status === "confirmed"
      );
    });
  }, [bookings, filter]);

  if (loading) {
    return (
      <Loader message="Loading tickets" subtitle="Fetching your bookings" />
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        className="px-6 pt-6 pb-4"
      >
        <Text className="text-primary font-urbanist-bold text-3xl">
          My Tickets
        </Text>
        <Text className="text-primary/70 font-urbanist mt-1">
          Manage your flight bookings
        </Text>
      </Animated.View>

      {/* Filter Tabs */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(100).springify()}
        className="px-6 mb-4"
      >
        <View className="flex-row gap-2">
          {["upcoming", "past", "cancelled"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={async () => {
                try {
                  await Haptics.selectionAsync();
                } catch {}
                setFilter(tab);
              }}
              activeOpacity={0.7}
              className={`px-4 py-2 rounded-full ${
                filter === tab
                  ? "bg-primary"
                  : "bg-secondary/40 border border-primary/10"
              }`}
            >
              <Text
                className={`font-urbanist-semibold text-sm ${
                  filter === tab ? "text-secondary" : "text-primary"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Bookings List */}
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#541424"
          />
        }
      >
        {filteredBookings.length === 0 ? (
          <Animated.View
            entering={FadeInUp.duration(400).delay(200).springify()}
            className="items-center justify-center py-12"
          >
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
              <Ionicons name="ticket-outline" size={40} color="#541424" />
            </View>
            <Text className="text-primary font-urbanist-bold text-xl">
              No {filter} bookings
            </Text>
            <Text className="text-primary/60 font-urbanist text-center mt-2">
              {filter === "upcoming"
                ? "Book your next flight to see it here"
                : filter === "past"
                  ? "Your completed flights will appear here"
                  : "Your cancelled bookings will appear here"}
            </Text>
          </Animated.View>
        ) : (
          filteredBookings.map((booking, index) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              delay={index * 50}
              onPress={() => handleBookingPress(booking)}
              onCancel={() => handleCancelBooking(booking._id)}
            />
          ))
        )}
        <View className="h-6" />
      </ScrollView>

      {/* Boarding Pass Modal */}
      <BoardingPassModal
        visible={showBoardingPass}
        onClose={() => setShowBoardingPass(false)}
        booking={selectedBooking}
      />
    </View>
  );
}
