import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View className="flex-1 bg-slate-950 items-center justify-center gap-4">
        <Text className="text-white text-xl font-bold">Page Not Found</Text>
        <Link href="/(tabs)" className="text-indigo-400 text-base">
          Go to Dashboard
        </Link>
      </View>
    </>
  );
}
