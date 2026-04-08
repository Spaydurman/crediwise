import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Pressable, Text, View } from "react-native";
import { DATE_FORMAT } from "../../constants";
import type { BillingGroup } from "./types";

interface NotificationPopupProps {
  overdueGroups: BillingGroup[];
  dueSoonGroups: BillingGroup[];
  onClose: () => void;
}

export function NotificationPopup({
  overdueGroups,
  dueSoonGroups,
  onClose,
}: NotificationPopupProps) {
  const hasAlerts = overdueGroups.length > 0 || dueSoonGroups.length > 0;
  if (!hasAlerts) return null;

  return (
    <>
      <Pressable className="absolute inset-0 z-40" onPress={onClose} />
      <View
        className="absolute right-5 z-50 w-72 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden"
        style={{ top: 68 }}
      >
        <View className="px-4 py-3 border-b border-slate-800 flex-row items-center justify-between">
          <Text className="text-white text-sm font-bold">Notifications</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={16} color="#64748b" />
          </Pressable>
        </View>

        {overdueGroups.map((g) => (
          <View
            key={g.key}
            className="px-4 py-3 border-b border-slate-800/60 flex-row items-start gap-3"
          >
            <Ionicons name="alert-circle" size={16} color="#f87171" />
            <View className="flex-1 gap-0.5">
              <Text className="text-white text-xs font-semibold">
                {g.card.bank} — {g.card.name}
              </Text>
              <Text className="text-red-400 text-xs">
                Overdue · Due {format(g.billingDate, DATE_FORMAT)}
              </Text>
            </View>
          </View>
        ))}

        {dueSoonGroups.map((g) => (
          <View
            key={g.key}
            className="px-4 py-3 border-b border-slate-800/60 flex-row items-start gap-3"
          >
            <Ionicons name="warning" size={16} color="#fbbf24" />
            <View className="flex-1 gap-0.5">
              <Text className="text-white text-xs font-semibold">
                {g.card.bank} — {g.card.name}
              </Text>
              <Text className="text-amber-400 text-xs">
                Due soon · {format(g.billingDate, DATE_FORMAT)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}
