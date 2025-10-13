import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { subscribe } from "../lib/toast";

const typeConfig = {
  success: {
    icon: "checkmark-circle-outline",
    color: "#16a34a", // green-600
  },
  error: {
    icon: "close-circle-outline",
    color: "#dc2626", // red-600
  },
  info: {
    icon: "information-circle-outline",
    color: "#2563eb", // blue-600
  },
  warning: {
    icon: "warning-outline",
    color: "#d97706", // amber-600
  },
};

function hapticForType(type) {
  switch (type) {
    case "success":
      return Haptics.ImpactFeedbackStyle.Light;
    case "warning":
      return Haptics.ImpactFeedbackStyle.Medium;
    case "error":
      return Haptics.ImpactFeedbackStyle.Heavy;
    case "info":
    default:
      return null;
  }
}

export default function ToastHost() {
  const [items, setItems] = useState([]);
  const timers = useRef(new Map());
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsub = subscribe((evt) => {
      if (evt.kind === "show" && evt.toast) {
        const t = evt.toast;
        setItems((prev) => {
          // Clear timers for any existing toasts since we only allow one
          prev.forEach((p) => {
            const h = timers.current.get(p.id);
            if (h) {
              clearTimeout(h);
              timers.current.delete(p.id);
            }
          });
          return [t]; // keep only the latest toast
        });
        if (t.haptics) {
          const style = hapticForType(t.type);
          if (style) {
            Haptics.impactAsync(style).catch(() => {});
          }
        }
        if (t.duration > 0) {
          const handle = setTimeout(() => dismiss(t.id), t.duration);
          timers.current.set(t.id, handle);
        }
      } else if (evt.kind === "dismiss") {
        dismiss(evt.id);
      }
    });
    return () => {
      unsub();
      // cleanup timers
      timers.current.forEach((h) => clearTimeout(h));
      timers.current.clear();
    };
  }, []);

  const dismiss = (id) => {
    if (!id) return;
    const handle = timers.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timers.current.delete(id);
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const topPad = useMemo(() => Math.max(16, insets.top + 10), [insets.top]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", left: 0, right: 0, top: topPad }}
        className="px-4 gap-2"
      >
        {items.map((t) => (
          <Animated.View
            key={t.id}
            entering={FadeInDown.duration(220)}
            exiting={FadeOutUp.duration(180)}
            layout={Layout.springify()}
            className="w-full"
          >
            <BlurView
              intensity={Platform.OS === "android" ? 50 : 40}
              tint="light"
              experimentalBlurMethod={
                Platform.OS === "android" ? "dimezisBlurView" : undefined
              }
              className="rounded-2xl overflow-hidden"
            >
              <View className="flex-row items-start p-3">
                <View
                  style={{
                    width: 4,
                    backgroundColor: typeConfig[t.type]?.color || "#2563eb",
                  }}
                  className="rounded-full mr-3"
                />
                <View className="flex-row items-start flex-1">
                  <Ionicons
                    name={
                      typeConfig[t.type]?.icon || "information-circle-outline"
                    }
                    size={20}
                    color={typeConfig[t.type]?.color || "#2563eb"}
                    style={{ marginTop: 2, marginRight: 8 }}
                  />
                  <View className="flex-1">
                    {t.title ? (
                      <Text className="text-primary font-urbanist-semibold text-base">
                        {t.title}
                      </Text>
                    ) : null}
                    {t.message ? (
                      <Text className="text-primary/80 font-urbanist text-sm mt-0.5">
                        {t.message}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => dismiss(t.id)}
                    hitSlop={8}
                    className="ml-2"
                  >
                    <Ionicons name="close" size={18} color="#6b7280" />
                  </Pressable>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
