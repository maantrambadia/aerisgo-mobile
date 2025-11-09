import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  BackHandler,
  FlatList,
  TouchableOpacity,
  Image,
  Pressable,
} from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import PrimaryButton from "../components/PrimaryButton";
import Loader from "../components/Loader";
import { getUserProfile } from "../lib/storage";
import { fetchMe } from "../lib/auth";
import { router } from "expo-router";
import { toast } from "../lib/toast";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

// Micro-interaction: Scale on press
const ScalePress = ({ children, onPress, className = "" }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 250 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 250 });
      }}
      onPress={onPress}
      className={className}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
};

// Profile action card with icon
const ProfileCard = ({ icon, title, subtitle, onPress, delay = 0 }) => (
  <Animated.View
    entering={FadeInDown.duration(400)
      .delay(delay)
      .easing(Easing.out(Easing.cubic))}
  >
    <ScalePress onPress={onPress}>
      <View className="bg-secondary/40 border border-primary/10 rounded-[28px] p-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
            <Ionicons name={icon} size={22} color="#541424" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-primary font-urbanist-semibold text-base">
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-primary/60 font-urbanist text-sm mt-0.5">
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#541424" />
      </View>
    </ScalePress>
  </Animated.View>
);

// FAQ Item with expand/collapse animation
const FAQItem = ({ question, answer, delay = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const height = useSharedValue(0);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const heightStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: height.value > 0 ? 1 : 0,
  }));

  const toggle = async () => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    setExpanded(!expanded);
    rotation.value = withSpring(expanded ? 0 : 180, {
      damping: 15,
      stiffness: 200,
    });
    height.value = withTiming(expanded ? 0 : 100, { duration: 300 });
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400)
        .delay(delay)
        .easing(Easing.out(Easing.cubic))}
      className="mb-3"
    >
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        className="bg-secondary/40 border border-primary/10 rounded-[28px] p-4"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-primary font-urbanist-semibold text-base flex-1 pr-3">
            {question}
          </Text>
          <Animated.View style={rotationStyle}>
            <Ionicons name="chevron-down" size={20} color="#541424" />
          </Animated.View>
        </View>
        <Animated.View style={heightStyle} className="overflow-hidden">
          <Text className="text-primary/70 font-urbanist text-sm mt-3 leading-5">
            {answer}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Profile() {
  const { logout: authLogout, user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await getUserProfile();
      setUser(u);
      setTimeout(() => setLoading(false), 200);
    })();
  }, []);

  // Block Android hardware back from leaving the main tab
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

  // Refresh user from server on focus so updates (e.g., gender) reflect immediately
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const fresh = await fetchMe();
          if (active && fresh) setUser(fresh);
        } catch {
          // ignore network/auth errors; keep cached user
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  // Avatar logic (same as home.jsx)
  const avatarSource = useMemo(() => {
    const g = (user?.gender || "other").toLowerCase();
    if (g === "male") return require("../assets/images/male.png");
    if (g === "female") return require("../assets/images/female.png");
    return null; // other -> show '?'
  }, [user?.gender]);

  const faqs = [
    {
      question: "How do I reach support team?",
      answer: "Contact our support team via the support@aerisgo.in.",
    },
    {
      question: "How do I change my flight booking?",
      answer:
        "Contact our support team via the support@aerisgo.in. Modifications depend on fare rules and availability.",
    },
    {
      question: "What is the baggage allowance?",
      answer:
        "Economy: 15kg check-in + 7kg cabin. Business: 30kg check-in + 10kg cabin. Excess charges apply.",
    },
    {
      question: "How do I check-in online?",
      answer:
        "Online check-in opens 24 hours before departure. Visit our website or use the app to check-in and get your boarding pass.",
    },
    {
      question: "Can I cancel my booking?",
      answer:
        "Yes, cancellations are subject to fare rules. Refunds may take 7-10 business days to process.",
    },
  ];

  if (loading) {
    return (
      <Loader message="Loading profile" subtitle="Fetching your information" />
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Grouped Header Section - Single Animated.View */}
      <Animated.View
        entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))}
        className="border-b border-primary/10"
      >
        {/* Sticky Header */}
        <View className="px-6 pt-6 pb-4 bg-background">
          <Text className="text-primary font-urbanist-bold text-3xl">
            Profile
          </Text>
          <Text className="text-primary/70 font-urbanist-medium text-base mt-1">
            Manage your account and preferences
          </Text>
        </View>

        {/* Sticky Profile Card - Compact */}
        <View className="mx-6 mb-4 bg-primary rounded-[36px] p-4 border border-secondary/15">
          <View className="flex-row items-center">
            {/* Avatar */}
            <View className="w-16 h-16 rounded-full bg-secondary/20 items-center justify-center border-2 border-secondary/30 overflow-hidden mr-4">
              {avatarSource ? (
                <Image
                  source={avatarSource}
                  resizeMode="cover"
                  className="w-16 h-[62px] rounded-full mt-2 p-1"
                />
              ) : (
                <Text className="text-secondary font-urbanist-bold text-2xl">
                  ?
                </Text>
              )}
            </View>

            {/* Name & Info */}
            <View className="flex-1">
              <Text className="text-secondary font-urbanist-bold text-xl">
                {user?.name || "Traveler"}
              </Text>
              <Text className="text-secondary/70 font-urbanist text-sm mt-0.5">
                {user?.email || "—"}
              </Text>
              {/* Info Pills - Horizontal */}
              <View className="flex-row gap-2 mt-2">
                <View className="bg-secondary/20 px-3 py-1 rounded-full flex-row items-center gap-1">
                  <Ionicons name="call" size={12} color="#e3d7cb" />
                  <Text className="text-secondary font-urbanist text-xs">
                    {user?.phone || "—"}
                  </Text>
                </View>
                <View className="bg-secondary/20 px-3 py-1 rounded-full flex-row items-center gap-1">
                  <Ionicons name="person" size={12} color="#e3d7cb" />
                  <Text className="text-secondary font-urbanist text-xs capitalize">
                    {user?.gender || "other"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 128 }}
        ListHeaderComponent={
          <>
            {/* Profile Management Section */}
            <View className="px-6 mb-6 mt-5">
              <Text className="text-primary font-urbanist-bold text-xl mb-4">
                Profile Management
              </Text>
              <View className="gap-3">
                <ProfileCard
                  icon="person-outline"
                  title="Edit Profile"
                  subtitle="Update your personal information"
                  delay={250}
                  onPress={async () => {
                    try {
                      await Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Medium
                      );
                    } catch {}
                    router.push("/edit-profile");
                  }}
                />
                <ProfileCard
                  icon="lock-closed-outline"
                  title="Change Password"
                  subtitle="Update your account password"
                  delay={300}
                  onPress={async () => {
                    try {
                      await Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Medium
                      );
                    } catch {}
                    router.push("/change-password");
                  }}
                />
                <ProfileCard
                  icon="document-text-outline"
                  title="User Documents"
                  subtitle="Manage Aadhar and Passport"
                  delay={350}
                  onPress={async () => {
                    try {
                      await Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Medium
                      );
                    } catch {}
                    router.push("/user-documents");
                  }}
                />
              </View>
            </View>

            {/* FAQs Section */}
            <View className="px-6 mb-6">
              <Text className="text-primary font-urbanist-bold text-xl">
                Frequently Asked Questions
              </Text>
            </View>
          </>
        }
        data={faqs}
        keyExtractor={(item, idx) => `faq-${idx}`}
        renderItem={({ item: faq, index: idx }) => (
          <View className="px-6">
            <FAQItem
              question={faq.question}
              answer={faq.answer}
              delay={450 + idx * 50}
            />
          </View>
        )}
        ListFooterComponent={
          <View className="px-6 mb-6 mt-5">
            <PrimaryButton
              title="Sign Out"
              leftIconName="log-out-outline"
              onPress={async () => {
                try {
                  await authLogout();
                  toast.success({
                    title: "Signed out",
                    message: "See you soon!",
                  });
                  // AuthContext handles redirect to sign-in
                } catch (e) {
                  toast.error({
                    title: "Error",
                    message: e?.message || "Failed to sign out",
                  });
                }
              }}
              withHaptics
              hapticStyle="medium"
              className="w-full"
            />
          </View>
        }
      />
    </View>
  );
}
