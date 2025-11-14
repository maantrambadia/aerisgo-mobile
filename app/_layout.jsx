import { Stack, usePathname, router } from "expo-router";
import SafeScreen from "../components/SafeScreen";
import { useEffect, useMemo, useState } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import BottomNav from "../components/BottomNav";
import ToastHost from "../components/ToastHost";
import AnimatedSplash from "../components/AnimatedSplash";
import { AuthProvider } from "../context/AuthContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Urbanist-Black": require("../assets/fonts/Urbanist-Black.ttf"),
    "Urbanist-BlackItalic": require("../assets/fonts/Urbanist-BlackItalic.ttf"),
    "Urbanist-Bold": require("../assets/fonts/Urbanist-Bold.ttf"),
    "Urbanist-BoldItalic": require("../assets/fonts/Urbanist-BoldItalic.ttf"),
    "Urbanist-ExtraBold": require("../assets/fonts/Urbanist-ExtraBold.ttf"),
    "Urbanist-ExtraBoldItalic": require("../assets/fonts/Urbanist-ExtraBoldItalic.ttf"),
    "Urbanist-ExtraLight": require("../assets/fonts/Urbanist-ExtraLight.ttf"),
    "Urbanist-ExtraLightItalic": require("../assets/fonts/Urbanist-ExtraLightItalic.ttf"),
    "Urbanist-Italic": require("../assets/fonts/Urbanist-Italic.ttf"),
    "Urbanist-Light": require("../assets/fonts/Urbanist-Light.ttf"),
    "Urbanist-LightItalic": require("../assets/fonts/Urbanist-LightItalic.ttf"),
    "Urbanist-Medium": require("../assets/fonts/Urbanist-Medium.ttf"),
    "Urbanist-MediumItalic": require("../assets/fonts/Urbanist-MediumItalic.ttf"),
    "Urbanist-Regular": require("../assets/fonts/Urbanist-Regular.ttf"),
    "Urbanist-SemiBold": require("../assets/fonts/Urbanist-SemiBold.ttf"),
    "Urbanist-SemiBoldItalic": require("../assets/fonts/Urbanist-SemiBoldItalic.ttf"),
    "Urbanist-Thin": require("../assets/fonts/Urbanist-Thin.ttf"),
    "Urbanist-ThinItalic": require("../assets/fonts/Urbanist-ThinItalic.ttf"),
  });

  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const pathname = usePathname();
  const { showNav, activeKey } = useMemo(() => {
    const map = {
      "/home": "home",
      "/tickets": "tickets",
      "/rewards": "rewards",
      "/profile": "profile",
    };
    const key = map[pathname] || null;
    return { showNav: Boolean(key), activeKey: key };
  }, [pathname]);

  // Auth and navigation protection is now handled by AuthContext

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <SafeScreen
        disableBottom={
          pathname === "/" ||
          pathname === "/search-results" ||
          pathname === "/profile" ||
          pathname === "/rewards" ||
          pathname === "/booking-confirmation" ||
          pathname === "/tickets" ||
          pathname === "/passenger-details" ||
          pathname === "/flight-details" ||
          pathname === "/seat-selection" ||
          pathname === "/notifications" ||
          pathname.startsWith("/check-in/") ||
          pathname.startsWith("/meal-selection/") ||
          pathname.startsWith("/baggage-info/")
        }
      >
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "none",
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
          }}
        >
          {/* Welcome */}
          <Stack.Screen
            name="index"
            options={{ animation: "slide_from_right" }}
          />
          {/* Home */}
          <Stack.Screen
            name="home"
            options={{ animation: "none", gestureEnabled: false }}
          />
          {/* Main Tabs: disable back gesture */}
          <Stack.Screen
            name="tickets"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="rewards"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="profile"
            options={{ animation: "none", gestureEnabled: false }}
          />
          {/* Search Results */}
          <Stack.Screen
            name="search-results"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="flight-details"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="seat-selection"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="notifications"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="booking-confirmation"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="passenger-details"
            options={{ animation: "none", gestureEnabled: false }}
          />
          {/* Profile Screens */}
          <Stack.Screen
            name="edit-profile"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="change-password"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="user-documents"
            options={{ animation: "none", gestureEnabled: false }}
          />
          {/* Check-in & Related Features */}
          <Stack.Screen
            name="check-in/[id]"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="meal-selection/[id]"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="baggage-info/[id]"
            options={{ animation: "none", gestureEnabled: false }}
          />
          {/* Auth */}
          <Stack.Screen
            name="(auth)/sign-up"
            options={{
              animation: "none",
            }}
          />
          <Stack.Screen
            name="(auth)/sign-in"
            options={{
              animation: "none",
            }}
          />
          <Stack.Screen
            name="(auth)/forgot-password"
            options={{
              animation: "none",
            }}
          />
          <Stack.Screen
            name="(auth)/verify-otp"
            options={{
              animation: "none",
            }}
          />
          <Stack.Screen
            name="(auth)/reset-password"
            options={{
              animation: "none",
            }}
          />
        </Stack>
        {showNav ? (
          <BottomNav
            active={activeKey}
            onPressItem={(key) => {
              if (key === "home") router.replace("/home");
              if (key === "tickets") router.replace("/tickets");
              if (key === "rewards") router.replace("/rewards");
              if (key === "profile") router.replace("/profile");
            }}
          />
        ) : null}
        {/* Global Toasts */}
        <ToastHost />
        {/* Animated Splash overlay after native splash */}
        <AnimatedSplash
          visible={(fontsLoaded || fontError) && showAnimatedSplash}
          onFinish={() => setShowAnimatedSplash(false)}
        />
      </SafeScreen>
    </AuthProvider>
  );
}
