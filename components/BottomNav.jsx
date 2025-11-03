import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

const TabItem = ({ label, icon, iconActive, active, onPress }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 220 });
      }}
      onPress={onPress}
      className="w-full items-center justify-center py-3"
    >
      <Animated.View style={animatedStyle} className="items-center gap-1">
        <Ionicons
          name={active ? iconActive : icon}
          size={22}
          color={active ? "#e3d7cb" : "#541424"}
        />
        <Text
          className={
            active
              ? "text-text font-urbanist-medium text-xs"
              : "text-primary/80 font-urbanist text-xs"
          }
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export default function BottomNav({ active = "home", onPressItem }) {
  const insets = useSafeAreaInsets();
  const tabs = useMemo(
    () => [
      { key: "home", label: "Home", icon: "home-outline", iconActive: "home" },
      {
        key: "tickets",
        label: "Tickets",
        icon: "pricetag-outline",
        iconActive: "pricetag",
      },
      {
        key: "rewards",
        label: "Rewards",
        icon: "gift-outline",
        iconActive: "gift",
      },
      {
        key: "profile",
        label: "Profile",
        icon: "person-outline",
        iconActive: "person",
      },
    ],
    []
  );

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.key === active)
  );

  const [width, setWidth] = useState(0);
  const itemWidth = width > 0 ? width / tabs.length : 0;

  const indicatorX = useSharedValue(0);
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: Math.max(itemWidth, 0),
  }));

  useEffect(() => {
    if (itemWidth > 0) {
      indicatorX.value = withSpring(activeIndex * itemWidth, {
        damping: 40,
        stiffness: 260,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, itemWidth]);

  const press = (key) => async () => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    onPressItem && onPressItem(key);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: (insets?.bottom || 0) + 12,
        alignItems: "center",
      }}
    >
      <BlurView
        intensity={25}
        tint="light"
        className="w-11/12 rounded-full border border-primary/10 overflow-hidden"
        style={{
          paddingHorizontal: 6,
          paddingVertical: 6,
          shadowColor: "#541424",
          shadowOpacity: 0.15,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        <View
          className="flex-row items-center w-full"
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
          {/* Animated pill indicator (fills full height) */}
          <Animated.View
            style={indicatorStyle}
            className="absolute top-0 bottom-0 left-0 rounded-full bg-primary"
          />

          {tabs.map((t, i) => (
            <View key={t.key} style={{ width: itemWidth }}>
              <TabItem
                label={t.label}
                icon={t.icon}
                iconActive={t.iconActive}
                active={i === activeIndex}
                onPress={press(t.key)}
              />
            </View>
          ))}
        </View>
      </BlurView>
    </View>
  );
}
