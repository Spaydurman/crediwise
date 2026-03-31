import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView, Text, View } from "react-native";
import { CURRENCY } from "../../constants";
import type { AddSavingInput, Transaction } from "../../types";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface AddSavingSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: AddSavingInput) => Promise<void>;
  transaction: Transaction | null;
}

interface SavingFormValues {
  amount: string;
  notes: string;
  saved_date: string;
}

export function AddSavingSheet({
  visible,
  onClose,
  onAdd,
  transaction,
}: AddSavingSheetProps) {
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const trackableAmount =
    transaction?.is_installment && transaction?.monthly_amount
      ? transaction.monthly_amount
      : transaction?.amount ?? 0;
  const remaining = Math.max(
    0,
    trackableAmount - (transaction?.total_saved ?? 0)
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SavingFormValues>({
    defaultValues: {
      amount: "",
      notes: "",
      saved_date: today,
    },
  });

  const onSubmit = async (values: SavingFormValues) => {
    if (!transaction) return;
    const parsedAmount = parseFloat(values.amount);

    if (parsedAmount > remaining) {
      Alert.alert(
        "Amount too large",
        `You only need to save ${CURRENCY}${remaining.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
        })} more for this transaction.`
      );
      return;
    }

    try {
      setSubmitting(true);
      await onAdd({
        transaction_id: transaction.id,
        amount: parsedAmount,
        notes: values.notes.trim(),
        saved_date: values.saved_date,
      });
      reset({ amount: "", notes: "", saved_date: today });
      onClose();
    } catch {
      Alert.alert("Error", "Failed to record saving. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Record Saving (Natabi)"
      snapHeight={520}
    >
      <ScrollView
        className="px-5 py-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        <View className="gap-4 pb-8">
          {transaction && (
            <View className="bg-slate-800 rounded-xl p-4 gap-2 border border-slate-700">
              <Text
                className="text-white font-semibold text-sm"
                numberOfLines={1}
              >
                {transaction.description}
              </Text>
              {transaction.is_installment && transaction.monthly_amount && (
                <View className="bg-indigo-950/50 border border-indigo-800/50 rounded-lg px-3 py-2">
                  <Text className="text-indigo-300 text-xs">
                    Installment: {transaction.installment_months} months — {CURRENCY}
                    {transaction.monthly_amount.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                    /mo
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-slate-500 text-xs">
                    {transaction.is_installment ? "Monthly Due" : "Total Amount"}
                  </Text>
                  <Text className="text-white text-sm font-bold">
                    {CURRENCY}
                    {trackableAmount.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
                <View>
                  <Text className="text-slate-500 text-xs">Already Saved</Text>
                  <Text className="text-emerald-400 text-sm font-bold">
                    {CURRENCY}
                    {(transaction.total_saved ?? 0).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
                <View>
                  <Text className="text-slate-500 text-xs">Remaining</Text>
                  <Text className="text-amber-400 text-sm font-bold">
                    {CURRENCY}
                    {remaining.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>
            </View>
          )}

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
                label={`Amount to Natabi (₱) — Max: ${CURRENCY}${remaining.toLocaleString(
                  "en-PH",
                  { minimumFractionDigits: 2 }
                )}`}
                placeholder="e.g. 500.00"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                error={errors.amount?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="saved_date"
            rules={{ required: "Date is required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Date Saved (YYYY-MM-DD)"
                placeholder={today}
                value={value}
                onChangeText={onChange}
                error={errors.saved_date?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Notes (optional)"
                placeholder="e.g. From salary, from savings jar"
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={2}
              />
            )}
          />

          <View className="pt-2">
            <Button
              label={submitting ? "Saving..." : "Record Saving"}
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
