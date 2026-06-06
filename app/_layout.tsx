import "../global.css";

import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as WebBrowser from "expo-web-browser";
import { getThemeColors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);
  const themeMode = useThemeStore((s) => s.themeMode);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const themeColors = getThemeColors(themeMode);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  if (!initialized || !themeHydrated) {
    return (
      <GestureHandlerRootView
        className={`flex-1 ${themeMode === "dark" ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <StatusBar
          style={themeColors.statusBarStyle}
          backgroundColor={themeColors.statusBarBackground}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.activityIndicator} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView
      className={`flex-1 ${themeMode === "dark" ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <StatusBar
        style={themeColors.statusBarStyle}
        backgroundColor={themeColors.statusBarBackground}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}
