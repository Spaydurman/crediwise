import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CARD_PRODUCTS, getCardProduct } from "../../constants/cardProducts";
import { getCardImageUrl } from "../../constants/cardImages";
import { getPhilippineBank } from "../../constants/philippineBanks";
import { Input } from "../ui/Input";
import { IssuerCardImage } from "./IssuerCardImage";

interface CardProductSelectProps {
  bank: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function CardProductSelect({ bank, value, onChange, error }: CardProductSelectProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const bankId = getPhilippineBank(bank)?.id;
  const products = bankId ? CARD_PRODUCTS[bankId] ?? [] : [];
  const selected = getCardProduct(bankId, value);
  const isCustom = custom || (Boolean(value) && !selected);

  if (!bankId) return null;

  return (
    <View className="gap-1.5">
      <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium">Card</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose a card"
        onPress={() => setOpen(!open)}
        className={`flex-row items-center justify-between rounded-xl border bg-white dark:bg-slate-800 px-4 py-3.5 ${error ? "border-red-500" : "border-slate-300 dark:border-slate-700"}`}
      >
        <Text className={value || isCustom ? "text-slate-950 dark:text-white text-base" : "text-slate-400 text-base"}>
          {selected?.name ?? (isCustom ? "Other card" : "Select your card")}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color="#94a3b8" />
      </Pressable>
      {open && (
        <ScrollView className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" style={{ maxHeight: 220 }} nestedScrollEnabled>
          {products.map((product) => (
            <Pressable
              key={product.name}
              onPress={() => { onChange(product.name); setCustom(false); setOpen(false); }}
              className="flex-row items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700"
            >
              <View className="w-6 h-6 rounded-md" style={{ backgroundColor: product.background, borderColor: product.accent, borderWidth: 2 }} />
              <Text className="text-slate-950 dark:text-white text-sm flex-1">{product.name}</Text>
              {selected?.name === product.name && <Ionicons name="checkmark" size={18} color="#6366f1" />}
            </Pressable>
          ))}
          <Pressable onPress={() => { onChange(""); setCustom(true); setOpen(false); }} className="px-4 py-3">
            <Text className="text-slate-950 dark:text-white text-sm">Other card</Text>
          </Pressable>
        </ScrollView>
      )}
      {selected && (
        <View className="rounded-xl overflow-hidden mt-1">
          <IssuerCardImage url={getCardImageUrl(bankId, selected.name)} height={140} backgroundColor={selected.background} fallback={
            <View className="h-28 rounded-xl px-4 py-3 justify-between overflow-hidden" style={{ backgroundColor: selected.background }}>
              <View className="absolute w-36 h-36 rounded-full border-[20px] opacity-20" style={{ right: -20, top: -45, borderColor: selected.accent }} />
              <Text className="text-white/80 text-xs font-bold tracking-widest">{getPhilippineBank(bank)?.shortName}</Text>
              <View className="flex-row items-end justify-between">
                <Text className="text-white text-base font-bold flex-1 pr-3" numberOfLines={2}>{selected.name}</Text>
                <Text className="text-white text-xs font-bold italic">{selected.network}</Text>
              </View>
            </View>
          } />
          </View>
      )}
      {isCustom && <Input label="Card name" placeholder="Enter the name on your card" value={value} onChangeText={onChange} />}
      {error && <Text className="text-red-500 dark:text-red-400 text-xs">{error}</Text>}
    </View>
  );
}
