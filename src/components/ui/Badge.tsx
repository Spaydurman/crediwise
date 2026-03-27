import { Text, View } from "react-native";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANT_CLASSES: Record<BadgeVariant, { container: string; text: string }> = {
  success: { container: "bg-emerald-900/60 border border-emerald-700", text: "text-emerald-400" },
  warning: { container: "bg-amber-900/60 border border-amber-700", text: "text-amber-400" },
  danger: { container: "bg-red-900/60 border border-red-700", text: "text-red-400" },
  info: { container: "bg-indigo-900/60 border border-indigo-700", text: "text-indigo-400" },
  neutral: { container: "bg-slate-800 border border-slate-700", text: "text-slate-400" },
};

export function Badge({ label, variant = "neutral" }: BadgeProps) {
  const { container, text } = VARIANT_CLASSES[variant];
  return (
    <View className={`px-2.5 py-1 rounded-full ${container}`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
