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
import { signInApp as apiSignInApp } from "../../lib/auth";
import { toast } from "../../lib/toast";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const em = String(email || "").trim();
    const pw = String(password || "");

    if (!em || !pw) {
      toast.warn({
        title: "Missing fields",
        message: "Enter your email and password",
      });
      return;
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em);
    if (!emailValid) {
      toast.warn({ title: "Invalid email", message: "Enter a valid email" });
      return;
    }

    setLoading(true);
    try {
      await apiSignInApp({ email: em, password: pw, remember: true });
      try {
        await Haptics.selectionAsync();
      } catch {}
      toast.success({ title: "Signed in", message: "Welcome back!" });
      router.replace("/home");
    } catch (e) {
      const msg = e?.message || "Sign in failed";
      if (e?.status === 403) {
        const reason = e?.data?.reason;
        if (reason === "not_verified") {
          toast.info({
            title: "Verify your email",
            message: "Please enter the code we sent to your inbox",
          });
          router.push({
            pathname: "/verify-otp",
            params: { email: em, next: "/sign-in", autoResend: "1" },
          });
        } else if (reason === "not_passenger") {
          toast.error({
            title: "Sign-in not allowed",
            message:
              "Only verified passengers can sign in to the app. If you're staff/admin, please use the web portal.",
          });
        } else {
          toast.error({ title: "Sign in failed", message: msg });
        }
      } else {
        toast.error({ title: "Sign in failed", message: msg });
      }
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
                Welcome back
              </Text>
              <Text className="text-primary opacity-80 font-urbanist-medium mt-2">
                Sign in to continue.
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
                returnKeyType="next"
              />
              <FormInput
                label="Password"
                placeholder="Enter password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                }}
                secureTextEntry
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
              <View className="items-end">
                <Text
                  className="text-primary font-urbanist-medium underline"
                  onPress={async () => {
                    try {
                      await Haptics.selectionAsync();
                    } catch {}
                    router.push("/forgot-password");
                  }}
                >
                  Forgot password?
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View className="px-6 mt-8 pb-8">
              <PrimaryButton
                title="Sign In"
                onPress={onSubmit}
                className="w-full"
                withHaptics
                hapticStyle="medium"
                disabled={loading}
              />
              <View className="items-center mt-4">
                <Text className="text-primary font-urbanist-medium">
                  Don&apos;t have an account?{" "}
                  <Text
                    className="font-urbanist-semibold underline"
                    onPress={async () => {
                      try {
                        await Haptics.selectionAsync();
                      } catch {}
                      router.push("/sign-up");
                    }}
                  >
                    Sign Up
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
