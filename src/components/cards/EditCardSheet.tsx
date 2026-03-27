import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
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

interface EditCardSheetProps {
  card: CreditCard | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<AddCardInput>) => Promise<CreditCard>;
}

interface CardFormValues {
  name: string;
  bank: string;
  last_four_digits: string;
  credit_limit: string;
  billing_cycle_date: string;
  color: CardColor;
}

export function EditCardSheet({
  card,
  visible,
  onClose,
  onUpdate,
}: EditCardSheetProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CardFormValues>();

  useEffect(() => {
    if (card) {
      reset({
        name: card.name,
        bank: card.bank,
        last_four_digits: card.last_four_digits ?? "",
        credit_limit: card.credit_limit.toString(),
        billing_cycle_date: card.billing_cycle_date.toString(),
        color: card.color,
      });
    }
  }, [card, reset]);

  const onSubmit = async (values: CardFormValues) => {
    if (!card) return;
    try {
      setSubmitting(true);
      await onUpdate(card.id, {
        name: values.name.trim(),
        bank: values.bank.trim(),
        last_four_digits: values.last_four_digits.trim() || null,
        credit_limit: parseFloat(values.credit_limit) || 0,
        billing_cycle_date: parseInt(values.billing_cycle_date, 10) || 1,
        color: values.color,
      });
      onClose();
    } catch {
      Alert.alert("Error", "Failed to update card. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit Card">
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
              pattern: { value: /^\d{4}$/, message: "Must be exactly 4 digits" },
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Last 4 Digits (optional)"
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
            rules={{ required: "Credit limit is required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Credit Limit (₱)"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                error={errors.credit_limit?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="billing_cycle_date"
            rules={{ required: "Billing day is required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Billing Cycle Day (1–31)"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                maxLength={2}
                error={errors.billing_cycle_date?.message}
              />
            )}
          />

          <View className="gap-2">
            <Text className="text-slate-300 text-sm font-medium">Card Color</Text>
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
                        ${value === c.value ? "ring-2 ring-white" : ""}
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
              label={submitting ? "Saving..." : "Save Changes"}
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
