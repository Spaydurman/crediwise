import "../global.css";

import { useEffect } from "react";
import { useSegments, useRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/stores/auth.store";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, initialized, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView className="flex-1">
      <StatusBar style="light" backgroundColor="#020617" />
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthGuard>
    </GestureHandlerRootView>
  );
}
