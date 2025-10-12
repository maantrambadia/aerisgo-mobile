import { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

const Dot = ({ delay = 0 }) => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0.3, { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0.3, { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      )
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={dotStyle}>
      <View className="w-3 h-3 rounded-full bg-primary" />
    </Animated.View>
  );
};

export default function Loader({ message, subtitle, fullscreen = true }) {
  const content = (
    <View className="items-center justify-center">
      {/* Modern Dot Spinner */}
      <View className="flex-row gap-3 mb-8">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>

      {/* Loading Text */}
      {message && (
        <Text className="text-primary font-urbanist-semibold text-lg mb-2 text-center">
          {message}
        </Text>
      )}

      {/* Subtitle */}
      {subtitle && (
        <Text className="text-primary/60 font-urbanist text-sm text-center">
          {subtitle}
        </Text>
      )}
    </View>
  );

  if (fullscreen) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        {content}
      </View>
    );
  }

  return content;
}
