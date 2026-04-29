import "../global.css";

import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "@/stores/auth.store";
import { processOAuthCallback } from "@/components/auth/GoogleSignInButton";

WebBrowser.maybeCompleteAuthSession();

const OAUTH_REDIRECT_PREFIX = "crediwise://google-auth";

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  // Handle OAuth deep link when Android cold-starts the app via the redirect URI
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url?.startsWith(OAUTH_REDIRECT_PREFIX)) {
        processOAuthCallback(url).catch(() => null);
      }
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (url?.startsWith(OAUTH_REDIRECT_PREFIX)) {
        processOAuthCallback(url).catch(() => null);
      }
    });

    return () => subscription.remove();
  }, []);

  if (!initialized) {
    return (
      <GestureHandlerRootView className="flex-1 bg-slate-950">
        <StatusBar style="light" backgroundColor="#020617" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <StatusBar style="light" backgroundColor="#020617" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </GestureHandlerRootView>
  );
}
