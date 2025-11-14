import { useState, useEffect, useRef, useMemo } from "react";
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
import Animated, {
  FadeInDown,
  FadeInUp,
  Easing,
} from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import PrimaryButton from "../../components/PrimaryButton";
import welcomeLogo from "../../assets/images/welcome-logo.png";
import {
  verifyEmail,
  resendOtp,
  verifyPasswordReset as apiVerifyPasswordReset,
  resendPasswordResetOtp as apiResendPasswordResetOtp,
} from "../../lib/auth";
import { toast } from "../../lib/toast";
import { useAuth } from "../../context/AuthContext";

export default function VerifyOtp() {
  const { login } = useAuth();
  const { email = "", next, mode, autoResend } = useLocalSearchParams();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(30);
  const inputsRef = useRef(Array.from({ length: 6 }, () => null));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);

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

  const onVerify = async () => {
    const emailStr = String(email || "");
    if (!emailStr) {
      toast.warn({ title: "Missing email", message: "Go back and try again" });
      return;
    }
    if (code.length !== 6) {
      toast.warn({
        title: "Incomplete code",
        message: "Enter the 6-digit OTP",
      });
      return;
    }
    setLoading(true);
    try {
      if (mode === "password_reset") {
        const { data } = await apiVerifyPasswordReset({
          email: emailStr,
          code,
        });
        const resetToken = data?.resetToken;
        if (!resetToken) throw new Error("Missing reset token");
        try {
          await Haptics.selectionAsync();
        } catch {}
        toast.success({
          title: "Code verified",
          message: "Set your new password",
        });
        router.replace({
          pathname: "/reset-password",
          params: { email: emailStr, resetToken },
        });
      } else {
        const data = await verifyEmail({ email: emailStr, code });
        // Update AuthContext with user data
        await login(data.user, data.token);
        try {
          await Haptics.selectionAsync();
        } catch {}
        toast.success({
          title: "Email verified",
          message: "Welcome! Taking you to Home",
        });
        // AuthContext will handle redirect to /home
      }
    } catch (e) {
      toast.error({
        title: "Verification failed",
        message: e?.message || "Invalid or expired code",
      });
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (seconds > 0) return;
    const emailStr = String(email || "");
    if (!emailStr) return;
    setResending(true);
    try {
      if (mode === "password_reset") {
        await apiResendPasswordResetOtp({ email: emailStr });
      } else {
        await resendOtp({ email: emailStr });
      }
      try {
        await Haptics.selectionAsync();
      } catch {}
      setSeconds(30);
      toast.info({
        title: "OTP resent",
        message: `We sent a new code to ${maskedEmail}`,
      });
    } catch (e) {
      toast.error({
        title: "Resend failed",
        message: e?.message || "Please try again",
      });
    } finally {
      setResending(false);
    }
  };

  // Auto-send OTP on first arrival when explicitly requested (e.g., after sign-in rejects with not_verified)
  useEffect(() => {
    const emailStr = String(email || "").trim();
    const shouldAuto =
      String(autoResend || "").toLowerCase() === "1" ||
      String(autoResend || "").toLowerCase() === "true";
    if (autoTriggered || !emailStr) return;
    if (mode === "password_reset") return; // do not auto-send for reset flow
    if (!shouldAuto) return;

    let cancelled = false;
    (async () => {
      setResending(true);
      try {
        await resendOtp({ email: emailStr });
        if (!cancelled) {
          setSeconds(30);
          toast.info({
            title: "OTP sent",
            message: `We sent a verification code to ${maskedEmail}`,
          });
        }
      } catch (e) {
        if (!cancelled) {
          toast.error({
            title: "Send failed",
            message: e?.message || "Please try again",
          });
        }
      } finally {
        if (!cancelled) {
          setResending(false);
          setAutoTriggered(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [autoResend, email, maskedEmail, mode, autoTriggered]);

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
                Verify OTP
              </Text>
              <Text className="text-primary opacity-80 font-urbanist-medium mt-2">
                Enter the 6-digit code sent to {maskedEmail}.
              </Text>
            </View>

            {/* OTP Input */}
            <View className="px-6 mt-8 gap-4">
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
                        const clipped = next.map((x) => x.slice(0, 1));
                        setDigits(clipped);
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
            </View>

            {/* Actions */}
            <View className="px-6 mt-8 pb-8">
              <PrimaryButton
                title="Continue"
                onPress={onVerify}
                className="w-full"
                withHaptics
                hapticStyle="medium"
                disabled={loading}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
