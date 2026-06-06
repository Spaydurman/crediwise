import type { ThemeMode } from "@/stores/theme.store";

type ThemeColors = {
  activityIndicator: string;
  statusBarBackground: string;
  statusBarStyle: "light" | "dark";
  tabBarActive: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarInactive: string;
};

const THEME_COLORS: Record<ThemeMode, ThemeColors> = {
  dark: {
    activityIndicator: "#6366f1",
    statusBarBackground: "#020617",
    statusBarStyle: "light",
    tabBarActive: "#6366f1",
    tabBarBackground: "#0f172a",
    tabBarBorder: "#1e293b",
    tabBarInactive: "#64748b",
  },
  light: {
    activityIndicator: "#4f46e5",
    statusBarBackground: "#f8fafc",
    statusBarStyle: "dark",
    tabBarActive: "#4f46e5",
    tabBarBackground: "#ffffff",
    tabBarBorder: "#e2e8f0",
    tabBarInactive: "#64748b",
  },
};

export function getThemeColors(themeMode: ThemeMode) {
  return THEME_COLORS[themeMode];
}