import { Stack, usePathname, router } from "expo-router";
import SafeScreen from "../components/SafeScreen";
import { useEffect, useMemo } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import BottomNav from "../components/BottomNav";

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
      "/search": "search",
      "/profile": "profile",
    };
    const key = map[pathname] || null;
    return { showNav: Boolean(key), activeKey: key };
  }, [pathname]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeScreen>
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
    </SafeScreen>
  );
}
