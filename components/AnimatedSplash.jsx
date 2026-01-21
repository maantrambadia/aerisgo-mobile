import { useEffect, useRef } from "react";
import { View, Image, Dimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "../constants/colors";

const SPLASH_VISIBLE_MS = 1600; // time before fade-out starts
const FADE_OUT_MS = 240; // fade duration
const PLANE_COUNT = 6; // 3 original + 3 more airplanes

// Reusable plane that flies horizontally with gentle Y wobble and pulsing contrail
function FlyByPlane({
  visible,
  topPct,
  size,
  trail,
  delayMs = 0,
  durationMs = 900,
  planeOpacityBase = 0.8,
}) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
    Dimensions.get("window");
  const x = useSharedValue(-(trail + size + 40));
  const y = useSharedValue(0);
  const o = useSharedValue(0);
  const trailO = useSharedValue(0.35);

  useEffect(() => {
    if (!visible) return;
    o.value = withDelay(
      delayMs,
      withTiming(planeOpacityBase, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      }),
    );
    // Ensure each plane ends before splash overlay fades: use per-plane duration
    const d = Math.max(520, durationMs);
    x.value = withDelay(
      delayMs,
      withTiming(SCREEN_WIDTH + 40, { duration: d, easing: Easing.linear }),
    );
    // Split wobble durations proportionally (approx 39% / 39% / 22%)
    const d1 = Math.round(d * 0.39);
    const d2 = Math.round(d * 0.39);
    const d3 = Math.max(120, d - d1 - d2);
    y.value = withDelay(
      delayMs,
      withSequence(
        withTiming(-10, { duration: d1, easing: Easing.inOut(Easing.quad) }),
        withTiming(6, { duration: d2, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: d3, easing: Easing.inOut(Easing.quad) }),
      ),
    );
    trailO.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(0.7, { duration: 450, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      ),
    );
  }, [visible]);

  const groupStyle = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));
  const contrailStyle = useAnimatedStyle(() => ({ opacity: trailO.value }));

  const topPx = Math.round((SCREEN_HEIGHT * topPct) / 100);
  return (
    <Animated.View style={[{ position: "absolute", top: topPx }, groupStyle]}>
      <Animated.View
        style={[
          {
            position: "absolute",
            left: -trail,
            top: size * 0.5 - 0.5,
            width: trail,
            height: 1,
            backgroundColor: "rgba(255,255,255,0.6)",
          },
          contrailStyle,
        ]}
      />
      <Image
        source={require("../assets/images/airplane.png")}
        style={{
          width: size,
          height: size,
          resizeMode: "contain",
          opacity: planeOpacityBase,
        }}
      />
    </Animated.View>
  );
}

export default function AnimatedSplash({ visible, onFinish }) {
  const opacity = useSharedValue(1);
  const logoScale = useSharedValue(0.92);
  const blob2 = useSharedValue(0);
  const bar = useSharedValue(0);
  // Precompute randomized plane configs once per mount
  const planeConfigsRef = useRef(null);
  if (!planeConfigsRef.current) {
    const sizes = [56, 48, 40, 34, 28, 24];
    const trails = [90, 80, 70, 60, 50, 40];
    const opacities = [0.85, 0.8, 0.75, 0.7, 0.6, 0.55];
    planeConfigsRef.current = Array.from({ length: PLANE_COUNT }, (_, i) => {
      const size = sizes[i % sizes.length];
      const trail = trails[i % trails.length];
      const baseTop = 24 + i * 7; // distribute from ~24% to ~59%
      const jitter = Math.random() * 4 - 2; // -2% .. +2%
      const topPct = baseTop + jitter;
      const delayMs = i * 180 + Math.floor(Math.random() * 120);
      const planeOpacityBase = opacities[i % opacities.length];
      // Ensure each plane finishes before overlay fade (uses extended window)
      const totalWindow = SPLASH_VISIBLE_MS - 80;
      const available = Math.max(400, totalWindow - delayMs);
      const durationMs = Math.max(520, Math.min(available, 1400)); // slower, but guaranteed to finish
      return { size, trail, topPct, delayMs, durationMs, planeOpacityBase };
    });
  }

  useEffect(() => {
    if (!visible) return;

    // Fade in container
    opacity.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });

    // Logo micro-bounce + breathing
    logoScale.value = withSequence(
      withTiming(1.02, { duration: 380, easing: Easing.out(Easing.cubic) }),
      withTiming(1.0, { duration: 260, easing: Easing.inOut(Easing.cubic) }),
    );

    // Floating blob (single)
    blob2.value = withDelay(
      120,
      withSequence(
        withTiming(-8, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
    );

    // (shimmer removed)

    // Progress bar sweep (match extended splash window)
    bar.value = withTiming(100, {
      duration: SPLASH_VISIBLE_MS - 120,
      easing: Easing.out(Easing.cubic),
    });

    // (airplanes handled by FlyByPlane components)

    // Finish after extended duration with fade-out
    let t2;
    const t1 = setTimeout(() => {
      opacity.value = withTiming(0, {
        duration: FADE_OUT_MS,
        easing: Easing.inOut(Easing.cubic),
      });
      t2 = setTimeout(() => onFinish?.(), FADE_OUT_MS + 10);
    }, SPLASH_VISIBLE_MS);

    return () => {
      clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));
  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: blob2.value }],
  }));
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value}%` }));
  // shimmer style removed

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: COLORS.background,
            alignItems: "center",
            justifyContent: "center",
          },
          containerStyle,
        ]}
      >
        {/* airplanes: landing-page style horizontal fly-by with contrail, behind logo */}
        {planeConfigsRef.current.map((cfg, idx) => (
          <FlyByPlane key={idx} visible={visible} {...cfg} />
        ))}

        {/* logo */}
        <Animated.View style={[{ alignItems: "center" }, logoStyle]}>
          <View
            style={{
              width: 170,
              height: 170,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <Image
              source={require("../assets/images/welcome-logo.png")}
              style={{ width: 170, height: 170, resizeMode: "contain" }}
            />
          </View>
        </Animated.View>

        {/* micro progress indicator */}
        <View style={{ position: "absolute", bottom: 56, width: 160 }}>
          <View
            style={{
              height: 4,
              backgroundColor: "#ffffff50",
              borderRadius: 999,
            }}
          />
          <Animated.View
            style={[
              {
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                backgroundColor: COLORS.primary,
                borderRadius: 999,
              },
              barStyle,
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}
