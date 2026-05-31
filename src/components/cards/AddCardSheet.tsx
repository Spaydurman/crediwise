import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { CARD_COLORS } from "../../constants";
import type { AddCardInput, CardColor, CreditCard } from "../../types";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface AddCardSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: AddCardInput) => Promise<CreditCard>;
}

interface CardFormValues {
  name: string;
  bank: string;
  last_four_digits: string;
  credit_limit: string;
  statement_date: string;
  billing_cycle_date: string;
  color: CardColor;
}

export function AddCardSheet({ visible, onClose, onAdd }: AddCardSheetProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CardFormValues>({
    defaultValues: {
      name: "",
      bank: "",
      last_four_digits: "",
      credit_limit: "",
      statement_date: "",
      billing_cycle_date: "1",
      color: "indigo",
    },
  });

  const onSubmit = async (values: CardFormValues) => {
    try {
      setSubmitting(true);
      await onAdd({
        name: values.name.trim(),
        bank: values.bank.trim(),
        last_four_digits: values.last_four_digits.trim() || null,
        credit_limit: parseFloat(values.credit_limit) || 0,
        statement_date: values.statement_date.trim() ? parseInt(values.statement_date, 10) : null,
        billing_cycle_date: parseInt(values.billing_cycle_date, 10) || 1,
        color: values.color,
      });
      reset();
      onClose();
    } catch (err) {
      Alert.alert("Error", "Failed to add card. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add Credit Card">
      <ScrollView
        className="px-5 py-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4 pb-8">
          <Controller
            control={control}
            name="bank"
            rules={{ required: "Bank name is required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Bank"
                placeholder="e.g. BDO, BPI, Metrobank"
                value={value}
                onChangeText={onChange}
                error={errors.bank?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="name"
            rules={{ required: "Card name is required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Card Name / Label"
                placeholder="e.g. BDO Platinum, BPI Gold"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="last_four_digits"
            rules={{
              pattern: {
                value: /^\d{4}$/,
                message: "Must be exactly 4 digits",
              },
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Last 4 Digits (optional)"
                placeholder="e.g. 1234"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                maxLength={4}
                error={errors.last_four_digits?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="credit_limit"
            rules={{
              required: "Credit limit is required",
              pattern: { value: /^\d+(\.\d{1,2})?$/, message: "Invalid amount" },
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Credit Limit (₱)"
                placeholder="e.g. 50000"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                error={errors.credit_limit?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="statement_date"
            rules={{
              min: { value: 1, message: "Min is 1" },
              max: { value: 28, message: "Max is 28" },
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Statement Cut-off Day (1–28, optional)"
                placeholder="e.g. 25"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                maxLength={2}
                error={errors.statement_date?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="billing_cycle_date"
            rules={{
              required: "Payment due day is required",
              min: { value: 1, message: "Min is 1" },
              max: { value: 31, message: "Max is 31" },
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Payment Due Day (1–31)"
                placeholder="e.g. 20"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                maxLength={2}
                error={errors.billing_cycle_date?.message}
              />
            )}
          />

          <View className="gap-2">
            <Text className="text-slate-300 text-sm font-medium">
              Card Color
            </Text>
            <Controller
              control={control}
              name="color"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-3">
                  {CARD_COLORS.map((c) => (
                    <Pressable
                      key={c.value}
                      onPress={() => onChange(c.value)}
                      className={`
                        w-10 h-10 rounded-full items-center justify-center
                        ${c.className}
                        ${value === c.value ? "border-2 border-white" : "border-2 border-transparent"}
                      `}
                    >
                      {value === c.value && (
                        <Text className="text-white text-xs font-bold">✓</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </View>

          <View className="pt-2">
            <Button
              label={submitting ? "Adding..." : "Add Card"}
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
