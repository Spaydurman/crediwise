import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CARD_COLOR_BG_MAP, CURRENCY } from "@/constants";
import { useCards } from "@/hooks/useCards";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuthStore } from "@/stores/auth.store";
import type { CreditCard } from "@/types";

function StatCard({
  label,
  value,
  subtitle,
  accent,
}: {
  label: string;
  value: string;
  subtitle?: string;
  accent: string;
}) {
  return (
    <View className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 gap-1">
      <Text className="text-slate-500 text-xs font-medium">{label}</Text>
      <Text className={`text-xl font-bold ${accent}`}>{value}</Text>
      {subtitle && (
        <Text className="text-slate-600 text-xs">{subtitle}</Text>
      )}
    </View>
  );
}

function CardSummaryItem({ card, spending, saved, remaining }: {
  card: CreditCard;
  spending: number;
  saved: number;
  remaining: number;
}) {
  const bgClass = CARD_COLOR_BG_MAP[card.color];
  const progressPercent =
    card.credit_limit > 0
      ? Math.min((spending / card.credit_limit) * 100, 100)
      : 0;

  return (
    <Pressable
      onPress={() => router.push("/(tabs)/transactions")}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 gap-3 active:bg-slate-800"
    >
      <View className="flex-row items-center gap-3">
        <View className={`${bgClass} w-10 h-10 rounded-xl items-center justify-center`}>
          <Ionicons name="card-outline" size={18} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold text-sm">{card.name}</Text>
          <Text className="text-slate-500 text-xs">{card.bank}</Text>
        </View>
        <View className="items-end">
          <Text className="text-white font-bold text-sm">
            {CURRENCY}
            {spending.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
          <Text className="text-slate-500 text-xs">
            of {CURRENCY}
            {card.credit_limit.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      <View className="gap-1">
        <View className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${bgClass}`}
            style={{ width: `${progressPercent}%` }}
          />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-emerald-400 text-xs">
            Saved: {CURRENCY}
            {saved.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
          <Text className="text-amber-400 text-xs">
            Shortage: {CURRENCY}
            {remaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { user, signOut } = useAuthStore();
  const { cards } = useCards();
  const { transactions, totalSpending, totalSaved, totalRemaining } =
    useTransactions();

  const fullyPaidCount = transactions.filter((t) => t.is_fully_saved).length;
  const pendingCount = transactions.filter((t) => !t.is_fully_saved).length;

  const cardMetrics = cards.map((card) => {
    const cardTxns = transactions.filter((t) => t.card_id === card.id);
    const spending = cardTxns.reduce((s, t) => s + t.amount, 0);
    const saved = cardTxns.reduce((s, t) => s + (t.total_saved ?? 0), 0);
    const remaining = cardTxns.reduce((s, t) => s + (t.remaining ?? t.amount), 0);
    return { card, spending, saved, remaining };
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6"
      >
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <View className="gap-0.5">
            <Text className="text-slate-400 text-sm">Good day,</Text>
            <Text className="text-white text-xl font-bold" numberOfLines={1}>
              {user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "User"}
            </Text>
          </View>
          <Pressable
            onPress={signOut}
            className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl items-center justify-center active:bg-slate-800"
          >
            <Ionicons name="log-out-outline" size={20} color="#94a3b8" />
          </Pressable>
        </View>

        <View className="px-5 py-3">
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 gap-4">
            <Text className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              Overall Summary
            </Text>
            <View className="gap-1">
              <Text className="text-slate-500 text-sm">Total Credit Card Spending</Text>
              <Text className="text-white text-4xl font-bold">
                {CURRENCY}
                {totalSpending.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="h-px bg-slate-800" />
            <View className="flex-row gap-3">
              <StatCard
                label="Total Saved"
                value={`${CURRENCY}${totalSaved.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                accent="text-emerald-400"
                subtitle={`${fullyPaidCount} transactions`}
              />
              <StatCard
                label="Still Short"
                value={`${CURRENCY}${totalRemaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                accent="text-amber-400"
                subtitle={`${pendingCount} transactions`}
              />
            </View>
          </View>
        </View>

        <View className="px-5 pt-2 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-base font-bold">My Cards</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/cards")}
              className="active:opacity-70"
            >
              <Text className="text-indigo-400 text-sm font-medium">
                Manage →
              </Text>
            </Pressable>
          </View>

          {cardMetrics.length === 0 ? (
            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-6 items-center gap-3">
              <Ionicons name="card-outline" size={32} color="#4f46e5" />
              <Text className="text-slate-400 text-sm text-center">
                No cards yet. Add your first credit card to start tracking.
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/cards")}
                className="bg-indigo-600 px-4 py-2 rounded-xl active:bg-indigo-700"
              >
                <Text className="text-white text-sm font-semibold">
                  Add Card
                </Text>
              </Pressable>
            </View>
          ) : (
            cardMetrics.map(({ card, spending, saved, remaining }) => (
              <CardSummaryItem
                key={card.id}
                card={card}
                spending={spending}
                saved={saved}
                remaining={remaining}
              />
            ))
          )}
        </View>

        {transactions.length > 0 && (
          <View className="px-5 pt-5 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-base font-bold">
                Recent Transactions
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/transactions")}
                className="active:opacity-70"
              >
                <Text className="text-indigo-400 text-sm font-medium">
                  See all →
                </Text>
              </Pressable>
            </View>

            {transactions.slice(0, 3).map((txn) => (
              <Pressable
                key={txn.id}
                onPress={() => router.push("/(tabs)/transactions")}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex-row items-center gap-3 active:bg-slate-800"
              >
                <View
                  className={`${CARD_COLOR_BG_MAP[txn.credit_card?.color ?? "indigo"]} w-9 h-9 rounded-xl items-center justify-center`}
                >
                  <Ionicons name="receipt-outline" size={16} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-medium" numberOfLines={1}>
                    {txn.description}
                  </Text>
                  <Text className="text-slate-500 text-xs">
                    {txn.credit_card?.bank}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-white text-sm font-bold">
                    {CURRENCY}
                    {txn.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </Text>
                  <Text
                    className={`text-xs font-medium ${
                      txn.is_fully_saved
                        ? "text-emerald-400"
                        : txn.total_saved! > 0
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {txn.is_fully_saved
                      ? "Saved ✓"
                      : txn.total_saved! > 0
                      ? "Partial"
                      : "Not yet"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
