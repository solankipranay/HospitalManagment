import "../global.css";
import { useEffect } from "react";
import { useRouter, useSegments, Slot } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

function RootLayoutNav() {
  const { token, role, isLoading, loadAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadAuth();
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
        <RootLayoutNav />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
