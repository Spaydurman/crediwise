import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center gap-4">
        <Text className="text-slate-950 text-xl font-bold dark:text-white">
          Page Not Found
        </Text>
        <Link href="/(tabs)" className="text-indigo-600 dark:text-indigo-400 text-base">
          Go to Dashboard
        </Link>
      </View>
    </>
  );
}
