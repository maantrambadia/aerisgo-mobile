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
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import FormInput from "../../components/FormInput";
import PrimaryButton from "../../components/PrimaryButton";
import welcomeLogo from "../../assets/images/welcome-logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const onSubmit = () => {
    if (!email) return;
    // TODO: trigger send OTP API (using email)
    router.push({ pathname: "/verify-otp", params: { email } });
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Brand + Back */}
          <Animated.View
            entering={FadeInDown.duration(500).springify()}
            className="px-6 pt-8"
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
                className="w-[40px] h-[40px] rounded-full bg-primary items-center justify-center pr-1"
              >
                <Ionicons name="chevron-back" size={25} color="white" />
              </TouchableOpacity>
              <Image
                source={welcomeLogo}
                resizeMode="contain"
                accessibilityLabel="AerisGo logo"
                className="w-28 h-8 ml-3"
              />
            </View>
          </Animated.View>

          {/* Header */}
          <View className="px-6 mt-8">
            <Animated.Text
              entering={FadeInDown.duration(550).delay(100).springify()}
              className="text-primary font-urbanist-bold text-3xl"
            >
              Forgot password
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.duration(550).delay(150).springify()}
              className="text-primary opacity-80 font-urbanist-medium mt-2"
            >
              Enter your email and we will send a 6-digit code to verify your
              identity.
            </Animated.Text>
          </View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(250).springify()}
            className="px-6 mt-8 gap-4"
          >
            <FormInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
          </Animated.View>

          {/* Actions */}
          <Animated.View
            entering={FadeInUp.duration(650).delay(350).springify()}
            className="px-6 mt-8 pb-8"
          >
            <PrimaryButton
              title="Send code"
              onPress={onSubmit}
              className="w-full"
              withHaptics
              hapticStyle="medium"
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
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
