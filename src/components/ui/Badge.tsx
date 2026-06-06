import { Text, View } from "react-native";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANT_CLASSES: Record<BadgeVariant, { container: string; text: string }> = {
  success: {
    container: "bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/60 dark:border-emerald-700",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  warning: {
    container: "bg-amber-50 border border-amber-200 dark:bg-amber-900/60 dark:border-amber-700",
    text: "text-amber-700 dark:text-amber-400",
  },
  danger: {
    container: "bg-red-50 border border-red-200 dark:bg-red-900/60 dark:border-red-700",
    text: "text-red-700 dark:text-red-400",
  },
  info: {
    container: "bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/60 dark:border-indigo-700",
    text: "text-indigo-700 dark:text-indigo-400",
  },
  neutral: {
    container: "bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700",
    text: "text-slate-700 dark:text-slate-400",
  },
};

export function Badge({ label, variant = "neutral" }: BadgeProps) {
  const { container, text } = VARIANT_CLASSES[variant];
  return (
    <View className={`px-2.5 py-1 rounded-full ${container}`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
