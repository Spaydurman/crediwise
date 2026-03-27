import { Modal, Pressable, Text, View } from "react-native";
import { Button } from "./Button";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/70 items-center justify-center px-6">
        <View className="bg-slate-900 rounded-2xl p-6 w-full gap-4 border border-slate-800">
          <View className="gap-2">
            <Text className="text-white text-lg font-bold">{title}</Text>
            <Text className="text-slate-400 text-sm leading-5">{message}</Text>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button
                label="Cancel"
                variant="secondary"
                onPress={onCancel}
                fullWidth
              />
            </View>
            <View className="flex-1">
              <Button
                label={confirmLabel}
                variant="danger"
                onPress={onConfirm}
                loading={loading}
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
