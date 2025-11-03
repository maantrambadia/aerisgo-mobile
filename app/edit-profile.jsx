import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeInDown, Easing } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import FormInput from "../components/FormInput";
import PrimaryButton from "../components/PrimaryButton";
import Loader from "../components/Loader";
import { getUserProfile, setUserProfile } from "../lib/storage";
import { updateProfile } from "../lib/profile";
import { toast } from "../lib/toast";

export default function EditProfile() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("other");

  useEffect(() => {
    (async () => {
      const user = await getUserProfile();
      if (user) {
        setName(user.name || "");
        // Remove +91 prefix if present
        const phoneNum = (user.phone || "").replace(/^\+91/, "");
        setPhone(phoneNum);
        setGender(user.gender || "other");
      }
      // Small delay for consistent UX
      setTimeout(() => setInitialLoading(false), 200);
    })();
  }, []);

  // Name formatting (same as sign-up)
  const formatNameLive = (raw) => {
    const src = String(raw || "");
    const onlyLetters = src.replace(/[^a-zA-Z\s]/g, "");
    const hadTrailing = /\s$/.test(onlyLetters);
    const collapsed = onlyLetters.replace(/\s{2,}/g, " ");
    const parts = collapsed.split(" ");
    const titleCased = parts
      .map((w) =>
        w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""
      )
      .join(" ");
    return hadTrailing && !titleCased.endsWith(" ")
      ? `${titleCased} `
      : titleCased;
  };

  const formatName = (raw) => {
    const onlyLetters = String(raw || "").replace(/[^a-zA-Z\s]/g, "");
    const singleSpaced = onlyLetters.replace(/\s+/g, " ").trim();
    return singleSpaced
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const isValidName = (v) => v.length >= 2 && /^[A-Za-z ]+$/.test(v);
  const isValidPhone = (v) => /^\d{10}$/.test(v);

  const handleSave = async () => {
    try {
      const nm = formatName(name);
      const ph = phone.trim();

      if (!nm) {
        toast.error({ title: "Error", message: "Name is required" });
        return;
      }
      if (!isValidName(nm)) {
        toast.error({
          title: "Invalid name",
          message: "Only letters and spaces allowed (min 2 chars)",
        });
        return;
      }
      if (!ph) {
        toast.error({ title: "Error", message: "Phone is required" });
        return;
      }
      if (!isValidPhone(ph)) {
        toast.error({
          title: "Invalid phone",
          message: "Enter 10-digit phone number",
        });
        return;
      }

      setLoading(true);
      const phoneE164 = `+91${ph}`;
      const result = await updateProfile({
        name: nm,
        phone: phoneE164,
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

  if (initialLoading) {
    return (
      <Loader message="Loading profile" subtitle="Preparing your information" />
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))}
        className="px-6 pt-6 pb-4 bg-background flex-row items-center justify-between border-b border-primary/10"
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
          Edit Profile
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
          <Animated.View
            entering={FadeInDown.duration(400)
              .delay(100)
              .easing(Easing.out(Easing.cubic))}
            className="px-6 mt-4"
          >
            <FormInput
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={(text) => setName(formatNameLive(text))}
              leftIconName="person-outline"
            />

            <View className="mt-4">
              <FormInput
                label="Phone Number"
                placeholder="9000000000"
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                leftIconName="call-outline"
                keyboardType="phone-pad"
                prefix="+91"
                maxLength={10}
              />
            </View>

            <View className="mt-4">
              <Text className="text-primary font-urbanist-medium text-base mb-2">
                Gender
              </Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={async () => {
                    try {
                      await Haptics.selectionAsync();
                    } catch {}
                    setGender("male");
                  }}
                  className={`px-4 py-3 rounded-full border ${
                    gender === "male"
                      ? "bg-primary border-primary"
                      : "bg-secondary/10 border-primary/10"
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name="male"
                      size={18}
                      color={gender === "male" ? "#e3d7cb" : "#541424"}
                    />
                    <Text
                      className={`${
                        gender === "male" ? "text-secondary" : "text-primary"
                      } font-urbanist-semibold`}
                    >
                      Male
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={async () => {
                    try {
                      await Haptics.selectionAsync();
                    } catch {}
                    setGender("female");
                  }}
                  className={`px-4 py-3 rounded-full border ${
                    gender === "female"
                      ? "bg-primary border-primary"
                      : "bg-secondary/10 border-primary/10"
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name="female"
                      size={18}
                      color={gender === "female" ? "#e3d7cb" : "#541424"}
                    />
                    <Text
                      className={`${
                        gender === "female" ? "text-secondary" : "text-primary"
                      } font-urbanist-semibold`}
                    >
                      Female
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={async () => {
                    try {
                      await Haptics.selectionAsync();
                    } catch {}
                    setGender("other");
                  }}
                  className={`px-4 py-3 rounded-full border ${
                    gender === "other"
                      ? "bg-primary border-primary"
                      : "bg-secondary/10 border-primary/10"
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={gender === "other" ? "#e3d7cb" : "#541424"}
                    />
                    <Text
                      className={`${
                        gender === "other" ? "text-secondary" : "text-primary"
                      } font-urbanist-semibold`}
                    >
                      Other
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View className="mt-8">
              <PrimaryButton
                title={loading ? "Saving..." : "Save Changes"}
                onPress={handleSave}
                disabled={loading}
                withHaptics
                hapticStyle="medium"
                className="w-full"
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
