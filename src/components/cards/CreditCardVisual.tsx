import { Text, View } from "react-native";
import { CARD_COLOR_BG_MAP, CURRENCY } from "../../constants";
import { useThemeStore } from "../../stores/theme.store";
import type { CreditCard } from "../../types";

interface CreditCardVisualProps {
  card: CreditCard;
  totalSpending?: number;
}

export function CreditCardVisual({
  card,
  totalSpending = 0,
}: CreditCardVisualProps) {
  const isDark = useThemeStore((state) => state.themeMode === "dark");
  const bgClass = CARD_COLOR_BG_MAP[card.color];
  const usagePercent =
    card.credit_limit > 0
      ? Math.min((totalSpending / card.credit_limit) * 100, 100)
      : 0;

  return (
    <View className={`rounded-2xl overflow-hidden ${isDark ? bgClass : "bg-white border border-slate-200"}`}>
      <View className={`h-1.5 ${bgClass}`} />
      <View className="p-5 gap-4">
      <View className="flex-row items-start justify-between">
        <View className="gap-0.5">
          <Text className="text-slate-500 dark:text-white/70 text-xs font-medium uppercase tracking-widest">
            {card.bank}
          </Text>
          <Text className="text-slate-950 dark:text-white text-base font-bold">{card.name}</Text>
        </View>
        <View className="bg-slate-100 dark:bg-white/20 rounded-lg px-2.5 py-1 border border-slate-200 dark:border-transparent">
          <Text className="text-slate-700 dark:text-white text-xs font-semibold">CREDIT</Text>
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-slate-500 dark:text-white/60 text-xs">Card Number</Text>
        <Text className="text-slate-950 dark:text-white text-base font-mono tracking-widest">
          •••• •••• •••• {card.last_four_digits ?? "••••"}
        </Text>
      </View>

      <View className="gap-2">
        <View className="flex-row justify-between">
          <View className="gap-0.5">
            <Text className="text-slate-500 dark:text-white/60 text-xs">Spent</Text>
            <Text className="text-slate-950 dark:text-white text-sm font-bold">
              {CURRENCY}
              {totalSpending.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View className="gap-0.5 items-end">
            <Text className="text-slate-500 dark:text-white/60 text-xs">Credit Limit</Text>
            <Text className="text-slate-950 dark:text-white text-sm font-bold">
              {CURRENCY}
              {card.credit_limit.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>
        <View className="h-1.5 bg-slate-200 dark:bg-white/20 rounded-full overflow-hidden">
          <View
            className="h-full bg-slate-700 dark:bg-white/80 rounded-full"
            style={{ width: `${usagePercent}%` }}
          />
        </View>
        <Text className="text-slate-500 dark:text-white/60 text-xs">
          {usagePercent.toFixed(0)}% of limit used • Billing day:{" "}
          {card.billing_cycle_date}
        </Text>
      </View>
      </View>
    </View>
  );
}
