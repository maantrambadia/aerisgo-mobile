import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import PrimaryButton from "../../components/PrimaryButton";
import welcomeLogo from "../../assets/images/welcome-logo.png";

export default function VerifyOtp() {
  const { email = "", next } = useLocalSearchParams();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(30);
  const inputsRef = useRef(Array.from({ length: 6 }, () => null));

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

  const code = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const onVerify = () => {
    if (code.length !== 6) return; // simple client-side check
    const dest = typeof next === "string" && next ? next : "/reset-password";
    if (dest === "/reset-password") {
      router.push({ pathname: dest, params: { email: String(email) } });
    } else {
      router.push(dest);
    }
  };

  const onResend = async () => {
    if (seconds > 0) return;
    try {
      await Haptics.selectionAsync();
    } catch {}
    // TODO: call resend OTP API using email
    setSeconds(30);
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
              Verify OTP
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.duration(550).delay(150).springify()}
              className="text-primary opacity-80 font-urbanist-medium mt-2"
            >
              Enter the 6-digit code sent to {maskedEmail}.
            </Animated.Text>
          </View>

          {/* OTP Input */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(250).springify()}
            className="px-6 mt-8 gap-4"
          >
            <Text className="text-primary font-urbanist-semibold mb-1">
              One-Time Password
            </Text>
            <View className="flex-row justify-between gap-2">
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => (inputsRef.current[i] = ref)}
                  value={d}
                  onChangeText={(t) => {
                    const cleaned = (t || "").replace(/\D/g, "");
                    // Handle paste of multiple chars
                    if (cleaned.length > 1) {
                      const next = [...digits];
                      for (let k = 0; k < 6 - i; k++) {
                        next[i + k] = cleaned[k] || "";
                      }
                      setDigits(next.map((x) => x.slice(0, 1)));
                      const lastIndex = Math.min(i + cleaned.length, 5);
                      inputsRef.current[lastIndex]?.focus?.();
                      return;
                    }
                    const next = [...digits];
                    next[i] = cleaned;
                    setDigits(next);
                    if (cleaned && i < 5) {
                      inputsRef.current[i + 1]?.focus?.();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === "Backspace") {
                      if (digits[i]) {
                        const next = [...digits];
                        next[i] = "";
                        setDigits(next);
                        return;
                      }
                      if (i > 0) {
                        inputsRef.current[i - 1]?.focus?.();
                        const next = [...digits];
                        next[i - 1] = "";
                        setDigits(next);
                      }
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  returnKeyType={i === 5 ? "done" : "next"}
                  onSubmitEditing={i === 5 ? onVerify : undefined}
                  className="w-12 h-14 rounded-2xl bg-secondary border border-primary/20 text-center text-primary font-urbanist-semibold text-xl"
                />
              ))}
            </View>
            <Text className="text-primary/70 font-urbanist text-sm mt-1">
              Didn’t receive the code?{" "}
              <Text
                className={`font-urbanist-semibold ${seconds > 0 ? "opacity-40" : "underline"}`}
                onPress={onResend}
              >
                Resend{seconds > 0 ? ` in ${seconds}s` : ""}
              </Text>
            </Text>
          </Animated.View>

          {/* Actions */}
          <Animated.View
            entering={FadeInUp.duration(650).delay(350).springify()}
            className="px-6 mt-8 pb-8"
          >
            <PrimaryButton
              title="Continue"
              onPress={onVerify}
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
