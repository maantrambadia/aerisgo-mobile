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
import { getToken } from "../lib/storage";

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

  // Auth bootstrap: check persisted token
  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await getToken();
        if (mounted) setHasToken(Boolean(t));
      } finally {
        if (mounted) setAuthChecked(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && authChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authChecked]);

  const pathname = usePathname();
  const { showNav, activeKey } = useMemo(() => {
    const map = {
      "/home": "home",
      "/tickets": "tickets",
      "/search": "search",
      "/profile": "profile",
    };
    const key = map[pathname] || null;
    return { showNav: Boolean(key), activeKey: key };
  }, [pathname]);

  // Redirect based on auth on route changes
  useEffect(() => {
    if (!authChecked) return;
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (cancelled) return;
      const isAuthRoute =
        pathname === "/" ||
        pathname === "/index" ||
        pathname === "/sign-in" ||
        pathname === "/sign-up" ||
        pathname === "/forgot-password" ||
        pathname === "/verify-otp" ||
        pathname === "/reset-password";
      const isProtectedRoute =
        pathname === "/home" ||
        pathname === "/tickets" ||
        pathname === "/search" ||
        pathname === "/profile";
      if (token && isAuthRoute) {
        router.replace("/home");
      } else if (!token && isProtectedRoute) {
        router.replace("/sign-in");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authChecked, pathname]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeScreen disableBottom={pathname === "/search-results"}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
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
          name="search"
          options={{ animation: "none", gestureEnabled: false }}
        />
        <Stack.Screen
          name="profile"
          options={{ animation: "none", gestureEnabled: false }}
        />
        {/* Search Results */}
        <Stack.Screen
          name="search-results"
          options={{ animation: "slide_from_right" }}
        />
        {/* Auth */}
        <Stack.Screen
          name="(auth)/sign-up"
          options={{
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="(auth)/sign-in"
          options={{
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="(auth)/forgot-password"
          options={{
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="(auth)/verify-otp"
          options={{
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="(auth)/reset-password"
          options={{
            animation: "fade_from_bottom",
          }}
        />
      </Stack>
      {showNav ? (
        <BottomNav
          active={activeKey}
          onPressItem={(key) => {
            if (key === "home") router.replace("/home");
            if (key === "tickets") router.replace("/tickets");
            if (key === "search") router.replace("/search");
            if (key === "profile") router.replace("/profile");
          }}
        />
      ) : null}
      {/* Global Toasts */}
      <ToastHost />
      {/* Animated Splash overlay after native splash */}
      <AnimatedSplash
        visible={
          (fontsLoaded || fontError) && authChecked && showAnimatedSplash
        }
        onFinish={() => setShowAnimatedSplash(false)}
      />
    </SafeScreen>
  );
}
