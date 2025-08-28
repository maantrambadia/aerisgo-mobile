import * as SecureStore from "expo-secure-store";

export const AUTH_TOKEN_KEY = "auth_token";

export async function setToken(token) {
  if (token) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  }
}

export async function getToken() {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch {}
}

// Persist minimal user profile for quick access in the app (e.g., Home/Profile screens)
export const USER_PROFILE_KEY = "user_profile";

export async function setUserProfile(profile) {
  try {
    if (profile) {
      await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(profile));
    } else {
      await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
    }
  } catch {}
}

export async function getUserProfile() {
  try {
    const raw = await SecureStore.getItemAsync(USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearUserProfile() {
  try {
    await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
  } catch {}
}
