import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore, type ThemeMode } from "@/stores/theme.store";

const THEME_OPTIONS: Array<{
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  mode: ThemeMode;
}> = [
  {
    description: "Bright surfaces and darker text for daylight use.",
    icon: "sunny-outline",
    label: "Light Mode",
    mode: "light",
  },
  {
    description: "Deep contrast for evening use and reduced glare.",
    icon: "moon-outline",
    label: "Dark Mode",
    mode: "dark",
  },
];

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const themeMode = useThemeStore((state) => state.themeMode);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      router.replace("/(auth)/login");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-4 pb-8 gap-6"
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white active:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800"
          >
            <Ionicons name="chevron-back" size={20} color="#64748b" />
          </Pressable>
          <View className="items-end">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Preferences
            </Text>
            <Text className="text-2xl font-bold text-slate-950 dark:text-white">
              Settings
            </Text>
          </View>
        </View>

        <View className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <Text className="text-xs font-semibold uppercase tracking-[2px] text-slate-500 dark:text-slate-400">
            Account
          </Text>
          <View className="mt-4 flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-500/15">
              <Ionicons name="person-outline" size={24} color="#4f46e5" />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-slate-950 dark:text-white">
                {user?.user_metadata?.full_name ?? "CrediWise User"}
              </Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">
                {user?.email ?? "No email available"}
              </Text>
            </View>
          </View>
        </View>

        <View className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <View className="gap-1">
            <Text className="text-xs font-semibold uppercase tracking-[2px] text-slate-500 dark:text-slate-400">
              Appearance
            </Text>
            <Text className="text-base font-semibold text-slate-950 dark:text-white">
              Choose your app theme
            </Text>
            <Text className="text-sm leading-6 text-slate-500 dark:text-slate-400">
              Switch between light and dark mode anytime. Your choice stays saved on this device.
            </Text>
          </View>

          <View className="mt-4 gap-3">
            {THEME_OPTIONS.map((option) => {
              const selected = option.mode === themeMode;

              return (
                <Pressable
                  key={option.mode}
                  onPress={() => setThemeMode(option.mode)}
                  className={`rounded-2xl border p-4 active:opacity-90 ${
                    selected
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                      : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`h-11 w-11 items-center justify-center rounded-2xl ${
                        selected
                          ? "bg-indigo-600"
                          : "bg-white dark:bg-slate-900"
                      }`}
                    >
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={selected ? "#ffffff" : "#64748b"}
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <View className="flex-row items-center justify-between gap-3">
                        <Text
                          className={`text-base font-semibold ${
                            selected
                              ? "text-indigo-700 dark:text-indigo-300"
                              : "text-slate-950 dark:text-white"
                          }`}
                        >
                          {option.label}
                        </Text>
                        {selected ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#4f46e5"
                          />
                        ) : null}
                      </View>
                      <Text className="text-sm leading-5 text-slate-500 dark:text-slate-400">
                        {option.description}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/20">
          <View className="gap-1">
            <Text className="text-xs font-semibold uppercase tracking-[2px] text-red-500 dark:text-red-300">
              Session
            </Text>
            <Text className="text-base font-semibold text-slate-950 dark:text-white">
              Sign out of your account
            </Text>
            <Text className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              You can sign back in anytime with your email or Google account.
            </Text>
          </View>

          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 active:bg-red-700 disabled:opacity-70"
          >
            {signingOut ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="log-out-outline" size={18} color="#ffffff" />
            )}
            <Text className="text-sm font-semibold text-white">
              {signingOut ? "Signing Out..." : "Log Out"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}