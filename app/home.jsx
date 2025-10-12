import { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  StatusBar,
  Pressable,
  Image,
  Modal,
  ScrollView,
  Platform,
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import PrimaryButton from "../components/PrimaryButton";
import Loader from "../components/Loader";
import { router } from "expo-router";
import { getUserProfile } from "../lib/storage";
import { fetchMe } from "../lib/auth";
import { toast } from "../lib/toast";
import { COLORS } from "../constants/colors";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [tripType, setTripType] = useState("oneway"); // roundtrip disabled
  const [from, setFrom] = useState("Rajkot, India");
  const [to, setTo] = useState("Mumbai, India");
  const [travelDate, setTravelDate] = useState(new Date());
  const [pax, setPax] = useState({ adults: 1, children: 0 });

  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [showPaxModal, setShowPaxModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await getUserProfile();
        if (mounted) setUser(p);
      } catch {
      } finally {
        if (mounted) setTimeout(() => setLoading(false), 200);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = user?.name || "Traveler";
  const avatarSource = useMemo(() => {
    const g = (user?.gender || "other").toLowerCase();
    if (g === "male") return require("../assets/images/male.png");
    if (g === "female") return require("../assets/images/female.png");
    return null; // other -> show '?'
  }, [user?.gender]);
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Today at 00:00 for date comparisons
  const todayMidnight = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const isPrevDisabled = useMemo(() => {
    const t = new Date(travelDate);
    t.setHours(0, 0, 0, 0);
    return t.getTime() <= todayMidnight.getTime();
  }, [travelDate, todayMidnight]);

  // Quick date helpers
  const setDateToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setTravelDate(d);
  };
  const setDateTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    setTravelDate(d);
  };
  const setDateWeekend = () => {
    const d = new Date();
    // 6 = Saturday, 0 = Sunday
    const day = d.getDay();
    const toAdd = day === 6 ? 0 : day === 0 ? 6 : 6 - day;
    d.setDate(d.getDate() + toAdd);
    d.setHours(0, 0, 0, 0);
    setTravelDate(d);
  };

  // Removed search filtering for From/To modals as per request

  const onChangeTrip = async (type) => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    if (type === "roundtrip") {
      toast.warn({
        title: "Round Trip disabled",
        message: "Currently only One way is supported",
      });
      return;
    }
    setTripType("oneway");
  };

  // Prevent navigating back from Home (Android hardware back)
  // Reusable micro-interaction wrapper (press scale)
  const ScaleOnPress = ({ children, className = "", onPress }) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
    return (
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        }}
        onPress={onPress}
        className={className}
      >
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </Pressable>
    );
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; // Block back on Home
      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => sub.remove();
    }, [])
  );

  // Refresh user from server on focus so updates (e.g., gender) reflect immediately
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const fresh = await fetchMe();
          if (active && fresh) setUser(fresh);
        } catch {
          // ignore errors; keep cached user
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  if (loading) {
    return <Loader message="Loading" subtitle="Preparing your flight search" />;
  }

  const POPULAR_CITIES = [
    "Mumbai, India",
    "Delhi, India",
    "Bangalore, India",
    "Hyderabad, India",
    "Ahmedabad, India",
    "Chennai, India",
    "Kolkata, India",
    "Surat, India",
    "Pune, India",
    "Jaipur, India",
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Hero header */}
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="relative bg-background px-6 pt-6 pb-8 rounded-b-[32px]"
      >
        <StatusBar barStyle="dark-content" backgroundColor="#e3d0bf" />
        {/* Top row: avatar + greeting+name + bell */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15 overflow-hidden">
              {avatarSource ? (
                <Image
                  source={avatarSource}
                  resizeMode="cover"
                  className="w-14 h-[55px] rounded-full mt-3 p-1"
                />
              ) : (
                <Text className="text-primary font-urbanist-bold text-xl">
                  ?
                </Text>
              )}
            </View>
            <View className="ml-3">
              <Text className="text-primary/80 font-urbanist-medium text-lg">
                {greeting}
              </Text>
              <Text className="text-primary font-urbanist-bold text-2xl mt-0.5">
                {displayName} 👋
              </Text>
            </View>
          </View>
          <TouchableOpacity className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15">
            <Ionicons name="notifications-outline" size={22} color="#541424" />
          </TouchableOpacity>
        </View>

        {/* Greeting moved inline with avatar */}

        {/* Tagline */}
        <View className="mt-6 mb-3">
          <Text className="text-primary/80 font-urbanist-semibold text-3xl">
            Fly high and
          </Text>
          <Text className="text-primary font-urbanist-bold text-4xl mt-1">
            acquire expertise
          </Text>
        </View>

        {/* Trip type radio row (One way / Round Trip - Round Trip disabled) */}
        <View className="flex-row items-center gap-8 mt-2">
          <TouchableOpacity
            onPress={() => onChangeTrip("oneway")}
            activeOpacity={0.8}
            className="flex-row items-center"
          >
            <Ionicons
              name={tripType === "oneway" ? "ellipse" : "ellipse-outline"}
              size={26}
              color="#541424"
            />
            <Text className="text-primary ml-2 font-urbanist-medium text-lg">
              One way
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onChangeTrip("roundtrip")}
            activeOpacity={0.6}
            className="flex-row items-center opacity-50"
          >
            <Ionicons name={"ellipse-outline"} size={26} color="#541424" />
            <Text className="text-primary ml-2 font-urbanist-medium text-lg">
              Round Trip
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Search card */}
      <Animated.View
        entering={FadeInUp.duration(600).delay(150).springify()}
        className="px-6 mt-0"
      >
        <View className="relative">
          {/* Soft shapes behind card */}
          <View
            pointerEvents="none"
            className="absolute -top-8 -left-10 w-44 h-44 rounded-full bg-secondary/10"
          />
          <View
            pointerEvents="none"
            className="absolute -bottom-10 -right-8 w-52 h-52 rounded-full bg-primary/10"
          />
          <View
            className="bg-primary rounded-[36px] px-5 py-4 border border-secondary/15 z-1"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            }}
          >
            {/* From */}
            <ScaleOnPress
              className="py-5 border-b border-secondary/20"
              onPress={async () => {
                try {
                  await Haptics.selectionAsync();
                } catch {}
                setShowFromModal(true);
              }}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-secondary/20 items-center justify-center mr-3">
                  <Ionicons name="airplane-outline" size={28} color="#e3d7cb" />
                </View>
                <View className="flex-1">
                  <Text className="text-secondary/80 font-urbanist text-sm">
                    From
                  </Text>
                  <Text className="text-secondary font-urbanist-medium mt-1">
                    {from}
                  </Text>
                </View>
              </View>
            </ScaleOnPress>
            {/* To */}
            <ScaleOnPress
              className="py-5 border-b border-secondary/20"
              onPress={async () => {
                try {
                  await Haptics.selectionAsync();
                } catch {}
                setShowToModal(true);
              }}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-secondary/20 items-center justify-center mr-3">
                  <Ionicons name="airplane" size={28} color="#e3d7cb" />
                </View>
                <View className="flex-1">
                  <Text className="text-secondary/80 font-urbanist text-sm">
                    To
                  </Text>
                  <Text className="text-secondary font-urbanist-medium mt-1">
                    {to}
                  </Text>
                </View>
              </View>
            </ScaleOnPress>
            {/* Date */}
            <ScaleOnPress
              className="py-5 border-b border-secondary/20"
              onPress={async () => {
                try {
                  await Haptics.selectionAsync();
                } catch {}
                setShowDateModal(true);
              }}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-secondary/20 items-center justify-center mr-3">
                  <Ionicons name="calendar-outline" size={28} color="#e3d7cb" />
                </View>
                <View className="flex-1">
                  <Text className="text-secondary/80 font-urbanist text-sm">
                    Date
                  </Text>
                  <Text className="text-secondary font-urbanist-medium mt-1">
                    {new Date(travelDate).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            </ScaleOnPress>
            {/* Passenger */}
            <ScaleOnPress
              className="py-5"
              onPress={async () => {
                try {
                  await Haptics.selectionAsync();
                } catch {}
                setShowPaxModal(true);
              }}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-secondary/20 items-center justify-center mr-3">
                  <Ionicons name="people-outline" size={28} color="#e3d7cb" />
                </View>
                <View className="flex-1">
                  <Text className="text-secondary/80 font-urbanist text-sm">
                    Passenger
                  </Text>
                  <Text className="text-secondary font-urbanist-medium mt-1">
                    {`${pax.adults} Adult${pax.adults > 1 ? "s" : ""}, ${pax.children} Child${pax.children !== 1 ? "ren" : ""}`}
                  </Text>
                </View>
              </View>
            </ScaleOnPress>
          </View>
        </View>

        <View
          className="mt-4"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <PrimaryButton
            title="Search Flight"
            leftIconName="search"
            className="py-5 rounded-[28px]"
            onPress={async () => {
              try {
                await Haptics.selectionAsync();
              } catch {}
              const src = String(from || "").trim();
              const dst = String(to || "").trim();
              if (!src || !dst) {
                toast.warn({
                  title: "Route required",
                  message: "Please select From and To",
                });
                return;
              }
              if (src.toLowerCase() === dst.toLowerCase()) {
                toast.warn({
                  title: "Invalid route",
                  message: "From and To must be different",
                });
                return;
              }
              const today = new Date();
              const tDate = new Date(travelDate);
              tDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              if (tDate < today) {
                toast.warn({
                  title: "Invalid date",
                  message: "Travel date cannot be in the past",
                });
                return;
              }
              const iso = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}-${String(tDate.getDate()).padStart(2, "0")}`;
              router.push({
                pathname: "/search-results",
                params: {
                  from: src,
                  to: dst,
                  date: iso,
                  passengers: String(pax.adults + pax.children),
                  tripType,
                },
              });
            }}
            withHaptics
            hapticStyle="medium"
          />
        </View>
      </Animated.View>

      {/* Location modal - From */}
      <Modal
        visible={showFromModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFromModal(false)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <Animated.View
            entering={FadeInUp.duration(250).springify()}
            className="bg-background rounded-t-3xl p-6"
          >
            {/* Handle + header */}
            <View className="w-12 h-1.5 bg-primary/20 self-center rounded-full mb-3" />
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-primary font-urbanist-bold text-xl">
                Select origin
              </Text>
              <TouchableOpacity
                onPress={() => setShowFromModal(false)}
                className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#541424" />
              </TouchableOpacity>
            </View>
            {/* Popular */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerStyle={{ gap: 8 }}
            >
              {POPULAR_CITIES.map((c) => (
                <ScaleOnPress
                  key={`pop-from-${c}`}
                  className="px-3 py-2 rounded-full bg-primary/10 border border-primary/15"
                  onPress={() => {
                    setFrom(c);
                    setShowFromModal(false);
                  }}
                >
                  <Text className="text-primary text-xs font-urbanist-medium">
                    {c}
                  </Text>
                </ScaleOnPress>
              ))}
            </ScrollView>
            {/* Results */}
            <ScrollView style={{ maxHeight: 320 }} className="mt-3">
              {CITY_OPTIONS.map((c) => (
                <ScaleOnPress
                  key={`from-${c}`}
                  className="py-4 border-b border-primary/10"
                  onPress={() => {
                    setFrom(c);
                    setShowFromModal(false);
                  }}
                >
                  <Text className="text-primary font-urbanist-medium">{c}</Text>
                </ScaleOnPress>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Location modal - To */}
      <Modal
        visible={showToModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowToModal(false)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <Animated.View
            entering={FadeInUp.duration(250).springify()}
            className="bg-background rounded-t-3xl p-6"
          >
            {/* Handle + header */}
            <View className="w-12 h-1.5 bg-primary/20 self-center rounded-full mb-3" />
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-primary font-urbanist-bold text-xl">
                Select destination
              </Text>
              <TouchableOpacity
                onPress={() => setShowToModal(false)}
                className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#541424" />
              </TouchableOpacity>
            </View>
            {/* Popular */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerStyle={{ gap: 8 }}
            >
              {POPULAR_CITIES.map((c) => (
                <ScaleOnPress
                  key={`pop-to-${c}`}
                  className="px-3 py-2 rounded-full bg-primary/10 border border-primary/15"
                  onPress={() => {
                    setTo(c);
                    setShowToModal(false);
                  }}
                >
                  <Text className="text-primary text-xs font-urbanist-medium">
                    {c}
                  </Text>
                </ScaleOnPress>
              ))}
            </ScrollView>
            {/* Results */}
            <ScrollView style={{ maxHeight: 320 }} className="mt-3">
              {CITY_OPTIONS.map((c) => (
                <ScaleOnPress
                  key={`to-${c}`}
                  className="py-4 border-b border-primary/10"
                  onPress={() => {
                    setTo(c);
                    setShowToModal(false);
                  }}
                >
                  <Text className="text-primary font-urbanist-medium">{c}</Text>
                </ScaleOnPress>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Date modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <Animated.View
            entering={FadeInUp.duration(250).springify()}
            className="bg-background rounded-t-3xl p-6"
          >
            {/* Handle + header */}
            <View className="w-12 h-1.5 bg-primary/20 self-center rounded-full mb-3" />
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-primary font-urbanist-bold text-xl">
                Select date
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowNativePicker(false);
                  setShowDateModal(false);
                }}
                className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#541424" />
              </TouchableOpacity>
            </View>
            {/* Quick picks */}
            <View className="flex-row items-center gap-2 mt-1">
              <ScaleOnPress
                className="px-3 py-2 rounded-full bg-primary/10 border border-primary/15"
                onPress={setDateToday}
              >
                <Text className="text-primary text-xs font-urbanist-medium">
                  Today
                </Text>
              </ScaleOnPress>
              <ScaleOnPress
                className="px-3 py-2 rounded-full bg-primary/10 border border-primary/15"
                onPress={setDateTomorrow}
              >
                <Text className="text-primary text-xs font-urbanist-medium">
                  Tomorrow
                </Text>
              </ScaleOnPress>
              <ScaleOnPress
                className="px-3 py-2 rounded-full bg-primary/10 border border-primary/15"
                onPress={setDateWeekend}
              >
                <Text className="text-primary text-xs font-urbanist-medium">
                  Weekend
                </Text>
              </ScaleOnPress>
              <ScaleOnPress
                className="px-3 py-2 rounded-full bg-primary/10 border border-primary/15"
                onPress={async () => {
                  try {
                    await Haptics.selectionAsync();
                  } catch {}
                  setShowNativePicker(true);
                }}
              >
                <Text className="text-primary text-xs font-urbanist-medium">
                  Custom date
                </Text>
              </ScaleOnPress>
            </View>
            {showNativePicker ? (
              <View className="mt-2">
                <DateTimePicker
                  value={travelDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={todayMidnight}
                  themeVariant={Platform.OS === "ios" ? "light" : undefined}
                  textColor={Platform.OS === "ios" ? COLORS.primary : undefined}
                  accentColor={COLORS.primary}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android") {
                      setShowNativePicker(false);
                    }
                    if (selectedDate) {
                      const d = new Date(selectedDate);
                      d.setHours(0, 0, 0, 0);
                      setTravelDate(d);
                    }
                  }}
                />
              </View>
            ) : null}
            <View className="flex-row items-center justify-between py-4">
              <TouchableOpacity
                disabled={isPrevDisabled}
                className="px-4 py-3 rounded-full bg-primary/10"
                style={{ opacity: isPrevDisabled ? 0.4 : 1 }}
                onPress={() => {
                  if (isPrevDisabled) return;
                  setTravelDate((d) => {
                    const nd = new Date(d);
                    nd.setDate(nd.getDate() - 1);
                    return nd;
                  });
                }}
              >
                <Ionicons name="chevron-back" size={20} color="#541424" />
              </TouchableOpacity>
              <Text
                className="text-primary font-urbanist-bold text-lg"
                numberOfLines={2}
              >
                {new Date(travelDate).toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <TouchableOpacity
                className="px-4 py-3 rounded-full bg-primary/10"
                onPress={() =>
                  setTravelDate((d) => {
                    const nd = new Date(d);
                    nd.setDate(nd.getDate() + 1);
                    return nd;
                  })
                }
              >
                <Ionicons name="chevron-forward" size={20} color="#541424" />
              </TouchableOpacity>
            </View>
            <PrimaryButton
              title="Done"
              className="mt-2"
              onPress={() => {
                setShowNativePicker(false);
                setShowDateModal(false);
              }}
            />
          </Animated.View>
        </View>
      </Modal>

      {/* Passenger modal */}
      <Modal
        visible={showPaxModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaxModal(false)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <Animated.View
            entering={FadeInUp.duration(250).springify()}
            className="bg-background rounded-t-3xl p-6"
          >
            {/* Handle + header */}
            <View className="w-12 h-1.5 bg-primary/20 self-center rounded-full mb-3" />
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-primary font-urbanist-bold text-xl">
                Passengers
              </Text>
              <TouchableOpacity
                onPress={() => setShowPaxModal(false)}
                className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#541424" />
              </TouchableOpacity>
            </View>
            <Text className="text-primary/70 mb-2">
              Select the number of travelers
            </Text>
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-primary font-urbanist-medium text-lg">
                Adults
              </Text>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
                  onPress={() =>
                    setPax((p) => ({ ...p, adults: Math.max(1, p.adults - 1) }))
                  }
                >
                  <Ionicons name="remove" size={20} color="#541424" />
                </TouchableOpacity>
                <Text className="text-primary font-urbanist-bold text-lg">
                  {pax.adults}
                </Text>
                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
                  onPress={() =>
                    setPax((p) => ({ ...p, adults: p.adults + 1 }))
                  }
                >
                  <Ionicons name="add" size={20} color="#541424" />
                </TouchableOpacity>
              </View>
            </View>
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-primary font-urbanist-medium text-lg">
                Children
              </Text>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
                  onPress={() =>
                    setPax((p) => ({
                      ...p,
                      children: Math.max(0, p.children - 1),
                    }))
                  }
                >
                  <Ionicons name="remove" size={20} color="#541424" />
                </TouchableOpacity>
                <Text className="text-primary font-urbanist-bold text-lg">
                  {pax.children}
                </Text>
                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
                  onPress={() =>
                    setPax((p) => ({ ...p, children: p.children + 1 }))
                  }
                >
                  <Ionicons name="add" size={20} color="#541424" />
                </TouchableOpacity>
              </View>
            </View>
            <PrimaryButton
              title="Done"
              className="mt-2"
              onPress={() => setShowPaxModal(false)}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const CITY_OPTIONS = [
  "Rajkot, India",
  "Mumbai, India",
  "Ahmedabad, India",
  "Delhi, India",
  "Bengaluru, India",
  "Hyderabad, India",
  "Chennai, India",
  "Kolkata, India",
];

// Subset for quick access chips
const POPULAR_CITIES = [
  "Mumbai, India",
  "Delhi, India",
  "Bengaluru, India",
  "Hyderabad, India",
];
