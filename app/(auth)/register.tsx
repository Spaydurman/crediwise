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

interface RegisterFormValues {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: { full_name: "", email: "", password: "", confirm_password: "" },
  });

  const password = watch("password");

  const onRegister = async (values: RegisterFormValues) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: {
          data: { full_name: values.full_name.trim() },
        },
      });

      if (error) {
        Alert.alert("Registration Failed", error.message);
      } else {
        Alert.alert(
          "Success",
          "Account created successfully!",
          [{ text: "OK" }]
        );
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
          contentContainerClassName="px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-8">
            <View className="gap-2">
              <Text className="text-white text-3xl font-bold">Create Account</Text>
              <Text className="text-slate-400 text-base">
                Start tracking your credit card spending wisely.
              </Text>
            </View>

            <View className="gap-4">
              <Controller
                control={control}
                name="full_name"
                rules={{ required: "Full name is required" }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Full Name"
                    placeholder="Juan Dela Cruz"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="words"
                    error={errors.full_name?.message}
                  />
                )}
              />

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
                  rules={{
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Password"
                      placeholder="Min. 8 characters"
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

              <Controller
                control={control}
                name="confirm_password"
                rules={{
                  required: "Please confirm your password",
                  validate: (v) =>
                    v === password || "Passwords do not match",
                }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Confirm Password"
                    placeholder="Re-enter your password"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                    error={errors.confirm_password?.message}
                  />
                )}
              />

              <View className="pt-2">
                <Button
                  label={loading ? "Creating account..." : "Create Account"}
                  onPress={handleSubmit(onRegister)}
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
                Already have an account?
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="text-indigo-400 text-sm font-semibold">
                    Sign In
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
