import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  StatusBar,
  Pressable,
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
import PrimaryButton from "../components/PrimaryButton";

export default function Home() {
  const [tripType, setTripType] = useState("oneway"); // oneway | roundtrip
  const [from, setFrom] = useState("Rajkot, India");
  const [to, setTo] = useState("Mumbai, India");
  const [date, setDate] = useState("25 Aug 25");
  const [passengers, setPassengers] = useState("1 Adult, 0 Child");
  const userName = "Maan Trambadia";
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const onChangeTrip = async (type) => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    setTripType(type);
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
          <View className="flex-row items-center flex-1">
            <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center">
              <Text className="text-primary font-urbanist-semibold text-xl">
                👨🏻
              </Text>
            </View>
            <View className="ml-3">
              <Text className="text-primary/80 font-urbanist-medium text-lg">
                {greeting}
              </Text>
              <Text className="text-primary font-urbanist-bold text-2xl mt-0.5">
                {userName} 👋
              </Text>
            </View>
          </View>
          <TouchableOpacity className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center">
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
                    {date}
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
                    {passengers}
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
              // TODO: navigate to results
            }}
            withHaptics
            hapticStyle="medium"
          />
        </View>
      </Animated.View>
    </View>
  );
}
