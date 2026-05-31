import { Ionicons } from "@expo/vector-icons";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth.store";

const REDIRECT_URI = "crediwise://google-auth";

async function syncAuthSession(): Promise<Session | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  useAuthStore.getState().setAuth(session?.user ?? null, session);

  return session;
}

async function processOAuthCallback(url: string): Promise<Session | null> {
  const parsedUrl = new URL(url);

  const code = parsedUrl.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return syncAuthSession();
  }

  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
  const access_token =
    hashParams.get("access_token") ??
    parsedUrl.searchParams.get("access_token");
  const refresh_token =
    hashParams.get("refresh_token") ??
    parsedUrl.searchParams.get("refresh_token");

  if (!access_token || !refresh_token) {
    throw new Error("Missing session tokens from Google");
  }

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;

  return syncAuthSession();
}

export { processOAuthCallback };

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onGoogleSignIn = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: REDIRECT_URI,
          skipBrowserRedirect: true,
          queryParams: { prompt: "consent" },
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("Missing Google OAuth URL");

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        REDIRECT_URI,
        { showInRecents: true }
      );

      if (result.type !== "success") return;

      const session = await processOAuthCallback(result.url);

      if (session?.user) {
        router.replace("/(tabs)");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      Alert.alert("Google Sign In Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={onGoogleSignIn}
      disabled={loading}
      className={`
        flex-row items-center justify-center gap-3
        w-full rounded-xl border border-slate-700 bg-slate-800
        px-6 py-4 active:bg-slate-700
        ${loading ? "opacity-50" : ""}
      `}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#94a3b8" />
      ) : (
        <Ionicons name="logo-google" size={20} color="#e2e8f0" />
      )}
      <Text className="text-lg font-semibold text-slate-100">
        {loading ? "Connecting..." : "Continue with Google"}
      </Text>
    </Pressable>
  );
}
