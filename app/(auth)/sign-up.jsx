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
import { signUp as apiSignUp } from "../../lib/auth";
import { toast } from "../../lib/toast";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [gender, setGender] = useState("other");
  const [loading, setLoading] = useState(false);

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
    // Avoid double trailing spaces
    return hadTrailing && !titleCased.endsWith(" ")
      ? `${titleCased} `
      : titleCased;
  };

  // Submit formatter: trimmed, single spaces, title-cased
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
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const isValidPhone = (v) => /^\d{10}$/.test(v);
  const isStrongPassword = (v) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(v);

  const onSubmit = async () => {
    // Validate
    const nm = formatName(name);
    const em = email.trim();
    const ph = phone.trim();

    if (!nm || !em || !ph || !password || !confirm) {
      toast.warn({
        title: "Missing fields",
        message: "Please fill all fields",
      });
      return;
    }

    if (!isValidName(nm)) {
      toast.warn({
        title: "Invalid name",
        message: "Only letters and spaces allowed",
      });
      return;
    }
    if (!isValidEmail(em)) {
      toast.warn({
        title: "Invalid email",
        message: "Enter a valid email address",
      });
      return;
    }
    if (!isValidPhone(ph)) {
      toast.warn({
        title: "Invalid phone",
        message: "Enter 10-digit phone number",
      });
      return;
    }
    if (!isStrongPassword(password)) {
      toast.warn({
        title: "Weak password",
        message: "Min 8 chars with upper, lower, number and symbol",
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

    const phoneE164 = `+91${ph}`;

    setLoading(true);
    try {
      await apiSignUp({
        name: nm,
        email: em,
        phone: phoneE164,
        password,
        gender,
      });
      try {
        await Haptics.selectionAsync();
      } catch {}
      toast.info({
        title: "Check your inbox",
        message: "We sent a 6-digit code for verification",
      });
      router.push({
        pathname: "/verify-otp",
        params: { email, next: "/sign-in" },
      });
    } catch (e) {
      toast.error({
        title: "Sign up failed",
        message: e?.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
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
              Create your account
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.duration(550).delay(150).springify()}
              className="text-primary opacity-80 font-urbanist-medium mt-2"
            >
              Join AerisGo to book flights seamlessly.
            </Animated.Text>
          </View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(250).springify()}
            className="px-6 mt-8 gap-4"
          >
            <FormInput
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChangeText={(t) => {
                const v = formatNameLive(t);
                setName(v);
              }}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
            />
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
              label="Phone"
              placeholder="9000000000"
              value={phone}
              onChangeText={(t) => {
                const digits = (t || "").replace(/\D/g, "").slice(0, 10);
                setPhone(digits);
              }}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="next"
              prefix="+91"
              maxLength={10}
            />
            {/* Gender selector */}
            <View className="mt-1">
              <Text className="text-primary font-urbanist-medium mb-2">
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
                  className={`px-4 py-3 rounded-full border ${gender === "male" ? "bg-primary border-primary" : "bg-secondary/10 border-primary/10"}`}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name="male"
                      size={18}
                      color={gender === "male" ? "#e3d7cb" : "#541424"}
                    />
                    <Text
                      className={`${gender === "male" ? "text-secondary" : "text-primary"} font-urbanist-semibold`}
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
                  className={`px-4 py-3 rounded-full border ${gender === "female" ? "bg-primary border-primary" : "bg-secondary/10 border-primary/10"}`}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name="female"
                      size={18}
                      color={gender === "female" ? "#e3d7cb" : "#541424"}
                    />
                    <Text
                      className={`${gender === "female" ? "text-secondary" : "text-primary"} font-urbanist-semibold`}
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
                  className={`px-4 py-3 rounded-full border ${gender === "other" ? "bg-primary border-primary" : "bg-secondary/10 border-primary/10"}`}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={gender === "other" ? "#e3d7cb" : "#541424"}
                    />
                    <Text
                      className={`${gender === "other" ? "text-secondary" : "text-primary"} font-urbanist-semibold`}
                    >
                      Other
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <FormInput
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
              }}
              secureTextEntry
              autoComplete="password-new"
              returnKeyType="next"
            />
            <FormInput
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirm}
              onChangeText={(t) => {
                setConfirm(t);
              }}
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
              title="Sign Up"
              onPress={onSubmit}
              className="w-full"
              withHaptics
              hapticStyle="medium"
              disabled={loading}
            />
            <View className="items-center mt-4">
              <Text className="text-primary font-urbanist-medium">
                Already have an account?{" "}
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
