import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  BackHandler,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import Loader from "../components/Loader";
import BookingCard from "../components/BookingCard";
import BookingDetailsModal from "../components/BookingDetailsModal";
import BoardingPassModal from "../components/BoardingPassModal";
import CancellationModal from "../components/CancellationModal";
import { getMyBookings } from "../lib/bookings";
import { toast } from "../lib/toast";

export default function Tickets() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("upcoming");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBoardingPass, setShowBoardingPass] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);

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

    setShowDetailsModal(false);
    setTimeout(() => setShowCancellation(true), 300);
  };

  const handleCancellationSuccess = () => {
    fetchBookings();
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

  // Staggered fade-in helper for smooth entry animations
  const staggeredFadeIn = (index) => {
    return FadeInUp.delay(index * 50)
      .duration(400)
      .easing(Easing.out(Easing.cubic));
  };

  if (loading) {
    return (
      <Loader message="Loading tickets" subtitle="Fetching your bookings" />
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Grouped Header Section - Single Animated.View */}
      <Animated.View
        entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))}
        className="border-b border-primary/10"
      >
        <View className="px-6 pt-6 pb-4">
          <Text className="text-primary font-urbanist-bold text-3xl">
            My Tickets
          </Text>
          <Text className="text-primary/70 font-urbanist mt-1">
            Manage your flight bookings
          </Text>
        </View>

        <View className="px-6 pb-4">
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
        </View>
      </Animated.View>

      {/* Booking List - FlatList for better performance */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#541424"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 0,
          paddingBottom: 176,
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
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
          </View>
        }
        renderItem={({ item: booking, index }) => (
          <BookingCard
            key={booking._id}
            booking={booking}
            delay={index * 50}
            onPress={() => handleBookingPress(booking)}
          />
        )}
      />

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

      <CancellationModal
        visible={showCancellation}
        onClose={() => setShowCancellation(false)}
        booking={selectedBooking}
        onSuccess={handleCancellationSuccess}
      />
    </View>
  );
}
