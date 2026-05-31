import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();

  const availableHeight = SCREEN_HEIGHT - insets.top - 24;
  const sheetMaxHeight = Math.min(snapHeight, Math.max(220, availableHeight));

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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill} className="z-50">
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: backdropAnim }]}
          className="bg-black/70"
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <Animated.View
            className="bg-slate-900 rounded-t-3xl overflow-hidden"
            style={{
              transform: [{ translateY: slideAnim }],
              maxHeight: sheetMaxHeight,
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
