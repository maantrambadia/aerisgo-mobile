import { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  StatusBar,
  Pressable,
  Image,
  ScrollView,
  Platform,
  Keyboard,
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
import BottomSheetModal from "../components/BottomSheetModal";
import FormInput from "../components/FormInput";
import { router } from "expo-router";
import { getUserProfile } from "../lib/storage";
import { fetchMe } from "../lib/auth";
import { toast } from "../lib/toast";
import { COLORS } from "../constants/colors";
import {
  getAllAirports,
  getPopularAirports,
  formatAirport,
  parseCityName,
} from "../lib/airports";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [tripType, setTripType] = useState("oneway");
  const [from, setFrom] = useState("Ahmedabad (AMD)");
  const [to, setTo] = useState("Mumbai (BOM)");
  const [travelDate, setTravelDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(null); // Return date for round-trip
  const [pax, setPax] = useState({ adults: 1, children: 0 });

  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showReturnDateModal, setShowReturnDateModal] = useState(false); // Return date modal
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [showNativeReturnPicker, setShowNativeReturnPicker] = useState(false); // Return date native picker
  const [showPaxModal, setShowPaxModal] = useState(false);
  const [user, setUser] = useState(null);

  // Airports state
  const [allAirports, setAllAirports] = useState([]);
  const [popularAirports, setPopularAirports] = useState([]);
  const [airportsLoading, setAirportsLoading] = useState(false);
  const [fromSearchQuery, setFromSearchQuery] = useState("");
  const [toSearchQuery, setToSearchQuery] = useState("");

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

  // Load airports data
  const loadAirports = async () => {
    try {
      setAirportsLoading(true);
      const [all, popular] = await Promise.all([
        getAllAirports(),
        getPopularAirports(),
      ]);
      setAllAirports(all);
      setPopularAirports(popular);
    } catch (error) {
      console.error("Failed to load airports:", error);
      toast.error({
        title: "Error",
        message: "Failed to load airports data",
      });
    } finally {
      setAirportsLoading(false);
    }
  };

  // Load airports when modal opens
  useEffect(() => {
    if ((showFromModal || showToModal) && allAirports.length === 0) {
      loadAirports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFromModal, showToModal]);

  // Filter airports based on search query
  const filteredFromAirports = useMemo(() => {
    if (!fromSearchQuery.trim()) return allAirports;
    const query = fromSearchQuery.toLowerCase();
    return allAirports.filter(
      (airport) =>
        airport.city.toLowerCase().includes(query) ||
        airport.code.toLowerCase().includes(query) ||
        airport.name.toLowerCase().includes(query) ||
        airport.state.toLowerCase().includes(query)
    );
  }, [allAirports, fromSearchQuery]);

  const filteredToAirports = useMemo(() => {
    if (!toSearchQuery.trim()) return allAirports;
    const query = toSearchQuery.toLowerCase();
    return allAirports.filter(
      (airport) =>
        airport.city.toLowerCase().includes(query) ||
        airport.code.toLowerCase().includes(query) ||
        airport.name.toLowerCase().includes(query) ||
        airport.state.toLowerCase().includes(query)
    );
  }, [allAirports, toSearchQuery]);

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
    setTripType(type);
    // Clear return date if switching to one-way
    if (type === "oneway") {
      setReturnDate(null);
    } else {
      // Set default return date to day after departure
      const defaultReturn = new Date(travelDate);
      defaultReturn.setDate(defaultReturn.getDate() + 1);
      setReturnDate(defaultReturn);
    }
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

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#e3d0bf" />
      {/* Hero header */}
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="relative bg-background px-6 pt-6 pb-8 rounded-b-[32px]"
      >
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

        {/* Trip type radio row (One way / Round Trip) */}
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
            activeOpacity={0.8}
            className="flex-row items-center"
          >
            <Ionicons
              name={tripType === "roundtrip" ? "ellipse" : "ellipse-outline"}
              size={26}
              color="#541424"
            />
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
            {/* Date - Side by side for round-trip */}
            <View className="py-5 border-b border-secondary/20">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-secondary/20 items-center justify-center mr-3">
                  <Ionicons name="calendar-outline" size={28} color="#e3d7cb" />
                </View>
                <View className="flex-1 flex-row items-center gap-2">
                  {/* Departure Date */}
                  <ScaleOnPress
                    className="flex-1"
                    onPress={async () => {
                      try {
                        await Haptics.selectionAsync();
                      } catch {}
                      setShowDateModal(true);
                    }}
                  >
                    <View>
                      <Text className="text-secondary/80 font-urbanist text-xs">
                        {tripType === "roundtrip" ? "Departure" : "Date"}
                      </Text>
                      <Text className="text-secondary font-urbanist-medium mt-0.5 text-sm">
                        {new Date(travelDate).toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                        })}
                      </Text>
                    </View>
                  </ScaleOnPress>

                  {/* Return Date - Only show for round-trip */}
                  {tripType === "roundtrip" && (
                    <>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color="#e3d7cb"
                      />
                      <ScaleOnPress
                        className="flex-1"
                        onPress={async () => {
                          try {
                            await Haptics.selectionAsync();
                          } catch {}
                          setShowReturnDateModal(true);
                        }}
                      >
                        <View>
                          <Text className="text-secondary/80 font-urbanist text-xs">
                            Return
                          </Text>
                          <Text className="text-secondary font-urbanist-medium mt-0.5 text-sm">
                            {returnDate
                              ? new Date(returnDate).toLocaleDateString(
                                  undefined,
                                  {
                                    day: "2-digit",
                                    month: "short",
                                  }
                                )
                              : "Select"}
                          </Text>
                        </View>
                      </ScaleOnPress>
                    </>
                  )}
                </View>
              </View>
            </View>
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
              // Parse city names from "City (CODE)" format
              const src = parseCityName(String(from || "").trim());
              const dst = parseCityName(String(to || "").trim());
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

              // Validate return date for round-trip
              if (tripType === "roundtrip") {
                if (!returnDate) {
                  toast.warn({
                    title: "Return date required",
                    message: "Please select a return date",
                  });
                  return;
                }
                const rDate = new Date(returnDate);
                rDate.setHours(0, 0, 0, 0);
                if (rDate <= tDate) {
                  toast.warn({
                    title: "Invalid return date",
                    message: "Return date must be after departure date",
                  });
                  return;
                }
              }

              const iso = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}-${String(tDate.getDate()).padStart(2, "0")}`;
              const returnIso =
                returnDate && tripType === "roundtrip"
                  ? `${new Date(returnDate).getFullYear()}-${String(new Date(returnDate).getMonth() + 1).padStart(2, "0")}-${String(new Date(returnDate).getDate()).padStart(2, "0")}`
                  : undefined;

              router.push({
                pathname: "/search-results",
                params: {
                  from: src,
                  to: dst,
                  date: iso,
                  ...(returnIso && { returnDate: returnIso }),
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
      <BottomSheetModal
        visible={showFromModal}
        onClose={() => {
          setShowFromModal(false);
          setFromSearchQuery("");
        }}
        title="Select origin"
        maxHeight="75%"
        keyboardAware={true}
      >
        {airportsLoading ? (
          <View className="py-8 items-center">
            <Loader size="large" />
            <Text className="text-primary/60 font-urbanist mt-2">
              Loading airports...
            </Text>
          </View>
        ) : (
          <View className="flex-1">
            {/* Search Input */}
            <View className="mb-3">
              <FormInput
                placeholder="Search by city, code, or airport name"
                value={fromSearchQuery}
                onChangeText={setFromSearchQuery}
                leftIconName="search"
              />
            </View>

            {/* Popular - Only show when not searching */}
            {!fromSearchQuery && popularAirports.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-3"
                contentContainerStyle={{ gap: 8 }}
              >
                {popularAirports.map((airport) => (
                  <ScaleOnPress
                    key={`pop-from-${airport.code}`}
                    className="px-3 py-2 rounded-full bg-primary/10 border border-primary/15"
                    onPress={() => {
                      Keyboard.dismiss();
                      setFrom(formatAirport(airport));
                      setFromSearchQuery("");
                      setTimeout(() => setShowFromModal(false), 100);
                    }}
                  >
                    <Text className="text-primary text-xs font-urbanist-medium">
                      {airport.city}
                    </Text>
                  </ScaleOnPress>
                ))}
              </ScrollView>
            )}

            {/* Filtered Airports */}
            <ScrollView
              style={{ maxHeight: 320 }}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled={true}
            >
              {filteredFromAirports.length > 0 ? (
                filteredFromAirports.map((airport) => (
                  <TouchableOpacity
                    key={`from-${airport.code}-${airport.city}`}
                    className="py-4 border-b border-primary/10"
                    activeOpacity={0.7}
                    onPress={() => {
                      setFrom(formatAirport(airport));
                      setFromSearchQuery("");
                      Keyboard.dismiss();
                      setTimeout(() => setShowFromModal(false), 100);
                    }}
                  >
                    <Text className="text-primary font-urbanist-semibold">
                      {airport.city} ({airport.code})
                    </Text>
                    <Text className="text-primary/60 font-urbanist text-xs mt-0.5">
                      {airport.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="py-8 items-center">
                  <Ionicons
                    name="search-outline"
                    size={48}
                    color="#541424"
                    opacity={0.3}
                  />
                  <Text className="text-primary/60 font-urbanist mt-2">
                    No airports found
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </BottomSheetModal>

      {/* Location modal - To */}
      <BottomSheetModal
        visible={showToModal}
        onClose={() => {
          setShowToModal(false);
          setToSearchQuery("");
        }}
        title="Select destination"
        maxHeight="75%"
        keyboardAware={true}
      >
        {airportsLoading ? (
          <View className="py-8 items-center">
            <Loader size="large" />
            <Text className="text-primary/60 font-urbanist mt-2">
              Loading airports...
            </Text>
          </View>
        ) : (
          <View className="flex-1">
            {/* Search Input */}
            <View className="mb-3">
              <FormInput
                placeholder="Search by city, code, or airport name"
                value={toSearchQuery}
                onChangeText={setToSearchQuery}
                leftIconName="search"
              />
            </View>

            {/* Popular - Only show when not searching */}
            {!toSearchQuery && popularAirports.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-3"
                contentContainerStyle={{ gap: 8 }}
              >
                {popularAirports.map((airport) => (
                  <ScaleOnPress
                    key={`pop-to-${airport.code}`}
                    className="px-3 py-2 rounded-full bg-primary/10 border border-primary/15"
                    onPress={() => {
                      Keyboard.dismiss();
                      setTo(formatAirport(airport));
                      setToSearchQuery("");
                      setTimeout(() => setShowToModal(false), 100);
                    }}
                  >
                    <Text className="text-primary text-xs font-urbanist-medium">
                      {airport.city}
                    </Text>
                  </ScaleOnPress>
                ))}
              </ScrollView>
            )}

            {/* Filtered Airports */}
            <ScrollView
              style={{ maxHeight: 320 }}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled={true}
            >
              {filteredToAirports.length > 0 ? (
                filteredToAirports.map((airport) => (
                  <TouchableOpacity
                    key={`to-${airport.code}-${airport.city}`}
                    className="py-4 border-b border-primary/10"
                    activeOpacity={0.7}
                    onPress={() => {
                      setTo(formatAirport(airport));
                      setToSearchQuery("");
                      Keyboard.dismiss();
                      setTimeout(() => setShowToModal(false), 100);
                    }}
                  >
                    <Text className="text-primary font-urbanist-semibold">
                      {airport.city} ({airport.code})
                    </Text>
                    <Text className="text-primary/60 font-urbanist text-xs mt-0.5">
                      {airport.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="py-8 items-center">
                  <Ionicons
                    name="search-outline"
                    size={48}
                    color="#541424"
                    opacity={0.3}
                  />
                  <Text className="text-primary/60 font-urbanist mt-2">
                    No airports found
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </BottomSheetModal>

      {/* Date modal */}
      <BottomSheetModal
        visible={showDateModal}
        onClose={() => {
          setShowNativePicker(false);
          setShowDateModal(false);
        }}
        title="Select date"
        scrollable={false}
        maxHeight="65%"
      >
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
      </BottomSheetModal>

      {/* Passenger modal */}
      <BottomSheetModal
        visible={showPaxModal}
        onClose={() => setShowPaxModal(false)}
        title="Passengers"
        scrollable={false}
        minHeight="40%"
        maxHeight="50%"
      >
        <Text className="text-primary/70 mb-4">
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
              onPress={() => setPax((p) => ({ ...p, adults: p.adults + 1 }))}
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
          className="mt-4"
          onPress={() => setShowPaxModal(false)}
        />
      </BottomSheetModal>

      {/* Return Date modal */}
      <BottomSheetModal
        visible={showReturnDateModal}
        onClose={() => {
          setShowNativeReturnPicker(false);
          setShowReturnDateModal(false);
        }}
        title="Select return date"
        scrollable={false}
        maxHeight="65%"
      >
        {/* Quick picks */}
        <View className="flex-row items-center gap-2 mt-1 flex-wrap">
          <ScaleOnPress
            className="px-3 py-2 rounded-full bg-primary/10 border border-primary/15"
            onPress={() => {
              const tomorrow = new Date(travelDate);
              tomorrow.setDate(tomorrow.getDate() + 1);
              setReturnDate(tomorrow);
            }}
          >
            <Text className="text-primary text-xs font-urbanist-medium">
              Next Day
            </Text>
          </ScaleOnPress>
          <ScaleOnPress
            className="px-3 py-2 rounded-full bg-primary/10 border border-primary/15"
            onPress={() => {
              const threeDays = new Date(travelDate);
              threeDays.setDate(threeDays.getDate() + 3);
              setReturnDate(threeDays);
            }}
          >
            <Text className="text-primary text-xs font-urbanist-medium">
              +3 Days
            </Text>
          </ScaleOnPress>
          <ScaleOnPress
            className="px-3 py-2 rounded-full bg-primary/10 border border-primary/15"
            onPress={() => {
              const week = new Date(travelDate);
              week.setDate(week.getDate() + 7);
              setReturnDate(week);
            }}
          >
            <Text className="text-primary text-xs font-urbanist-medium">
              +1 Week
            </Text>
          </ScaleOnPress>
          <ScaleOnPress
            className="px-3 py-2 rounded-full bg-primary/10 border border-primary/15"
            onPress={async () => {
              try {
                await Haptics.selectionAsync();
              } catch {}
              setShowNativeReturnPicker(true);
            }}
          >
            <Text className="text-primary text-xs font-urbanist-medium">
              Custom date
            </Text>
          </ScaleOnPress>
        </View>
        {showNativeReturnPicker ? (
          <View className="mt-2">
            <DateTimePicker
              value={returnDate || new Date(travelDate.getTime() + 86400000)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date(travelDate.getTime() + 86400000)}
              themeVariant={Platform.OS === "ios" ? "light" : undefined}
              textColor={Platform.OS === "ios" ? COLORS.primary : undefined}
              accentColor={COLORS.primary}
              onChange={(event, selectedDate) => {
                if (Platform.OS === "android") {
                  setShowNativeReturnPicker(false);
                }
                if (selectedDate) {
                  const d = new Date(selectedDate);
                  d.setHours(0, 0, 0, 0);
                  setReturnDate(d);
                }
              }}
            />
          </View>
        ) : null}
        <View className="flex-row items-center justify-between py-4">
          <TouchableOpacity
            disabled={!returnDate || returnDate <= travelDate}
            className="px-4 py-3 rounded-full bg-primary/10"
            style={{
              opacity: !returnDate || returnDate <= travelDate ? 0.4 : 1,
            }}
            onPress={() => {
              if (!returnDate || returnDate <= travelDate) return;
              setReturnDate((d) => {
                const nd = new Date(d);
                nd.setDate(nd.getDate() - 1);
                // Don't go before travel date
                if (nd <= travelDate) return d;
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
            {returnDate
              ? new Date(returnDate).toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "Select a date"}
          </Text>
          <TouchableOpacity
            className="px-4 py-3 rounded-full bg-primary/10"
            onPress={() =>
              setReturnDate((d) => {
                const nd = new Date(d || travelDate);
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
            setShowNativeReturnPicker(false);
            setShowReturnDateModal(false);
          }}
        />
      </BottomSheetModal>
    </View>
  );
}
