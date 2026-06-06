import { ActivityIndicator, Pressable, Text } from "react-native";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: "bg-indigo-600 active:bg-indigo-700",
    text: "text-white font-semibold",
  },
  secondary: {
    container:
      "bg-slate-200 active:bg-slate-300 border border-slate-300 dark:bg-slate-700 dark:active:bg-slate-600 dark:border-slate-600",
    text: "text-slate-900 dark:text-slate-100 font-semibold",
  },
  danger: {
    container: "bg-red-600 active:bg-red-700",
    text: "text-white font-semibold",
  },
  ghost: {
    container: "bg-transparent active:bg-slate-100 dark:active:bg-slate-800",
    text: "text-indigo-600 dark:text-indigo-400 font-semibold",
  },
};

const SIZE_CLASSES: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: "px-3 py-2 rounded-lg", text: "text-sm" },
  md: { container: "px-5 py-3 rounded-xl", text: "text-base" },
  lg: { container: "px-6 py-4 rounded-xl", text: "text-lg" },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const { container, text } = VARIANT_CLASSES[variant];
  const { container: sizeContainer, text: sizeText } = SIZE_CLASSES[size];
  const isDisabled = disabled || loading;
  const loadingColor =
    variant === "primary" || variant === "danger" ? "#ffffff" : "#4f46e5";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`
        flex-row items-center justify-center gap-2
        ${container} ${sizeContainer}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-50" : ""}
      `}
    >
      {loading && <ActivityIndicator size="small" color={loadingColor} />}
      <Text className={`${text} ${sizeText}`}>{label}</Text>
    </Pressable>
  );
}
