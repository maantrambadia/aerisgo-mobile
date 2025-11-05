import { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Loader from "../components/Loader";
import PrimaryButton from "../components/PrimaryButton";
import { toast } from "../lib/toast";
import { apiFetch } from "../lib/api";
import { getDocuments } from "../lib/profile";
import { getFlightSeats, lockSeat, unlockSeat } from "../lib/seats";
import { getDynamicPrice } from "../lib/pricing";
import { useSeatSocket } from "../hooks/useSeatSocket";

const ScaleOnPress = ({ children, className = "", onPress, ...rest }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 220 });
      }}
      onPress={onPress}
      className={className}
      {...rest}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
};

const RoutePill = ({ from, to }) => {
  const fromShort = String(from).split(",")[0].trim();
  const toShort = String(to).split(",")[0].trim();
  return (
    <View className="rounded-full bg-secondary/60 px-4 py-2 flex-row items-center gap-2 border border-primary/10">
      <Ionicons
        name="airplane"
        size={16}
        color="#541424"
        style={{ transform: [{ rotate: "90deg" }] }}
      />
      <Text className="text-primary font-urbanist-medium">{fromShort}</Text>
      <Ionicons name="arrow-forward" size={16} color="#541424" />
      <Text className="text-primary font-urbanist-medium">{toShort}</Text>
    </View>
  );
};

const SeatButton = ({
  seat,
  selected,
  onPress,
  rowClass,
  isLocked,
  isLockedByMe,
}) => {
  const getSeatColor = () => {
    if (selected || isLockedByMe) return "#541424"; // Primary - Selected by me
    if (isLocked) return "#f97316"; // Orange - Locked by someone else
    if (!seat.isAvailable) return "#dc2626"; // Red - Occupied
    if (seat.isExtraLegroom) return "#eab308"; // Yellow - Extra Legroom
    if (rowClass === "first") return "#a855f7"; // Purple - First Class
    if (rowClass === "business") return "#3b82f6"; // Blue - Business
    return "#6b7280"; // Grey - Economy
  };

  const getBorderColor = () => {
    if (selected || isLockedByMe) return "#6b1a2f";
    if (isLocked) return "#ea580c";
    if (!seat.isAvailable) return "#991b1b";
    if (seat.isExtraLegroom) return "#ca8a04";
    if (rowClass === "first") return "#7c3aed";
    if (rowClass === "business") return "#2563eb";
    return "#4b5563";
  };

  const handlePress = () => {
    if (!seat.isAvailable) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast.warn({
        title: "Unavailable",
        message: "This seat is already booked",
      });
      return;
    }
    if (isLocked && !isLockedByMe) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast.warn({
        title: "Seat Locked",
        message: "This seat is being selected by another user",
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(seat);
  };

  return (
    <ScaleOnPress onPress={handlePress}>
      <View
        className="w-11 h-11 rounded-[12px] items-center justify-center border-2"
        style={{
          backgroundColor: getSeatColor(),
          borderColor: getBorderColor(),
        }}
      >
        <Ionicons
          name={
            !seat.isAvailable
              ? "close"
              : isLocked && !isLockedByMe
                ? "lock-closed"
                : "square-outline"
          }
          size={14}
          color="#e3d7cb"
        />
        <Text className="text-[8px] font-urbanist-bold text-text mt-0.5">
          {seat.seatNumber}
        </Text>
      </View>
    </ScaleOnPress>
  );
};

export default function SeatSelection() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [sessionId] = useState(
    () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  const [lockedSeats, setLockedSeats] = useState(new Map()); // Map<seatNumber, {lockedBy, expiresAt}>
  const userUnlockingRef = useRef(new Set()); // Track seats being unlocked by user
  const [lockStartTime, setLockStartTime] = useState(null); // Track when first seat was locked
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const timerRef = useRef(null);

  // Round-trip support
  const [currentStep, setCurrentStep] = useState("outbound"); // "outbound" or "return"
  const [outboundSelectedSeats, setOutboundSelectedSeats] = useState([]);
  const [returnSeats, setReturnSeats] = useState([]);
  const [returnLockedSeats, setReturnLockedSeats] = useState(new Map());

  const flight = useMemo(() => {
    try {
      return JSON.parse(params.flight || "{}");
    } catch {
      return {};
    }
  }, [params.flight]);

  // Parse outbound and return flights for round-trip
  const outboundFlight = useMemo(() => {
    try {
      return JSON.parse(params.outboundFlight || "{}");
    } catch {
      return {};
    }
  }, [params.outboundFlight]);

  const returnFlight = useMemo(() => {
    try {
      return JSON.parse(params.returnFlight || "{}");
    } catch {
      return {};
    }
  }, [params.returnFlight]);

  const {
    from,
    to,
    date,
    passengers,
    tripType = "oneway",
    returnDate,
  } = params;
  const isRoundTrip = tripType === "roundtrip";
  const currentFlight = isRoundTrip
    ? currentStep === "outbound"
      ? outboundFlight
      : returnFlight
    : flight;
  const maxSeats = parseInt(passengers || 1);

  useEffect(() => {
    fetchData();
  }, [currentFlight, currentStep]);

  async function fetchData() {
    try {
      setLoading(true);

      // Check if user has documents
      const documentsRes = await getDocuments();
      const userDocs = documentsRes.documents || [];

      if (userDocs.length === 0) {
        setLoading(false);
        setHasDocuments(false);
        setShowDocumentModal(true);
        return;
      }

      setHasDocuments(true);

      // Check if user already has a booking on this flight
      const bookingsRes = await apiFetch("/bookings/my-bookings", {
        method: "GET",
        auth: true,
      });

      const existingBooking = bookingsRes.data?.items?.find(
        (booking) =>
          booking.flightId?._id === currentFlight._id &&
          (booking.status === "confirmed" || booking.status === "pending")
      );

      if (existingBooking) {
        setLoading(false);
        toast.error({
          title: "Already Booked",
          message: `You already have a booking on this flight (Seat ${existingBooking.seatNumber})`,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => {
          router.back();
        }, 2000);
        return;
      }

      // Fetch seats
      const seatsRes = await getFlightSeats(currentFlight._id);

      // Fetch pricing config
      const pricingRes = await apiFetch("/pricing/config", {
        method: "GET",
        auth: true,
      });

      if (isRoundTrip && currentStep === "return") {
        setReturnSeats(seatsRes.seats || []);
        // Initialize return locked seats
        const initialLocks = new Map();
        (seatsRes.seats || []).forEach((seat) => {
          if (seat.lockedBy && seat.lockExpiresAt) {
            initialLocks.set(seat.seatNumber, {
              lockedBy: seat.lockedBy,
              expiresAt: new Date(seat.lockExpiresAt),
            });
          }
        });
        setReturnLockedSeats(initialLocks);
      } else {
        setSeats(seatsRes.seats || []);
        // Initialize locked seats from server
        const initialLocks = new Map();
        (seatsRes.seats || []).forEach((seat) => {
          if (seat.lockedBy && seat.lockExpiresAt) {
            initialLocks.set(seat.seatNumber, {
              lockedBy: seat.lockedBy,
              expiresAt: new Date(seat.lockExpiresAt),
            });
          }
        });
        setLockedSeats(initialLocks);
      }

      setPricingConfig(pricingRes.data.config);
    } catch (err) {
      toast.error({
        title: "Error",
        message: err?.message || "Failed to load seats",
      });
      router.back();
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  }

  // Timer countdown effect
  useEffect(() => {
    if (!lockStartTime) {
      // Clear timer if no start time
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Calculate and update remaining time
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - lockStartTime) / 1000);
      const remaining = Math.max(0, 600 - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(timerRef.current);
        // Unlock all seats and redirect
        toast.error({
          title: "Time Expired",
          message: "Your seat selection has expired. Please select again.",
        });
        setTimeout(() => {
          router.back();
        }, 2000);
      }
    };

    updateTimer(); // Initial update
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [lockStartTime, router]);

  // Socket.IO real-time event handlers
  const socketHandlers = useMemo(
    () => ({
      onSeatLocked: (data) => {
        if (data.flightId !== currentFlight._id) return;
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.set(data.seatNumber, {
            lockedBy: data.lockedBy,
            expiresAt: new Date(data.lockExpiresAt),
          });
          return newLocks;
        });
      },
      onSeatUnlocked: (data) => {
        if (data.flightId !== currentFlight._id) return;
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.delete(data.seatNumber);
          return newLocks;
        });
        // Check if this was our selected seat
        const wasSelected = selectedSeats.some(
          (s) => s.seatNumber === data.seatNumber
        );
        if (wasSelected) {
          setSelectedSeats((prev) =>
            prev.filter((s) => s.seatNumber !== data.seatNumber)
          );
          // Only show message if we didn't unlock it ourselves
          const wasUserInitiated = userUnlockingRef.current.has(
            data.seatNumber
          );
          if (!wasUserInitiated) {
            toast.warn({
              message: `Seat ${data.seatNumber} was released by admin`,
            });
          }
        }
      },
      onSeatBooked: (data) => {
        if (data.flightId !== currentFlight._id) return;
        // Update seat availability
        setSeats((prevSeats) =>
          prevSeats.map((s) =>
            s.seatNumber === data.seatNumber ? { ...s, isAvailable: false } : s
          )
        );
        // Remove from locked seats
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.delete(data.seatNumber);
          return newLocks;
        });
      },
      onSeatExpired: (data) => {
        if (data.flightId !== currentFlight._id) return;
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.delete(data.seatNumber);
          return newLocks;
        });
        // Check if it was our seat
        const wasOurSeat = selectedSeats.some(
          (s) => s.seatNumber === data.seatNumber
        );
        if (wasOurSeat) {
          toast.warn({
            title: "Seat Lock Expired",
            message: `Your selection for seat ${data.seatNumber} has expired`,
          });
          setSelectedSeats((prev) =>
            prev.filter((s) => s.seatNumber !== data.seatNumber)
          );
        }
      },
      onSeatCancelled: (data) => {
        if (data.flightId !== currentFlight._id) return;
        // Booking was cancelled, seat becomes available again
        setSeats((prevSeats) =>
          prevSeats.map((s) =>
            s.seatNumber === data.seatNumber ? { ...s, isAvailable: true } : s
          )
        );
        // Remove from locked seats if it was locked
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.delete(data.seatNumber);
          return newLocks;
        });
      },
      onError: (error) => {
        console.error("Socket error:", error);
      },
    }),
    [currentFlight._id, selectedSeats]
  );

  // Initialize Socket.IO connection
  useSeatSocket(currentFlight._id, socketHandlers);

  async function handleSeatSelect(seat) {
    const isAlreadySelected = selectedSeats.some(
      (s) => s.seatNumber === seat.seatNumber
    );

    if (isAlreadySelected) {
      // Unlock the seat
      try {
        // Mark this seat as being unlocked by user
        userUnlockingRef.current.add(seat.seatNumber);

        await unlockSeat({
          flightId: currentFlight._id,
          seatNumber: seat.seatNumber,
          sessionId,
        });
        const newSelectedSeats = selectedSeats.filter(
          (s) => s.seatNumber !== seat.seatNumber
        );
        setSelectedSeats(newSelectedSeats);

        // Reset timer if all seats are deselected
        if (newSelectedSeats.length === 0) {
          setLockStartTime(null);
          setTimeRemaining(600);
        }

        // Remove from tracking after a short delay
        setTimeout(() => {
          userUnlockingRef.current.delete(seat.seatNumber);
        }, 1000);
      } catch (error) {
        console.error("Failed to unlock seat:", error);
        toast.error({
          title: "Error",
          message: "Failed to deselect seat",
        });
      }
    } else {
      if (selectedSeats.length >= maxSeats) {
        toast.warn({
          title: "Limit Reached",
          message: `You can only select ${maxSeats} seat(s)`,
        });
        return;
      }

      // Lock the seat
      try {
        // Only pass previousSeat if we're at max capacity (replacing a seat)
        // For multiple passengers, don't unlock previous seats
        const previousSeat =
          selectedSeats.length >= maxSeats
            ? selectedSeats[0].seatNumber
            : undefined;
        await lockSeat({
          flightId: currentFlight._id,
          seatNumber: seat.seatNumber,
          sessionId,
          previousSeat,
        });
        const newSelectedSeats = [...selectedSeats, seat];
        setSelectedSeats(newSelectedSeats);

        // Start timer when first seat is selected
        if (selectedSeats.length === 0 && !lockStartTime) {
          setLockStartTime(Date.now());
        }
      } catch (error) {
        console.error("Failed to lock seat:", error);
        const message =
          error.message ||
          "Failed to select seat. It may be locked by another user.";
        toast.error({
          title: "Error",
          message,
        });
      }
    }
  }

  // Format time remaining
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  function handleContinue() {
    if (selectedSeats.length === 0) {
      toast.warn({
        title: "No Seat Selected",
        message: "Please select at least one seat",
      });
      return;
    }

    if (selectedSeats.length < maxSeats) {
      toast.warn({
        title: "Incomplete Selection",
        message: `Please select ${maxSeats} seat(s)`,
      });
      return;
    }

    // For round-trip, handle two-step flow
    if (isRoundTrip && currentStep === "outbound") {
      // Save outbound seats and move to return flight
      setOutboundSelectedSeats(selectedSeats);
      setSelectedSeats([]);
      setCurrentStep("return");
      toast.success({
        title: "Outbound Seats Selected",
        message: "Now select seats for your return flight",
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isRoundTrip) {
      router.push({
        pathname: "/passenger-details",
        params: {
          outboundFlight: JSON.stringify(outboundFlight),
          returnFlight: JSON.stringify(returnFlight),
          outboundSeats: JSON.stringify(outboundSelectedSeats),
          returnSeats: JSON.stringify(selectedSeats),
          from,
          to,
          date,
          returnDate,
          tripType: "roundtrip",
          totalPrice: totalPrice.toString(), // Pass dynamic price
          lockStartTime: lockStartTime?.toString(), // Pass timer start time
        },
      });
    } else {
      router.push({
        pathname: "/passenger-details",
        params: {
          flight: JSON.stringify(flight),
          seats: JSON.stringify(selectedSeats),
          from,
          to,
          date,
          tripType: "oneway",
          totalPrice: totalPrice.toString(), // Pass dynamic price
          lockStartTime: lockStartTime?.toString(), // Pass timer start time
        },
      });
    }
  }

  // Group seats by row - use correct seats based on current step
  const currentSeats =
    isRoundTrip && currentStep === "return" ? returnSeats : seats;
  const currentLockedSeats =
    isRoundTrip && currentStep === "return" ? returnLockedSeats : lockedSeats;

  const seatsByRow = useMemo(() => {
    const rows = {};
    currentSeats.forEach((seat) => {
      const match = seat.seatNumber.match(/^(\d+)([A-F])$/);
      if (match) {
        const rowNum = parseInt(match[1]);
        if (!rows[rowNum]) rows[rowNum] = {};
        rows[rowNum][match[2]] = seat;
      }
    });
    return rows;
  }, [currentSeats]);

  const rowNumbers = Object.keys(seatsByRow)
    .map(Number)
    .sort((a, b) => a - b);

  const getRowClass = (rowNum) => {
    if (rowNum <= 2) return "first";
    if (rowNum <= 7) return "business";
    return "economy";
  };

  // Helper to check if seat is locked
  const getSeatLockStatus = (seatNumber) => {
    const lock = currentLockedSeats.get(seatNumber);
    if (!lock) return { isLocked: false, isLockedByMe: false };

    const now = new Date();
    if (lock.expiresAt < now) {
      return { isLocked: false, isLockedByMe: false };
    }

    // Check if locked by current user (by checking if it's in selectedSeats)
    const isLockedByMe = selectedSeats.some((s) => s.seatNumber === seatNumber);
    return { isLocked: true, isLockedByMe };
  };

  // State for dynamic pricing
  const [dynamicPricing, setDynamicPricing] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Fetch dynamic pricing when seat selection changes
  useEffect(() => {
    if (selectedSeats.length === 0 || !currentFlight._id) {
      setDynamicPricing(null);
      return;
    }

    const fetchDynamicPricing = async () => {
      try {
        setLoadingPrice(true);
        // Calculate total for all selected seats
        let totalDynamic = 0;

        for (const seat of selectedSeats) {
          const seatType =
            seat.seatNumber.includes("A") || seat.seatNumber.includes("F")
              ? "window"
              : seat.seatNumber.includes("C") || seat.seatNumber.includes("D")
                ? "aisle"
                : "middle";

          const priceData = await getDynamicPrice(
            currentFlight._id,
            seat.travelClass,
            seat.isExtraLegroom,
            seatType
          );

          totalDynamic += priceData.pricing.total;
        }

        setDynamicPricing({ total: totalDynamic });
      } catch (error) {
        console.error("Failed to fetch dynamic pricing:", error);
        // Fallback to static pricing if dynamic fails
        setDynamicPricing(null);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchDynamicPricing();
  }, [selectedSeats, currentFlight._id]);

  // Calculate total price (use dynamic if available, fallback to static)
  const totalPrice = useMemo(() => {
    if (dynamicPricing) {
      return Math.round(dynamicPricing.total * 100) / 100;
    }

    // Fallback to static pricing
    if (!pricingConfig) return 0;

    let total = 0;
    selectedSeats.forEach((seat) => {
      const classMultiplier =
        pricingConfig.travelClass[seat.travelClass]?.multiplier || 1;
      const classPrice = currentFlight.baseFare * classMultiplier;
      const extraLegroom = seat.isExtraLegroom
        ? pricingConfig.extraLegroom.charge
        : 0;
      const subtotal = classPrice + extraLegroom;

      // Add taxes
      const gst = subtotal * pricingConfig.taxes.gst;
      const fuelSurcharge = subtotal * pricingConfig.taxes.fuelSurcharge;
      const airportFee = pricingConfig.taxes.airportFee;

      total += subtotal + gst + fuelSurcharge + airportFee;
    });

    return Math.round(total * 100) / 100;
  }, [selectedSeats, pricingConfig, currentFlight.baseFare, dynamicPricing]);

  if (loading) {
    return <Loader message="Loading seat map" subtitle="Please wait..." />;
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))}
        className="px-6 pt-6 pb-4"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            accessibilityLabel="Go back"
            className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15"
            onPress={async () => {
              try {
                await Haptics.selectionAsync();
              } catch {}
              router.back();
            }}
          >
            <Ionicons name="chevron-back" size={22} color="#541424" />
          </TouchableOpacity>
          <Text className="text-primary font-urbanist-semibold text-lg">
            Select Seats
          </Text>
          <TouchableOpacity
            className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15"
            onPress={async () => {
              try {
                await Haptics.selectionAsync();
              } catch {}
            }}
          >
            <Ionicons name="notifications-outline" size={22} color="#541424" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Grouped Content Animation */}
      <Animated.View
        entering={FadeInUp.duration(400)
          .delay(100)
          .easing(Easing.out(Easing.cubic))}
        className="flex-1"
      >
        {/* Title + Route */}
        <View className="px-6 mt-4">
          <View className="flex-row items-start justify-between">
            <View style={{ maxWidth: "60%" }}>
              <Text className="text-primary font-urbanist-bold text-3xl leading-9">
                Choose
              </Text>
              <Text className="text-primary font-urbanist-bold text-3xl leading-9 -mt-1">
                Your Seat
              </Text>
              {isRoundTrip && (
                <Text className="text-primary/60 font-urbanist-medium text-sm mt-1">
                  {currentStep === "outbound"
                    ? "Outbound Flight"
                    : "Return Flight"}
                </Text>
              )}
            </View>
            <RoutePill
              from={currentStep === "return" ? to : from}
              to={currentStep === "return" ? from : to}
            />
          </View>
        </View>

        {/* Selection Info */}
        <View className="px-6 mt-4 pb-4 border-b border-primary/10">
          <View className="bg-secondary/40 rounded-[20px] p-4 border border-primary/10">
            <View className="flex-row items-center justify-between">
              <Text className="text-primary/70 font-urbanist-medium text-sm">
                Selected
              </Text>
              <Text className="text-primary font-urbanist-bold text-lg">
                {selectedSeats.length} / {maxSeats}
              </Text>
            </View>
            {isRoundTrip && (
              <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-primary/10">
                <Text className="text-primary/70 font-urbanist-medium text-sm">
                  Step
                </Text>
                <Text className="text-primary font-urbanist-semibold text-sm">
                  {currentStep === "outbound" ? "1 of 2" : "2 of 2"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          className="flex-1"
        >
          {/* Horizontal Seat Map */}
          <View className="mt-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingBottom: 16,
              }}
              snapToInterval={100}
              decelerationRate="fast"
            >
              {/* Cockpit */}
              <View className="w-20 mr-3">
                {/* Top spacing to match row labels (h-4 + h-6 + mb-1 + mb-1 = 44px) */}
                <View className="h-11" />
                <View className="w-16 h-[340px] bg-primary/10 rounded-l-[32px] border-2 border-primary/20 items-center justify-center">
                  <Ionicons name="airplane" size={28} color="#541424" />
                  <Text className="text-primary font-urbanist-bold text-[10px] mt-2">
                    COCKPIT
                  </Text>
                </View>
              </View>

              {/* Seat Rows */}
              {rowNumbers.map((rowNum, index) => {
                const row = seatsByRow[rowNum];
                const rowClass = getRowClass(rowNum);
                const isExitRow = rowNum === 10 || rowNum === 11;
                const isFirstOfClass =
                  rowNum === 1 || rowNum === 3 || rowNum === 8;

                return (
                  <View key={rowNum} className="w-24 mr-1.5">
                    {/* Class Label - Fixed height container for consistent alignment */}
                    <View className="items-center mb-1 h-4">
                      {isFirstOfClass && (
                        <View
                          className={`px-2 py-0.5 rounded-full ${
                            rowClass === "first"
                              ? "bg-purple-500/20"
                              : rowClass === "business"
                                ? "bg-blue-500/20"
                                : "bg-gray-500/20"
                          }`}
                        >
                          <Text
                            className={`font-urbanist-bold text-[9px] ${
                              rowClass === "first"
                                ? "text-purple-700"
                                : rowClass === "business"
                                  ? "text-blue-700"
                                  : "text-gray-700"
                            }`}
                          >
                            {rowClass === "first"
                              ? "FIRST"
                              : rowClass === "business"
                                ? "BUSINESS"
                                : "ECONOMY"}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Row Number Top - Fixed height container */}
                    <View className="items-center mb-1 h-6">
                      <Text className="text-primary/50 font-urbanist-bold text-[11px]">
                        {rowNum}
                      </Text>
                      {isExitRow && (
                        <View className="bg-yellow-500/20 px-1.5 py-0.5 rounded-full mt-0.5">
                          <Text className="text-yellow-700 font-urbanist-bold text-[8px]">
                            EXIT
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Seats Column - Vertical arrangement from bottom to top (A to F) */}
                    <View className="h-[300px] justify-center items-center">
                      <View className="gap-2">
                        {/* Window Seat F (Right side) - TOP */}
                        {["F"].map((letter) => {
                          const seat = row[letter];
                          if (!seat)
                            return <View key={letter} className="h-11" />;
                          const lockStatus = getSeatLockStatus(seat.seatNumber);
                          return (
                            <SeatButton
                              key={letter}
                              seat={seat}
                              selected={selectedSeats.some(
                                (s) => s.seatNumber === seat.seatNumber
                              )}
                              onPress={handleSeatSelect}
                              rowClass={rowClass}
                              isLocked={lockStatus.isLocked}
                              isLockedByMe={lockStatus.isLockedByMe}
                            />
                          );
                        })}

                        {/* Middle Seat E (Right side) */}
                        {["E"].map((letter) => {
                          const seat = row[letter];
                          if (!seat)
                            return <View key={letter} className="h-11" />;
                          const lockStatus = getSeatLockStatus(seat.seatNumber);
                          return (
                            <SeatButton
                              key={letter}
                              seat={seat}
                              selected={selectedSeats.some(
                                (s) => s.seatNumber === seat.seatNumber
                              )}
                              onPress={handleSeatSelect}
                              rowClass={rowClass}
                              isLocked={lockStatus.isLocked}
                              isLockedByMe={lockStatus.isLockedByMe}
                            />
                          );
                        })}

                        {/* Aisle Seat D (Right side) */}
                        {["D"].map((letter) => {
                          const seat = row[letter];
                          if (!seat)
                            return <View key={letter} className="h-11" />;
                          const lockStatus = getSeatLockStatus(seat.seatNumber);
                          return (
                            <SeatButton
                              key={letter}
                              seat={seat}
                              selected={selectedSeats.some(
                                (s) => s.seatNumber === seat.seatNumber
                              )}
                              onPress={handleSeatSelect}
                              rowClass={rowClass}
                              isLocked={lockStatus.isLocked}
                              isLockedByMe={lockStatus.isLockedByMe}
                            />
                          );
                        })}

                        {/* Aisle Separator */}
                        <View className="h-4 items-center justify-center">
                          <View className="w-full h-[2px] bg-blue-300/40" />
                        </View>

                        {/* Aisle Seat C (Left side) */}
                        {["C"].map((letter) => {
                          const seat = row[letter];
                          if (!seat)
                            return <View key={letter} className="h-11" />;
                          const lockStatus = getSeatLockStatus(seat.seatNumber);
                          return (
                            <SeatButton
                              key={letter}
                              seat={seat}
                              selected={selectedSeats.some(
                                (s) => s.seatNumber === seat.seatNumber
                              )}
                              onPress={handleSeatSelect}
                              rowClass={rowClass}
                              isLocked={lockStatus.isLocked}
                              isLockedByMe={lockStatus.isLockedByMe}
                            />
                          );
                        })}

                        {/* Middle Seat B (Left side) */}
                        {["B"].map((letter) => {
                          const seat = row[letter];
                          if (!seat)
                            return <View key={letter} className="h-11" />;
                          const lockStatus = getSeatLockStatus(seat.seatNumber);
                          return (
                            <SeatButton
                              key={letter}
                              seat={seat}
                              selected={selectedSeats.some(
                                (s) => s.seatNumber === seat.seatNumber
                              )}
                              onPress={handleSeatSelect}
                              rowClass={rowClass}
                              isLocked={lockStatus.isLocked}
                              isLockedByMe={lockStatus.isLockedByMe}
                            />
                          );
                        })}

                        {/* Window Seat A (Left side) - BOTTOM */}
                        {["A"].map((letter) => {
                          const seat = row[letter];
                          if (!seat)
                            return <View key={letter} className="h-11" />;
                          const lockStatus = getSeatLockStatus(seat.seatNumber);
                          return (
                            <SeatButton
                              key={letter}
                              seat={seat}
                              selected={selectedSeats.some(
                                (s) => s.seatNumber === seat.seatNumber
                              )}
                              onPress={handleSeatSelect}
                              rowClass={rowClass}
                              isLocked={lockStatus.isLocked}
                              isLockedByMe={lockStatus.isLockedByMe}
                            />
                          );
                        })}
                      </View>
                    </View>

                    {/* Row Number Bottom - Fixed height container */}
                    <View className="items-center mt-1 h-4">
                      <Text className="text-primary/50 font-urbanist-bold text-[11px]">
                        {rowNum}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* Tail */}
              <View className="w-20 ml-3">
                {/* Top spacing to match row labels (h-4 + h-6 + mb-1 + mb-1 = 44px) */}
                <View className="h-11" />
                <View className="w-16 h-[340px] bg-primary/10 rounded-r-[32px] border-2 border-primary/20 items-center justify-center">
                  <Ionicons name="exit-outline" size={24} color="#541424" />
                  <Text className="text-primary font-urbanist-bold text-[10px] mt-2">
                    TAIL
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Legend */}
          <View className="px-6 mt-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              <View className="flex-row items-center gap-2">
                <View className="w-4 h-4 rounded bg-purple-500" />
                <Text className="text-primary/70 font-urbanist-medium text-xs">
                  First
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-4 h-4 rounded bg-blue-500" />
                <Text className="text-primary/70 font-urbanist-medium text-xs">
                  Business
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-4 h-4 rounded bg-gray-500" />
                <Text className="text-primary/70 font-urbanist-medium text-xs">
                  Economy
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-4 h-4 rounded bg-yellow-500" />
                <Text className="text-primary/70 font-urbanist-medium text-xs">
                  Extra Legroom
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-4 h-4 rounded bg-red-600" />
                <Text className="text-primary/70 font-urbanist-medium text-xs">
                  Occupied
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-4 h-4 rounded bg-primary" />
                <Text className="text-primary/70 font-urbanist-medium text-xs">
                  Selected
                </Text>
              </View>
            </ScrollView>
          </View>

          {/* Total Fare and Button - Inside scrollable content */}
          <View className="px-6 mt-6">
            {/* Timer Display */}
            {lockStartTime && (
              <View
                className={`rounded-[20px] p-3 mb-3 border flex-row items-center gap-3 ${
                  timeRemaining <= 60
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    timeRemaining <= 60 ? "bg-red-100" : "bg-yellow-100"
                  }`}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={timeRemaining <= 60 ? "#dc2626" : "#ca8a04"}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-urbanist-bold text-sm ${
                      timeRemaining <= 60 ? "text-red-700" : "text-yellow-700"
                    }`}
                  >
                    Complete booking in {formatTimeRemaining()}
                  </Text>
                  <Text
                    className={`font-urbanist-medium text-xs ${
                      timeRemaining <= 60 ? "text-red-600" : "text-yellow-600"
                    }`}
                  >
                    Seats will be released after timer expires
                  </Text>
                </View>
              </View>
            )}

            <View className="bg-secondary/40 rounded-[20px] p-3 mb-3 border border-primary/10">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-primary/70 font-urbanist-medium text-sm">
                    Total Fare
                  </Text>
                  {dynamicPricing && (
                    <View className="bg-primary/10 rounded-full px-2 py-0.5">
                      <Text className="text-primary font-urbanist-semibold text-[10px]">
                        LIVE
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center gap-1">
                  {loadingPrice && (
                    <Text className="text-primary/40 font-urbanist-medium text-xs">
                      Updating...
                    </Text>
                  )}
                  <Text className="text-primary font-urbanist-bold text-xl">
                    ₹ {totalPrice.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
              {dynamicPricing && (
                <Text className="text-primary/50 font-urbanist text-[10px] mt-1">
                  Price includes demand & time-based adjustments
                </Text>
              )}
            </View>
            <PrimaryButton
              title={
                isRoundTrip && currentStep === "outbound"
                  ? "Continue to Return Flight"
                  : "Continue to Passenger Details"
              }
              onPress={handleContinue}
              disabled={selectedSeats.length === 0}
            />
          </View>
        </ScrollView>
      </Animated.View>

      {/* Document Required Modal */}
      <Modal
        visible={showDocumentModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <Animated.View
            entering={ZoomIn.duration(400).easing(Easing.out(Easing.cubic))}
          >
            <View className="bg-background rounded-[32px] border-2 border-primary/15 overflow-hidden">
              <View className="p-8 items-center">
                {/* Icon */}
                <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-5">
                  <Ionicons name="document-text" size={48} color="#541424" />
                </View>

                {/* Title */}
                <Text className="text-primary font-urbanist-bold text-2xl mb-2 text-center">
                  Document Required
                </Text>

                {/* Subtitle */}
                <Text className="text-primary/70 font-urbanist-medium text-base text-center mb-6">
                  Please add your identification document (Aadhar or Passport)
                  to continue booking
                </Text>

                {/* Buttons */}
                <View className="w-full gap-3">
                  <PrimaryButton
                    title="Add Document"
                    onPress={async () => {
                      try {
                        await Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Medium
                        );
                      } catch {}
                      setShowDocumentModal(false);
                      router.push("/user-documents");
                    }}
                    leftIconName="add-circle"
                  />
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await Haptics.selectionAsync();
                      } catch {}
                      setShowDocumentModal(false);
                      router.back();
                    }}
                    className="bg-primary/10 rounded-[20px] py-4 items-center"
                  >
                    <Text className="text-primary font-urbanist-semibold text-base">
                      Go Back
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
