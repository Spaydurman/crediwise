import { forwardRef } from "react";
import { Text, TextInput, type TextInputProps, View } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <View className="gap-1.5">
        {label && (
          <Text className="text-slate-700 text-sm font-medium dark:text-slate-300">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          placeholderTextColor="#94a3b8"
          className={`
            bg-white dark:bg-slate-800 border rounded-xl px-4 py-3.5
            text-slate-950 dark:text-white text-base
            ${error ? "border-red-500" : "border-slate-300 dark:border-slate-700"}
            ${className ?? ""}
          `}
          {...props}
        />
        {error && (
          <Text className="text-red-500 dark:text-red-400 text-xs">{error}</Text>
        )}
        {hint && !error && (
          <Text className="text-slate-500 text-xs">{hint}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";
