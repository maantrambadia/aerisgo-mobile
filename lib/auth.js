import { apiFetch } from "./api";
import {
  setToken,
  clearToken,
  setUserProfile,
  clearUserProfile,
} from "./storage";

export async function signUp({ name, email, phone, password, gender }) {
  return apiFetch("/auth/sign-up", {
    method: "POST",
    auth: false,
    json: { name, email, phone, password, gender },
  });
}

export async function resendOtp({ email }) {
  return apiFetch("/auth/email/otp/resend", {
    method: "POST",
    auth: false,
    json: { email },
  });
}

export async function verifyEmail({ email, code }) {
  const { data } = await apiFetch("/auth/email/verify", {
    method: "POST",
    auth: false,
    json: { email, code },
  });
  if (data?.token) await setToken(data.token);
  if (data?.user) await setUserProfile(data.user);
  return data;
}

export async function signInApp({ email, password, remember = true }) {
  const { data } = await apiFetch("/auth/sign-in/app", {
    method: "POST",
    auth: false,
    json: { email, password, remember },
  });
  if (data?.token) await setToken(data.token);
  if (data?.user) await setUserProfile(data.user);
  return data;
}

export async function signOut() {
  await clearToken();
  await clearUserProfile();
}

// Fetch the currently authenticated user using token (mobile)
export async function fetchMe() {
  const { data } = await apiFetch("/auth/me", { method: "GET", auth: true });
  if (data?.user) await setUserProfile(data.user);
  return data?.user || null;
}

// Password reset flow (App)
export async function requestPasswordReset({ email }) {
  return apiFetch("/auth/password/reset/request", {
    method: "POST",
    auth: false,
    json: { email },
  });
}

export async function resendPasswordResetOtp({ email }) {
  return apiFetch("/auth/password/reset/otp/resend", {
    method: "POST",
    auth: false,
    json: { email },
  });
}

export async function verifyPasswordReset({ email, code }) {
  return apiFetch("/auth/password/reset/verify", {
    method: "POST",
    auth: false,
    json: { email, code },
  });
}

export async function resetPassword({ resetToken, password }) {
  return apiFetch("/auth/password/reset", {
    method: "POST",
    auth: false,
    json: { resetToken, password },
  });
}
