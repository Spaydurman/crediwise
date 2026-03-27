import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  snapHeight?: number;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  snapHeight = SCREEN_HEIGHT * 0.75,
}: BottomSheetProps) {
  const slideAnim = useRef(new Animated.Value(snapHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: snapHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim, snapHeight]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end">
          <Animated.View
            className="absolute inset-0 bg-black/70"
            style={{ opacity: backdropAnim }}
          >
            <Pressable className="flex-1" onPress={onClose} />
          </Animated.View>

          <Animated.View
            className="bg-slate-900 rounded-t-3xl overflow-hidden"
            style={{
              transform: [{ translateY: slideAnim }],
              maxHeight: snapHeight,
            }}
          >
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
              <Text className="text-white text-lg font-semibold">{title}</Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center active:bg-slate-700"
              >
                <Ionicons name="close" size={18} color="#94a3b8" />
              </Pressable>
            </View>
            {children}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
