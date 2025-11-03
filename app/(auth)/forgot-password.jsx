import { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Easing,
} from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import FormInput from "../../components/FormInput";
import PrimaryButton from "../../components/PrimaryButton";
import welcomeLogo from "../../assets/images/welcome-logo.png";
import { requestPasswordReset as apiRequestPasswordReset } from "../../lib/auth";
import { toast } from "../../lib/toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const emailStr = String(email || "").trim();
    if (!emailStr) {
      toast.warn({
        title: "Missing email",
        message: "Please enter your email address",
      });
      return;
    }
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailStr);
    if (!emailValid) {
      toast.warn({ title: "Invalid email", message: "Enter a valid email" });
      return;
    }
    setLoading(true);
    try {
      await apiRequestPasswordReset({ email: emailStr });
      try {
        await Haptics.selectionAsync();
      } catch {}
      toast.success({
        title: "Code sent",
        message: `We sent a 6-digit code to ${emailStr}`,
      });
      router.push({
        pathname: "/verify-otp",
        params: { email: emailStr, mode: "password_reset" },
      });
    } catch (e) {
      toast.error({
        title: "Request failed",
        message: e?.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Fixed Header: Brand + Back */}
      <Animated.View
        entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))}
        className="px-6 pt-8 pb-4 border-b border-primary/10"
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            accessibilityLabel="Go back"
            onPress={async () => {
              try {
                await Haptics.selectionAsync();
              } catch {}
              router.back();
            }}
            activeOpacity={0.8}
            className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15"
          >
            <Ionicons name="chevron-back" size={22} color="#541424" />
          </TouchableOpacity>
          <Image
            source={welcomeLogo}
            resizeMode="contain"
            accessibilityLabel="AerisGo logo"
            className="w-28 h-8 ml-3"
          />
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Grouped Content Animation */}
          <Animated.View
            entering={FadeInUp.duration(400)
              .delay(100)
              .easing(Easing.out(Easing.cubic))}
          >
            {/* Header */}
            <View className="px-6 mt-4">
              <Text className="text-primary font-urbanist-bold text-3xl">
                Forgot password
              </Text>
              <Text className="text-primary opacity-80 font-urbanist-medium mt-2">
                Enter your email and we will send a 6-digit code to verify your
                identity.
              </Text>
            </View>

            {/* Form */}
            <View className="px-6 mt-8 gap-4">
              <FormInput
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={(t) => {
                  const v = t.replace(/\s+/g, "");
                  setEmail(v);
                }}
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
            </View>

            {/* Actions */}
            <View className="px-6 mt-8 pb-8">
              <PrimaryButton
                title="Send code"
                onPress={onSubmit}
                className="w-full"
                withHaptics
                hapticStyle="medium"
                disabled={loading}
              />
              <View className="items-center mt-4">
                <Text className="text-primary font-urbanist-medium">
                  Remembered your password?{" "}
                  <Text
                    className="font-urbanist-semibold underline"
                    onPress={async () => {
                      try {
                        await Haptics.selectionAsync();
                      } catch {}
                      router.push("/sign-in");
                    }}
                  >
                    Sign In
                  </Text>
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
