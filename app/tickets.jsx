import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  BackHandler,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import Loader from "../components/Loader";
import BookingCard from "../components/BookingCard";
import BookingDetailsModal from "../components/BookingDetailsModal";
import BoardingPassModal from "../components/BoardingPassModal";
import { getMyBookings, cancelBooking } from "../lib/bookings";
import { toast } from "../lib/toast";

export default function Tickets() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("upcoming");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBoardingPass, setShowBoardingPass] = useState(false);

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

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}

    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await cancelBooking(selectedBooking._id);
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch {}
      toast.success({
        title: "Booking cancelled",
        message: "Your booking has been cancelled successfully",
      });
      setShowDetailsModal(false);
      fetchBookings();
    } catch (err) {
      toast.error({
        title: "Cancellation failed",
        message: err?.message || "Failed to cancel booking",
      });
    }
  };

  const handleBookingPress = async (booking) => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleShowBoardingPass = () => {
    setShowDetailsModal(false);
    setTimeout(() => {
      setShowBoardingPass(true);
    }, 300);
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
            />
          ))
        )}
        <View className="h-44" />
      </ScrollView>

      <BookingDetailsModal
        visible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        booking={selectedBooking}
        onShowBoardingPass={handleShowBoardingPass}
        onCancel={handleCancelBooking}
      />

      <BoardingPassModal
        visible={showBoardingPass}
        onClose={() => setShowBoardingPass(false)}
        booking={selectedBooking}
      />
    </View>
  );
}
