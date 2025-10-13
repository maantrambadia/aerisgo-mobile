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
import { resetPassword as apiResetPassword } from "../../lib/auth";
import { toast } from "../../lib/toast";

export default function ResetPassword() {
  const { email = "", resetToken } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!password || !confirm) {
      toast.warn({
        title: "Missing fields",
        message: "Please fill both fields",
      });
      return;
    }
    if (password.length < 8) {
      toast.warn({
        title: "Weak password",
        message: "Password must be at least 8 characters",
      });
      return;
    }
    if (password !== confirm) {
      toast.warn({
        title: "Passwords do not match",
        message: "Re-enter the same password",
      });
      return;
    }
    if (!resetToken) {
      toast.warn({
        title: "Missing token",
        message: "Start from Forgot Password again",
      });
      router.replace("/forgot-password");
      return;
    }
    setLoading(true);
    try {
      await apiResetPassword({ resetToken: String(resetToken), password });
      try {
        await Haptics.selectionAsync();
      } catch {}
      toast.success({
        title: "Password updated",
        message: "You can now sign in",
      });
      router.replace("/sign-in");
    } catch (e) {
      toast.error({
        title: "Update failed",
        message: e?.message || "Invalid or expired token",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Fixed Header: Brand + Back */}
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="px-6 pt-8 pb-4"
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
          {/* Header */}
          <View className="px-6 mt-4">
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
            />
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
              disabled={loading}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
