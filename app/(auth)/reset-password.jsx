import { useMemo, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import FormInput from "../../components/FormInput";
import PrimaryButton from "../../components/PrimaryButton";
import welcomeLogo from "../../assets/images/welcome-logo.png";

export default function ResetPassword() {
  const { email = "" } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const maskedEmail = useMemo(() => {
    if (typeof email !== "string" || !email.includes("@"))
      return String(email || "");
    const [user, domain] = email.split("@");
    if (!user) return email;
    const masked =
      user.length <= 2
        ? `${user[0]}*`
        : `${user[0]}${"*".repeat(user.length - 2)}${user[user.length - 1]}`;
    return `${masked}@${domain}`;
  }, [email]);

  const onSubmit = async () => {
    setError("");
    if (!password || !confirm) {
      setError("Please fill both fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      await Haptics.selectionAsync();
    } catch {}
    // TODO: call reset password API with email + new password
    router.replace("/sign-in");
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
              Reset password
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.duration(550).delay(150).springify()}
              className="text-primary opacity-80 font-urbanist-medium mt-2"
            >
              Set a new password for {maskedEmail}.
            </Animated.Text>
          </View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(250).springify()}
            className="px-6 mt-8 gap-4"
          >
            <FormInput
              label="New Password"
              placeholder="Enter new password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
              returnKeyType="next"
            />
            <FormInput
              label="Confirm Password"
              placeholder="Re-enter new password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoComplete="password-new"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              error={error}
            />
            {error ? (
              <Text className="text-red-600 font-urbanist-medium">{error}</Text>
            ) : null}
          </Animated.View>

          {/* Actions */}
          <Animated.View
            entering={FadeInUp.duration(650).delay(350).springify()}
            className="px-6 mt-8 pb-8"
          >
            <PrimaryButton
              title="Update password"
              onPress={onSubmit}
              className="w-full"
              withHaptics
              hapticStyle="medium"
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
