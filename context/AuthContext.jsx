import { createContext, useContext, useState, useEffect } from "react";
import { router, useSegments } from "expo-router";
import {
  getToken,
  getUserProfile,
  clearToken,
  clearUserProfile,
} from "../lib/storage";
import { fetchMe } from "../lib/auth";
import { setAuthErrorHandler } from "../lib/api";
import { registerPushToken } from "../lib/notifications";

const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();

  // Set global 401 error handler
  useEffect(() => {
    setAuthErrorHandler(() => {
      // This will be called when any API returns 401
      setUser(null);
      router.replace("/(auth)/sign-in");
    });
  }, []);

  // Initialize auth state on app startup
  useEffect(() => {
    initializeAuth();
  }, []);

  // Protect routes on navigation
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const currentPath = `/${segments.join("/")}`;

    // Define protected routes
    const protectedRoutes = [
      "/home",
      "/tickets",
      "/rewards",
      "/profile",
      "/search-results",
      "/flight-details",
      "/seat-selection",
      "/passenger-details",
      "/booking-confirmation",
      "/edit-profile",
      "/change-password",
      "/user-documents",
    ];

    const isProtectedRoute =
      protectedRoutes.includes(currentPath) ||
      currentPath.startsWith("/check-in/") ||
      currentPath.startsWith("/meal-selection/") ||
      currentPath.startsWith("/baggage-info/");

    const isAuthRoute =
      currentPath === "/" || currentPath === "/index" || inAuthGroup;

    // Redirect logic
    if (!user && isProtectedRoute) {
      // User not authenticated, redirect to sign-in
      router.replace("/(auth)/sign-in");
    } else if (user && isAuthRoute) {
      // User authenticated, redirect to home
      router.replace("/home");
    }
  }, [user, segments, isLoading]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();

      if (!token) {
        // No token, user not authenticated
        setUser(null);
        return;
      }

      // Verify token with backend
      try {
        const userData = await fetchMe();

        if (userData) {
          // Token valid, user authenticated
          setUser(userData);

          // Best-effort: register push token for this user
          try {
            await registerPushToken();
          } catch (pushError) {
            console.error("Failed to register push token on init:", pushError);
          }
        } else {
          // Token invalid or expired
          await clearAuth();
        }
      } catch (error) {
        // API error (401, network, etc.)
        console.error("Auth verification failed:", error);

        if (error.status === 401) {
          // Token expired or invalid
          await clearAuth();
        } else {
          // Network error - use cached user profile
          const cachedUser = await getUserProfile();
          if (cachedUser) {
            setUser(cachedUser);
          } else {
            await clearAuth();
          }
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = async () => {
    await clearToken();
    await clearUserProfile();
    setUser(null);
  };

  const login = async (userData, token) => {
    setUser(userData);

    // Best-effort: register push token right after login
    try {
      await registerPushToken();
    } catch (pushError) {
      console.error("Failed to register push token after login:", pushError);
    }
  };

  const logout = async () => {
    await clearAuth();
    router.replace("/(auth)/sign-in");
  };

  const refreshUser = async () => {
    try {
      const userData = await fetchMe();
      if (userData) {
        setUser(userData);
      } else {
        await logout();
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      if (error.status === 401) {
        await logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
