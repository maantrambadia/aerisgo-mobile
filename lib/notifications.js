import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { apiFetch } from "./api";

// Optional: set a basic handler so notifications show when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerPushToken() {
  try {
    // Only real devices can receive push notifications
    if (!Device.isDevice) {
      return null;
    }

    // Request permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    // Android: ensure a default notification channel exists
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    // Get Expo projectId from config (for EAS builds)
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResponse?.data;

    if (!token) {
      return null;
    }

    // Register token with backend
    await apiFetch("/notifications/push-tokens", {
      method: "POST",
      json: {
        token,
        platform: Platform.OS === "android" ? "android" : "ios",
      },
    });

    return token;
  } catch (error) {
    console.error("registerPushToken error:", error);
    return null;
  }
}

// Fetch in-app notifications for the current user
export async function getMyNotifications({ limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append("limit", String(limit));

  const { data } = await apiFetch(`/notifications/me?${params.toString()}`, {
    method: "GET",
    auth: true,
  });

  return data?.items || [];
}

// Mark a notification as read (best-effort)
export async function markNotificationRead(id) {
  if (!id) return;

  await apiFetch(`/notifications/${id}/read`, {
    method: "POST",
    auth: true,
  });
}
