import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { INSTALLMENT_TERMS, TRANSACTION_CATEGORIES } from "../../constants";
import type { AddTransactionInput, CreditCard } from "../../types";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { CURRENCY } from "../../constants";

interface AddTransactionSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: AddTransactionInput) => Promise<void>;
  cards: CreditCard[];
  defaultCardId?: string;
}

interface TransactionFormValues {
  card_id: string;
  description: string;
  amount: string;
  category: string;
  transaction_date: string;
  is_installment: boolean;
  installment_months: number;
}

export function AddTransactionSheet({
  visible,
  onClose,
  onAdd,
  cards,
  defaultCardId,
}: AddTransactionSheetProps) {
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    defaultValues: {
      card_id: defaultCardId ?? cards[0]?.id ?? "",
      description: "",
      amount: "",
      category: TRANSACTION_CATEGORIES[0],
      transaction_date: today,
      is_installment: false,
      installment_months: 6,
    },
  });

  const selectedCardId = watch("card_id");
  const selectedCategory = watch("category");
  const isInstallment = watch("is_installment");
  const installmentMonths = watch("installment_months");
  const amountStr = watch("amount");

  const parsedAmount = parseFloat(amountStr) || 0;
  const monthlyAmount =
    isInstallment && installmentMonths > 0
      ? parsedAmount / installmentMonths
      : null;

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      setSubmitting(true);
      await onAdd({
        card_id: values.card_id,
        description: values.description.trim(),
        amount: parseFloat(values.amount),
        category: values.category,
        transaction_date: values.transaction_date,
        is_installment: values.is_installment,
        installment_months: values.is_installment ? values.installment_months : null,
        monthly_amount: values.is_installment && values.installment_months > 0
          ? Math.round((parseFloat(values.amount) / values.installment_months) * 100) / 100
          : null,
      });
      reset({
        card_id: defaultCardId ?? cards[0]?.id ?? "",
        description: "",
        amount: "",
        category: TRANSACTION_CATEGORIES[0],
        transaction_date: today,
        is_installment: false,
        installment_months: 6,
      });
      onClose();
    } catch {
      Alert.alert("Error", "Failed to add transaction. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add Transaction"
      snapHeight={750}
    >
      <ScrollView
        className="px-5 py-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        <View className="gap-4 pb-8">
          <View className="gap-1.5">
            <Text className="text-slate-300 text-sm font-medium">
              Credit Card
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-1"
              contentContainerClassName="gap-2 px-1"
            >
              {cards.map((card) => (
                <Pressable
                  key={card.id}
                  onPress={() => setValue("card_id", card.id)}
                  className={`
                    px-4 py-2.5 rounded-xl border
                    ${
                      selectedCardId === card.id
                        ? "bg-indigo-600 border-indigo-500"
                        : "bg-slate-800 border-slate-700"
                    }
                  `}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selectedCardId === card.id
                        ? "text-white"
                        : "text-slate-300"
                    }`}
                  >
                    {card.bank}
                  </Text>
                  <Text
                    className={`text-xs ${
                      selectedCardId === card.id
                        ? "text-indigo-200"
                        : "text-slate-500"
                    }`}
                  >
                    {card.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <Controller
            control={control}
            name="description"
            rules={{ required: "Description is required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Description"
                placeholder="e.g. Grocery at SM, Netflix subscription"
                value={value}
                onChangeText={onChange}
                error={errors.description?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="amount"
            rules={{
              required: "Amount is required",
              pattern: { value: /^\d+(\.\d{1,2})?$/, message: "Invalid amount" },
              validate: (v) =>
                parseFloat(v) > 0 || "Amount must be greater than 0",
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Amount (₱)"
                placeholder="e.g. 1500.00"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                error={errors.amount?.message}
              />
            )}
          />

          <View className="gap-1.5">
            <Text className="text-slate-300 text-sm font-medium">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {TRANSACTION_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setValue("category", cat)}
                  className={`
                    px-3 py-1.5 rounded-lg border
                    ${
                      selectedCategory === cat
                        ? "bg-indigo-600 border-indigo-500"
                        : "bg-slate-800 border-slate-700"
                    }
                  `}
                >
                  <Text
                    className={`text-xs font-medium ${
                      selectedCategory === cat ? "text-white" : "text-slate-400"
                    }`}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Installment Toggle */}
          <View className="flex-row items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
            <View className="flex-1 gap-0.5">
              <Text className="text-slate-300 text-sm font-medium">
                Installment / Pay Later
              </Text>
              <Text className="text-slate-500 text-xs">
                Split into monthly payments
              </Text>
            </View>
            <Controller
              control={control}
              name="is_installment"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: "#334155", true: "#6366f1" }}
                  thumbColor={value ? "#e0e7ff" : "#94a3b8"}
                />
              )}
            />
          </View>

          {/* Installment Term Picker */}
          {isInstallment && (
            <View className="gap-2">
              <Text className="text-slate-300 text-sm font-medium">
                Number of Months
              </Text>
              <Controller
                control={control}
                name="installment_months"
                render={({ field: { onChange, value } }) => (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="-mx-1"
                    contentContainerClassName="gap-2 px-1"
                  >
                    {INSTALLMENT_TERMS.map((term) => (
                      <Pressable
                        key={term}
                        onPress={() => onChange(term)}
                        className={`
                          px-4 py-2.5 rounded-xl border min-w-[56px] items-center
                          ${
                            value === term
                              ? "bg-indigo-600 border-indigo-500"
                              : "bg-slate-800 border-slate-700"
                          }
                        `}
                      >
                        <Text
                          className={`text-sm font-bold ${
                            value === term ? "text-white" : "text-slate-300"
                          }`}
                        >
                          {term}
                        </Text>
                        <Text
                          className={`text-xs ${
                            value === term ? "text-indigo-200" : "text-slate-500"
                          }`}
                        >
                          mos
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              />

              {/* Monthly Amount Preview */}
              {monthlyAmount !== null && parsedAmount > 0 && (
                <View className="bg-indigo-950/50 border border-indigo-800/50 rounded-xl p-3 flex-row items-center justify-between">
                  <Text className="text-indigo-300 text-sm">
                    Monthly Payment
                  </Text>
                  <Text className="text-indigo-400 text-base font-bold">
                    {CURRENCY}
                    {monthlyAmount.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    /mo
                  </Text>
                </View>
              )}
            </View>
          )}

          <Controller
            control={control}
            name="transaction_date"
            rules={{ required: "Date is required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Date (YYYY-MM-DD)"
                placeholder={today}
                value={value}
                onChangeText={onChange}
                error={errors.transaction_date?.message}
                hint="Format: 2025-12-31"
              />
            )}
          />

          <View className="pt-2">
            <Button
              label={submitting ? "Adding..." : "Add Transaction"}
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
