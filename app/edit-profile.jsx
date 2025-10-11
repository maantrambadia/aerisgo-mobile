import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import FormInput from "../components/FormInput";
import PrimaryButton from "../components/PrimaryButton";
import { getUserProfile, setUserProfile } from "../lib/storage";
import { updateProfile } from "../lib/profile";
import { toast } from "../lib/toast";

export default function EditProfile() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("other");

  useEffect(() => {
    (async () => {
      const user = await getUserProfile();
      if (user) {
        setName(user.name || "");
        setPhone(user.phone || "");
        setGender(user.gender || "other");
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        toast.error({ title: "Error", message: "Name is required" });
        return;
      }
      if (!phone.trim()) {
        toast.error({ title: "Error", message: "Phone is required" });
        return;
      }

      setLoading(true);
      const result = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        gender,
      });

      // Update local storage
      await setUserProfile(result.user);

      toast.success({
        title: "Success",
        message: "Profile updated successfully",
      });
      router.back();
    } catch (error) {
      toast.error({
        title: "Update Failed",
        message: error?.message || "Failed to update profile",
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
        className="px-6 pt-6 pb-4 bg-background flex-row items-center"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="#541424" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-primary font-urbanist-bold text-2xl">
            Edit Profile
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6 mt-4">
          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
          >
            <FormInput
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              leftIconName="person-outline"
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(150).springify()}
            className="mt-4"
          >
            <FormInput
              label="Phone Number"
              placeholder="Enter your phone"
              value={phone}
              onChangeText={setPhone}
              leftIconName="call-outline"
              keyboardType="phone-pad"
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(200).springify()}
            className="mt-4"
          >
            <Text className="text-primary font-urbanist-semibold text-base mb-2">
              Gender
            </Text>
            <View className="flex-row gap-3">
              {["male", "female", "other"].map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={async () => {
                    try {
                      await Haptics.selectionAsync();
                    } catch {}
                    setGender(g);
                  }}
                  className={`flex-1 py-3 rounded-[28px] border ${
                    gender === g
                      ? "bg-primary border-primary"
                      : "bg-secondary/40 border-primary/10"
                  }`}
                >
                  <Text
                    className={`text-center font-urbanist-semibold capitalize ${
                      gender === g ? "text-secondary" : "text-primary"
                    }`}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(250).springify()}
            className="mt-8"
          >
            <PrimaryButton
              title={loading ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={loading}
              withHaptics
              hapticStyle="medium"
              className="w-full"
            />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
