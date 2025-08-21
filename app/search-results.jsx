import { View, Text, ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Micro-interaction: press-scale wrapper used across header buttons and chips
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

const Chip = ({
  label,
  icon,
  active = false,
  onPress,
  variant = "default",
}) => {
  const isPrimary = active || variant === "primary";
  const isGhost = variant === "ghost";
  const containerCls =
    "items-center justify-center px-5 py-3 rounded-full border " +
    (isPrimary
      ? "bg-primary border-transparent"
      : isGhost
        ? "bg-primary/10 border-primary/20"
        : "bg-secondary border-primary/15");
  const tint = isPrimary ? "#e3d7cb" : "#541424";
  return (
    <ScaleOnPress
      onPress={onPress}
      className={containerCls}
      style={{ width: 140 }}
    >
      <View className="flex-row items-center justify-center gap-2">
        {icon ? <Ionicons name={icon} size={18} color={tint} /> : null}
        <Text
          numberOfLines={1}
          className={
            (isPrimary ? "text-text " : "text-primary/90 ") +
            "font-urbanist-medium text-sm"
          }
        >
          {label}
        </Text>
      </View>
    </ScaleOnPress>
  );
};

// Route pill replacing the earth widget
const RoutePill = ({ from, to }) => {
  const fromShort = String(from).split(",")[0].trim();
  const toShort = String(to).split(",")[0].trim();
  return (
    <View className="rounded-full bg-secondary/60 px-4 py-2 flex-row items-center gap-2">
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

const TicketResultCard = ({
  fromCity = "Dhaka",
  toCity = "Ottawa",
  departTime = "12:30",
  arriveTime = "11:30",
  duration = "20h 20m",
  airline = "Emirates",
  price = "$1270",
}) => {
  return (
    <View className="relative mt-4">
      <View className="bg-primary rounded-[28px] p-5 overflow-hidden">
        {/* Top row times/cities + arc */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-text/90 font-urbanist-semibold text-[11px]">
              {fromCity}
            </Text>
            <Text className="text-text font-urbanist-bold text-2xl mt-1">
              {departTime}
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
              {toCity}
            </Text>
            <Text className="text-text font-urbanist-bold text-2xl mt-1">
              {arriveTime}
            </Text>
          </View>
        </View>

        {/* Duration */}
        <Text className="text-text/70 font-urbanist-medium text-[11px] text-center mt-2">
          {duration}
        </Text>

        {/* Bottom brand/price bar */}
        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-text font-urbanist-bold text-2xl">
            {airline}
          </Text>
          <Text className="text-text font-urbanist-bold text-xl">{price}</Text>
        </View>
      </View>

      {/* Ticket notches */}
      <Notch side="left" />
      <Notch side="right" />
    </View>
  );
};

export default function SearchResults() {
  const params = useLocalSearchParams();
  const { from = "Dhaka", to = "Ottawa" } = params;
  const insets = useSafeAreaInsets();

  const flights = [
    {
      airline: "Emirates",
      price: "$1270",
      departTime: "12:30",
      arriveTime: "11:30",
      duration: "20h 20m",
    },
    {
      airline: "Qatar",
      price: "$1370",
      departTime: "13:30",
      arriveTime: "08:50",
      duration: "19h 20m",
    },
    {
      airline: "Etihad",
      price: "$1290",
      departTime: "16:15",
      arriveTime: "06:10",
      duration: "15h 55m",
    },
    {
      airline: "Lufthansa",
      price: "$1210",
      departTime: "18:45",
      arriveTime: "10:35",
      duration: "17h 50m",
    },
    {
      airline: "Air India",
      price: "$990",
      departTime: "06:15",
      arriveTime: "20:40",
      duration: "18h 25m",
    },
    {
      airline: "United",
      price: "$1410",
      departTime: "21:05",
      arriveTime: "12:10",
      duration: "19h 05m",
    },
    {
      airline: "Turkish",
      price: "$1190",
      departTime: "23:10",
      arriveTime: "13:20",
      duration: "18h 10m",
    },
    {
      airline: "Singapore",
      price: "$1490",
      departTime: "01:30",
      arriveTime: "18:05",
      duration: "20h 35m",
    },
    {
      airline: "British",
      price: "$1310",
      departTime: "09:10",
      arriveTime: "04:15",
      duration: "21h 05m",
    },
    {
      airline: "KLM",
      price: "$1280",
      departTime: "11:20",
      arriveTime: "05:55",
      duration: "18h 35m",
    },
    {
      airline: "Emirates",
      price: "$1260",
      departTime: "07:45",
      arriveTime: "03:25",
      duration: "19h 40m",
    },
    {
      airline: "Qatar",
      price: "$1320",
      departTime: "14:20",
      arriveTime: "09:15",
      duration: "18h 55m",
    },
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="px-6 pt-6"
      >
        <View className="flex-row items-center justify-between">
          <ScaleOnPress
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
          </ScaleOnPress>
          <Text className="text-primary font-urbanist-semibold text-lg">
            Search Result
          </Text>
          <ScaleOnPress
            className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15"
            onPress={async () => {
              try {
                await Haptics.selectionAsync();
              } catch {}
            }}
          >
            <Ionicons name="notifications-outline" size={22} color="#541424" />
          </ScaleOnPress>
        </View>
      </Animated.View>

      {/* Stats + route */}
      <Animated.View
        entering={FadeInDown.duration(550).delay(80).springify()}
        className="px-6 mt-4"
      >
        <View className="flex-row items-start justify-between">
          <View style={{ maxWidth: "60%" }}>
            <Text className="text-primary font-urbanist-bold text-3xl leading-9">
              251 Flight
            </Text>
            <Text className="text-primary font-urbanist-bold text-3xl leading-9 -mt-1">
              Available
            </Text>
          </View>
          <RoutePill from={from} to={to} />
        </View>
      </Animated.View>

      {/* Chips */}
      <Animated.View
        entering={FadeInDown.duration(550).delay(120).springify()}
        className="px-6 mt-4"
      >
        <View className="flex-row items-center gap-3">
          <Chip label="Economy" variant="primary" />
          <Chip label="Modify" icon="options-outline" variant="ghost" />
        </View>
      </Animated.View>

      {/* Scrollable results only */}
      <Animated.View
        entering={FadeInUp.duration(600).delay(180).springify()}
        className="flex-1 px-6 mt-4"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {flights.map((f, i) => (
            <Animated.View
              key={i}
              entering={FadeInUp.duration(600)
                .delay(200 + i * 60)
                .springify()}
            >
              <TicketResultCard
                fromCity={from}
                toCity={to}
                departTime={f.departTime}
                arriveTime={f.arriveTime}
                duration={f.duration}
                airline={f.airline}
                price={f.price}
              />
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
