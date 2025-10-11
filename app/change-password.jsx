import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import FormInput from "../components/FormInput";
import PrimaryButton from "../components/PrimaryButton";
import { changePassword } from "../lib/profile";
import { toast } from "../lib/toast";

export default function ChangePassword() {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Same validation as sign-up
  const isStrongPassword = (v) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(v);

  const handleChangePassword = async () => {
    try {
      if (!currentPassword.trim()) {
        toast.error({
          title: "Error",
          message: "Current password is required",
        });
        return;
      }
      if (!newPassword.trim()) {
        toast.error({ title: "Error", message: "New password is required" });
        return;
      }
      if (!isStrongPassword(newPassword)) {
        toast.error({
          title: "Weak password",
          message: "Min 8 chars with upper, lower, number and symbol",
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error({ title: "Error", message: "Passwords do not match" });
        return;
      }

      setLoading(true);
      await changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      toast.success({
        title: "Success",
        message: "Password changed successfully",
      });
      router.back();
    } catch (error) {
      toast.error({
        title: "Change Failed",
        message: error?.message || "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500).springify()}
        className="px-6 pt-6 pb-4 bg-background flex-row items-center justify-between"
      >
        <TouchableOpacity
          className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center border border-primary/15"
          onPress={async () => {
            try {
              await Haptics.selectionAsync();
            } catch {}
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#541424" />
        </TouchableOpacity>
        <Text className="text-primary font-urbanist-semibold text-lg">
          Change Password
        </Text>
        <View className="w-14 h-14" />
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-6 mt-4">
            <Animated.View
              entering={FadeInDown.duration(400).delay(100).springify()}
            >
              <FormInput
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                leftIconName="lock-closed-outline"
                secureTextEntry
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(400).delay(150).springify()}
              className="mt-4"
            >
              <FormInput
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                leftIconName="lock-closed-outline"
                secureTextEntry
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(400).delay(200).springify()}
              className="mt-4"
            >
              <FormInput
                label="Confirm New Password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                leftIconName="lock-closed-outline"
                secureTextEntry
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(400).delay(250).springify()}
              className="mt-8"
            >
              <PrimaryButton
                title={loading ? "Changing..." : "Change Password"}
                onPress={handleChangePassword}
                disabled={loading}
                withHaptics
                hapticStyle="medium"
                className="w-full"
              />
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
