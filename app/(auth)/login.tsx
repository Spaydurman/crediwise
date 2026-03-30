import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  const onLogin = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      if (error) {
        Alert.alert("Login Failed", error.message);
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-1 px-6 justify-center"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-8">
            <View className="items-center gap-3">
              <View className="w-20 h-20 bg-indigo-600 rounded-3xl items-center justify-center">
                <Ionicons name="card" size={40} color="white" />
              </View>
              <View className="items-center gap-1">
                <Text className="text-white text-3xl font-bold">CrediWise</Text>
                <Text className="text-slate-400 text-base text-center">
                  Track your credit card spending{"\n"}and savings all in one place.
                </Text>
              </View>
            </View>

            <View className="gap-4">
              <Text className="text-white text-2xl font-bold">Sign In</Text>

              <Controller
                control={control}
                name="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address",
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Email"
                    placeholder="you@example.com"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={errors.email?.message}
                  />
                )}
              />

              <View>
                <Controller
                  control={control}
                  name="password"
                  rules={{ required: "Password is required" }}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Password"
                      placeholder="••••••••"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry={!showPassword}
                      error={errors.password?.message}
                    />
                  )}
                />
                <Pressable
                  onPress={() => setShowPassword((p) => !p)}
                  className="absolute right-4 bottom-3"
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94a3b8"
                  />
                </Pressable>
              </View>

              <View className="pt-2">
                <Button
                  label={loading ? "Signing in..." : "Sign In"}
                  onPress={handleSubmit(onLogin)}
                  loading={loading}
                  fullWidth
                  size="lg"
                />
              </View>

              <View className="flex-row items-center gap-3 py-2">
                <View className="flex-1 h-px bg-slate-700" />
                <Text className="text-slate-500 text-sm">or</Text>
                <View className="flex-1 h-px bg-slate-700" />
              </View>

              <GoogleSignInButton />
            </View>

            <View className="flex-row items-center justify-center gap-1">
              <Text className="text-slate-400 text-sm">
                Don't have an account?
              </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text className="text-indigo-400 text-sm font-semibold">
                    Sign Up
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
