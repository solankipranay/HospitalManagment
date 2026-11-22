import "../global.css";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useRouter, useSegments, Slot } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PWAInstallBanner } from "../components/PWAInstallBanner";

function RootLayoutNav() {
  const { token, role, isLoading, loadAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadAuth();

    // PWA Setup for Web: Link manifest and register service worker
    if (Platform.OS === "web" && typeof document !== "undefined") {
      // 1. Inject Manifest
      if (!document.querySelector('link[rel="manifest"]')) {
        const manifestLink = document.createElement("link");
        manifestLink.rel = "manifest";
        manifestLink.href = "/manifest.json";
        document.head.appendChild(manifestLink);
      }

      // 2. Inject Theme Color
      if (!document.querySelector('meta[name="theme-color"]')) {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = "#0066CC";
        document.head.appendChild(meta);
      }

      // 3. Inject Apple Touch Icon
      if (!document.querySelector('link[rel="apple-touch-icon"]')) {
        const appleIcon = document.createElement("link");
        appleIcon.rel = "apple-touch-icon";
        appleIcon.href = "/icon-192.png";
        document.head.appendChild(appleIcon);
      }

      // 4. Register Service Worker
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("CarePulse PWA Service Worker registered:", reg.scope);
          })
          .catch((err) => {
            console.warn("Service Worker registration failed:", err);
          });
      }
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === "(auth)";

    if (!token && !inAuth) {
      router.replace("/(auth)/login");
    } else if (token && inAuth) {
      if (role === "doctor") {
        router.replace("/(doctor)/dashboard");
      } else {
        router.replace("/(patient)/home");
      }
    }
  }, [token, role, isLoading]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <PWAInstallBanner />
        <RootLayoutNav />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
