import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  description,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-8 gap-4">
      <View className="w-20 h-20 rounded-full bg-slate-800 items-center justify-center">
        <Ionicons name={icon} size={36} color="#6366f1" />
      </View>
      <View className="items-center gap-1">
        <Text className="text-white text-lg font-semibold text-center">
          {title}
        </Text>
        {description && (
          <Text className="text-slate-400 text-sm text-center leading-5">
            {description}
          </Text>
        )}
      </View>
    </View>
  );
}
