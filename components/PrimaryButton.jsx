import { TouchableOpacity, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

const PrimaryButton = ({
  title,
  onPress,
  className = "",
  withHaptics = false,
  hapticStyle = "light", // light | medium | heavy | selection
  variant = "primary", // primary | secondary
  leftIconName,
  leftIconColor = "#e3d7cb",
  leftIconSize = 18,
}) => {
  const triggerHaptic = async () => {
    try {
      if (!withHaptics) return;
      if (hapticStyle === "selection") return Haptics.selectionAsync();
      const map = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      await Haptics.impactAsync(
        map[hapticStyle] || Haptics.ImpactFeedbackStyle.Light
      );
    } catch {}
  };

  const containerBase =
    "rounded-full py-4 items-center justify-center flex-row gap-2";
  const variantContainer =
    variant === "secondary"
      ? "bg-secondary border border-primary/10"
      : "bg-primary";
  const textClass = variant === "secondary" ? "text-primary" : "text-secondary";

  return (
    <TouchableOpacity
      onPress={async () => {
        await triggerHaptic();
        onPress && onPress();
      }}
      activeOpacity={0.8}
      className={`${variantContainer} ${containerBase} ${className}`}
    >
      {leftIconName ? (
        <Ionicons
          name={leftIconName}
          size={leftIconSize}
          color={leftIconColor}
        />
      ) : null}
      <Text className={`${textClass} font-urbanist-semibold text-base`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default PrimaryButton;
