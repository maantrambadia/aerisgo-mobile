import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import Loader from "../components/Loader";
import PrimaryButton from "../components/PrimaryButton";
import FormInput from "../components/FormInput";
import BottomSheetModal from "../components/BottomSheetModal";
import { toast } from "../lib/toast";
import { getProfile } from "../lib/profile";
import { COLORS } from "../constants/colors";

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

// Ticket notch decoration (matches Flight Details)
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

export default function PassengerDetails() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [passengers, setPassengers] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [showGenderPicker, setShowGenderPicker] = useState(null);
  const [showDocTypePicker, setShowDocTypePicker] = useState(null);

  const flight = params.flight ? JSON.parse(params.flight) : null;
  const seats = params.seats ? JSON.parse(params.seats) : [];

  // Round-trip support
  const outboundFlight = params.outboundFlight
    ? JSON.parse(params.outboundFlight)
    : null;
  const returnFlight = params.returnFlight
    ? JSON.parse(params.returnFlight)
    : null;
  const outboundSeats = params.outboundSeats
    ? JSON.parse(params.outboundSeats)
    : [];
  const returnSeats = params.returnSeats ? JSON.parse(params.returnSeats) : [];
  const { from, to, date, tripType = "oneway", returnDate } = params;
  const isRoundTrip = tripType === "roundtrip";

  // Use correct flight and seats based on trip type
  // For round-trip, only ask for passenger details once (for outbound seats)
  // The same passengers will be used for both flights
  const currentFlight = isRoundTrip ? outboundFlight : flight;
  const currentSeats = isRoundTrip ? outboundSeats : seats;

  useEffect(() => {
    if (isRoundTrip) {
      if (!outboundFlight || !returnFlight) {
        console.log("Missing flights:", { outboundFlight, returnFlight });
        toast.error({
          title: "Error",
          message: "Flight information missing",
        });
        setTimeout(() => router.replace("/"), 1000);
        return;
      }
      if (outboundSeats.length === 0 && returnSeats.length === 0) {
        console.log("Missing seats:", { outboundSeats, returnSeats });
        toast.error({
          title: "Error",
          message: "Seat information missing",
        });
        setTimeout(() => router.replace("/"), 1000);
        return;
      }
    } else {
      if (!flight || !seats || seats.length === 0) {
        console.log("Missing flight or seats:", { flight, seats });
        toast.error({
          title: "Error",
          message: "Flight or seat information missing",
        });
        setTimeout(() => router.replace("/"), 1000);
        return;
      }
    }
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    try {
      const profile = await getProfile();

      // Initialize passengers array
      const initialPassengers = currentSeats.map((seat, index) => ({
        seatNumber: seat.seatNumber,
        isPrimary: index === 0,
        fullName: index === 0 ? profile.user.name : "",
        dateOfBirth: "",
        gender: index === 0 ? profile.user.gender : "",
        email: index === 0 ? profile.user.email : "",
        phone: index === 0 ? profile.user.phone : "",
        documentType: "",
        documentNumber: "",
      }));

      // Pre-fill primary passenger document if available
      if (profile.documents && profile.documents.length > 0) {
        const primaryDoc = profile.documents[0];
        initialPassengers[0].documentType = primaryDoc.documentType;
        initialPassengers[0].documentNumber = primaryDoc.documentNumber;
      }

      setPassengers(initialPassengers);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error({
        title: "Error",
        message: "Failed to load profile",
      });
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  }

  function handlePassengerChange(index, field, value) {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  function validatePassengers() {
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.fullName || !p.fullName.trim()) {
        toast.error({
          title: "Missing Information",
          message: `Please enter name for passenger ${i + 1}`,
        });
        return false;
      }
      if (!p.dateOfBirth) {
        toast.error({
          title: "Missing Information",
          message: `Please enter date of birth for passenger ${i + 1}`,
        });
        return false;
      }
      if (!p.gender) {
        toast.error({
          title: "Missing Information",
          message: `Please select gender for passenger ${i + 1}`,
        });
        return false;
      }
      if (!p.documentType) {
        toast.error({
          title: "Missing Information",
          message: `Please select document type for passenger ${i + 1}`,
        });
        return false;
      }
      if (!p.documentNumber || !p.documentNumber.trim()) {
        toast.error({
          title: "Missing Information",
          message: `Please enter document number for passenger ${i + 1}`,
        });
        return false;
      }
    }
    return true;
  }

  function handleContinue() {
    if (!validatePassengers()) {
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isRoundTrip) {
      router.push({
        pathname: "/booking-confirmation",
        params: {
          outboundFlight: JSON.stringify(outboundFlight),
          returnFlight: JSON.stringify(returnFlight),
          outboundSeats: JSON.stringify(outboundSeats),
          returnSeats: JSON.stringify(returnSeats),
          passengers: JSON.stringify(passengers),
          from,
          to,
          date,
          returnDate,
          tripType: "roundtrip",
        },
      });
    } else {
      router.push({
        pathname: "/booking-confirmation",
        params: {
          flight: JSON.stringify(flight),
          seats: JSON.stringify(seats),
          passengers: JSON.stringify(passengers),
          from,
          to,
          date,
          tripType: "oneway",
        },
      });
    }
  }

  const formatTime = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "--:--";
    }
  };

  if (loading) {
    return (
      <Loader
        message="Loading passenger details"
        subtitle="Preparing your form"
      />
    );
  }

  // Safety check for required data
  if (!currentFlight || currentSeats.length === 0) {
    return (
      <Loader message="Loading flight details" subtitle="Please wait..." />
    );
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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15"
          >
            <Ionicons name="chevron-back" size={22} color="#541424" />
          </TouchableOpacity>
          <Text className="text-lg font-urbanist-bold text-primary">
            Passenger Details
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <Animated.View
          entering={FadeInUp.duration(400)
            .delay(100)
            .easing(Easing.out(Easing.cubic))}
          className="flex-1"
        >
          {/* Flight Info Card with Border */}
          <View className="mt-4 pb-4 border-b border-primary/10">
            <View className="relative mx-6 p-5 bg-primary rounded-[28px] overflow-hidden">
              <View className="flex-row items-center justify-between mb-3">
                <RoutePill from={from} to={to} />
                <View className="items-end">
                  <Text className="text-xs font-urbanist-medium text-text/70">
                    {new Date(date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                  {isRoundTrip && (
                    <Text className="text-xs font-urbanist-semibold text-text/90 mt-0.5">
                      Round Trip
                    </Text>
                  )}
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-2xl font-urbanist-bold text-text">
                    {currentFlight.flightNumber}
                  </Text>
                  <Text className="text-sm font-urbanist-medium text-text/70 mt-1">
                    {formatTime(currentFlight.departureTime)} -{" "}
                    {formatTime(currentFlight.arrivalTime)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-urbanist-medium text-text/70">
                    {isRoundTrip
                      ? "Passengers"
                      : `${currentSeats.length} Seat${currentSeats.length > 1 ? "s" : ""}`}
                  </Text>
                  <Text className="text-lg font-urbanist-bold text-text">
                    {isRoundTrip
                      ? `${currentSeats.length} Pax`
                      : currentSeats.map((s) => s.seatNumber).join(", ")}
                  </Text>
                </View>
              </View>
              {/* Ticket notches */}
              <Notch side="left" />
              <Notch side="right" />
            </View>
          </View>

          <ScrollView
            className="flex-1 bg-background px-6"
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Passenger Forms */}
            {passengers.map((passenger, index) => (
              <View
                key={index}
                className="mt-4 p-5 bg-secondary/40 rounded-3xl border border-primary/10"
              >
                <View className="flex-row items-center gap-3 mb-4">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                    <Ionicons name="person" size={20} color="#541424" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg font-urbanist-bold text-primary">
                        Passenger {index + 1}
                      </Text>
                      {passenger.isPrimary && (
                        <View className="px-2 py-1 rounded-full bg-primary/10">
                          <Text className="text-xs font-urbanist-semibold text-primary">
                            You
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm font-urbanist-medium text-primary/60">
                      Seat {passenger.seatNumber}
                    </Text>
                  </View>
                </View>

                {/* Full Name */}
                <View className="mb-4">
                  <Text className="text-sm font-urbanist-semibold text-primary mb-2">
                    Full Name <Text className="text-red-500">*</Text>
                  </Text>
                  {passenger.isPrimary ? (
                    <View className="px-4 py-3.5 bg-secondary/30 rounded-2xl border border-primary/10 flex-row items-center">
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#541424"
                        style={{ marginRight: 12 }}
                      />
                      <Text
                        className={`font-urbanist-medium flex-1 ${
                          passenger.fullName
                            ? "text-primary"
                            : "text-primary/40"
                        }`}
                      >
                        {passenger.fullName || "As per ID proof"}
                      </Text>
                    </View>
                  ) : (
                    <FormInput
                      label=""
                      placeholder="As per ID proof"
                      value={passenger.fullName}
                      onChangeText={(value) =>
                        handlePassengerChange(index, "fullName", value)
                      }
                    />
                  )}
                  {passenger.isPrimary && (
                    <Text className="text-xs font-urbanist text-primary/50 mt-1 ml-1">
                      Pre-filled from profile
                    </Text>
                  )}
                </View>

                {/* Date of Birth */}
                <View className="mb-4">
                  <Text className="text-sm font-urbanist-semibold text-primary mb-2">
                    Date of Birth <Text className="text-red-500">*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowDatePicker(index);
                    }}
                    className="px-4 py-3.5 bg-secondary/30 rounded-2xl border border-primary/10 flex-row items-center"
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#541424"
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      className={`font-urbanist-medium flex-1 ${
                        passenger.dateOfBirth
                          ? "text-primary"
                          : "text-primary/40"
                      }`}
                    >
                      {passenger.dateOfBirth
                        ? new Date(passenger.dateOfBirth).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short", year: "numeric" }
                          )
                        : "Select date of birth"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#54142460" />
                  </TouchableOpacity>
                </View>

                {/* Gender */}
                <View className="mb-4">
                  <Text className="text-sm font-urbanist-semibold text-primary mb-2">
                    Gender <Text className="text-red-500">*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (!passenger.isPrimary) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowGenderPicker(index);
                      }
                    }}
                    disabled={passenger.isPrimary}
                    className="px-4 py-3.5 bg-secondary/30 rounded-2xl border border-primary/10 flex-row items-center"
                  >
                    <Ionicons
                      name={
                        passenger.gender === "male"
                          ? "male"
                          : passenger.gender === "female"
                            ? "female"
                            : "male-female"
                      }
                      size={20}
                      color="#541424"
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      className={`font-urbanist-medium flex-1 capitalize ${
                        passenger.gender ? "text-primary" : "text-primary/40"
                      }`}
                    >
                      {passenger.gender || "Select gender"}
                    </Text>
                    {!passenger.isPrimary && (
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color="#54142460"
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Document Type */}
                <View className="mb-4">
                  <Text className="text-sm font-urbanist-semibold text-primary mb-2">
                    Document Type <Text className="text-red-500">*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (!passenger.isPrimary || !passenger.documentType) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowDocTypePicker(index);
                      }
                    }}
                    disabled={passenger.isPrimary && !!passenger.documentType}
                    className="px-4 py-3.5 bg-secondary/30 rounded-2xl border border-primary/10 flex-row items-center"
                  >
                    <Ionicons
                      name="card-outline"
                      size={20}
                      color="#541424"
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      className={`font-urbanist-medium flex-1 capitalize ${
                        passenger.documentType
                          ? "text-primary"
                          : "text-primary/40"
                      }`}
                    >
                      {passenger.documentType === "aadhar"
                        ? "Aadhar Card"
                        : passenger.documentType === "passport"
                          ? "Passport"
                          : "Select document type"}
                    </Text>
                    {(!passenger.isPrimary || !passenger.documentType) && (
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color="#54142460"
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Document Number */}
                <View className="mb-4">
                  <FormInput
                    label="Document Number *"
                    value={passenger.documentNumber}
                    onChangeText={(value) =>
                      handlePassengerChange(
                        index,
                        "documentNumber",
                        value.toUpperCase()
                      )
                    }
                    placeholder="Enter document number"
                    autoCapitalize="characters"
                    maxLength={
                      passenger.documentType === "aadhar"
                        ? 12
                        : passenger.documentType === "passport"
                          ? 8
                          : 20
                    }
                  />
                  {passenger.isPrimary && passenger.documentNumber && (
                    <Text className="text-xs font-urbanist text-primary/50 mt-1 ml-1">
                      Pre-filled from profile
                    </Text>
                  )}
                </View>

                {/* Email (Optional for non-primary) */}
                {!passenger.isPrimary && (
                  <View className="mb-4">
                    <FormInput
                      label="Email (Optional)"
                      value={passenger.email}
                      onChangeText={(value) =>
                        handlePassengerChange(index, "email", value)
                      }
                      placeholder="email@example.com"
                      keyboardType="email-address"
                    />
                  </View>
                )}

                {/* Phone (Optional for non-primary) */}
                {!passenger.isPrimary && (
                  <View className="mb-4">
                    <FormInput
                      label="Phone (Optional)"
                      value={passenger.phone}
                      onChangeText={(value) =>
                        handlePassengerChange(
                          index,
                          "phone",
                          value.replace(/[^0-9]/g, "")
                        )
                      }
                      placeholder="10-digit mobile number"
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                )}

                {passenger.isPrimary && (
                  <View className="p-3 bg-primary/5 rounded-2xl flex-row gap-2 items-start">
                    <Ionicons
                      name="information-circle"
                      size={18}
                      color="#541424"
                      style={{ marginTop: 1 }}
                    />
                    <Text className="flex-1 text-xs font-urbanist-medium text-primary/70">
                      Your details have been pre-filled from your profile.
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {/* Bottom Button */}
            <View className="mt-6 mb-0">
              <PrimaryButton
                title="Continue to Payment"
                onPress={handleContinue}
                leftIconName="card"
              />
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <BottomSheetModal
        visible={showDatePicker !== null}
        onClose={() => {
          setShowDatePicker(null);
        }}
        title="Select Date of Birth"
        scrollable={false}
        maxHeight="55%"
      >
        {showDatePicker !== null && (
          <View className="mt-2">
            <DateTimePicker
              value={
                passengers[showDatePicker]?.dateOfBirth
                  ? new Date(passengers[showDatePicker].dateOfBirth)
                  : new Date()
              }
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              textColor={Platform.OS === "ios" ? COLORS.primary : undefined}
              accentColor={COLORS.primary}
              onChange={(event, selectedDate) => {
                if (Platform.OS === "android") {
                  setShowDatePicker(null);
                }
                if (selectedDate) {
                  handlePassengerChange(
                    showDatePicker,
                    "dateOfBirth",
                    selectedDate.toISOString().split("T")[0]
                  );
                }
              }}
            />
          </View>
        )}
        {showDatePicker !== null && passengers[showDatePicker]?.dateOfBirth && (
          <View className="flex-row items-center justify-between py-4 mt-4">
            <TouchableOpacity
              className="px-4 py-3 rounded-full bg-primary/10"
              onPress={() => {
                const currentDate = passengers[showDatePicker]?.dateOfBirth
                  ? new Date(passengers[showDatePicker].dateOfBirth)
                  : new Date();
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() - 1);
                handlePassengerChange(
                  showDatePicker,
                  "dateOfBirth",
                  newDate.toISOString().split("T")[0]
                );
              }}
            >
              <Ionicons name="chevron-back" size={20} color="#541424" />
            </TouchableOpacity>
            <Text
              className="text-primary font-urbanist-bold text-base"
              numberOfLines={2}
            >
              {new Date(
                passengers[showDatePicker].dateOfBirth
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </Text>
            <TouchableOpacity
              disabled={
                passengers[showDatePicker]?.dateOfBirth >=
                new Date().toISOString().split("T")[0]
              }
              className="px-4 py-3 rounded-full bg-primary/10"
              style={{
                opacity:
                  passengers[showDatePicker]?.dateOfBirth >=
                  new Date().toISOString().split("T")[0]
                    ? 0.4
                    : 1,
              }}
              onPress={() => {
                const currentDate = passengers[showDatePicker]?.dateOfBirth
                  ? new Date(passengers[showDatePicker].dateOfBirth)
                  : new Date();
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + 1);
                if (newDate <= new Date()) {
                  handlePassengerChange(
                    showDatePicker,
                    "dateOfBirth",
                    newDate.toISOString().split("T")[0]
                  );
                }
              }}
            >
              <Ionicons name="chevron-forward" size={20} color="#541424" />
            </TouchableOpacity>
          </View>
        )}
      </BottomSheetModal>

      {/* Gender Picker Modal */}
      <BottomSheetModal
        visible={showGenderPicker !== null}
        onClose={() => setShowGenderPicker(null)}
        title="Select Gender"
        maxHeight="40%"
        scrollable={false}
      >
        <View className="gap-3">
          {["male", "female", "other"].map((gender) => (
            <TouchableOpacity
              key={gender}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handlePassengerChange(showGenderPicker, "gender", gender);
                setShowGenderPicker(null);
              }}
              className="p-4 bg-secondary/30 rounded-2xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons
                  name={
                    gender === "male"
                      ? "male"
                      : gender === "female"
                        ? "female"
                        : "male-female"
                  }
                  size={24}
                  color="#541424"
                />
                <Text className="text-primary font-urbanist-semibold capitalize">
                  {gender}
                </Text>
              </View>
              {passengers[showGenderPicker]?.gender === gender && (
                <Ionicons name="checkmark-circle" size={24} color="#541424" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetModal>

      {/* Document Type Picker Modal */}
      <BottomSheetModal
        visible={showDocTypePicker !== null}
        onClose={() => setShowDocTypePicker(null)}
        title="Select Document Type"
        maxHeight="35%"
        scrollable={false}
      >
        <View className="gap-3">
          {[
            { value: "aadhar", label: "Aadhar Card", icon: "card" },
            { value: "passport", label: "Passport", icon: "airplane" },
          ].map((doc) => (
            <TouchableOpacity
              key={doc.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handlePassengerChange(
                  showDocTypePicker,
                  "documentType",
                  doc.value
                );
                setShowDocTypePicker(null);
              }}
              className="p-4 bg-secondary/30 rounded-2xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name={doc.icon} size={24} color="#541424" />
                <Text className="text-primary font-urbanist-semibold">
                  {doc.label}
                </Text>
              </View>
              {passengers[showDocTypePicker]?.documentType === doc.value && (
                <Ionicons name="checkmark-circle" size={24} color="#541424" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetModal>
    </View>
  );
}
