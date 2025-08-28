import { useEffect, useState, useCallback } from "react";
import { View, Text, BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../components/PrimaryButton";
import { getUserProfile } from "../lib/storage";
import { signOut } from "../lib/auth";
import { router } from "expo-router";
import { toast } from "../lib/toast";
import { useFocusEffect } from "@react-navigation/native";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await getUserProfile();
      setUser(u);
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

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6">
        <Text className="text-primary font-urbanist-bold text-3xl">
          Profile
        </Text>
        <Text className="text-primary/70 font-urbanist mt-2">
          Manage your account and settings.
        </Text>
      </View>

      {/* User info */}
      <View className="px-6 mt-6 gap-3">
        <View className="flex-row items-center gap-3">
          <View>
            <Text className="text-primary font-urbanist-bold text-xl">
              {user?.name || "—"}
            </Text>
            <Text className="text-primary/70 font-urbanist">
              {user?.email || "—"}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2 mt-2">
          <Ionicons name="call-outline" size={18} color="#541424" />
          <Text className="text-primary/80 font-urbanist">
            {user?.phone || "—"}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="person-outline" size={18} color="#541424" />
          <Text className="text-primary/80 font-urbanist capitalize">
            {user?.gender || "other"}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="px-6 mt-10">
        <PrimaryButton
          title="Sign Out"
          leftIconName="log-out-outline"
          onPress={async () => {
            try {
              await signOut();
              toast.success({ title: "Signed out", message: "See you soon" });
            } catch (e) {
              toast.error({
                title: "Sign out failed",
                message: e?.message || "Try again",
              });
            } finally {
              router.replace("/sign-in");
            }
          }}
          withHaptics
          hapticStyle="medium"
          className="w-full"
        />
      </View>
    </View>
  );
}
