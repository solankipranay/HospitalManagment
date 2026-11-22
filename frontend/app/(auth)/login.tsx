import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { ResponsiveContainer } from "../../components/ResponsiveContainer";

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Validation", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.login({ email: email.trim(), password });
      await setAuth(res.access_token, res.role, res.user_id, res.name);
      if (res.role === "doctor") {
        router.replace("/(doctor)/dashboard");
      } else {
        router.replace("/(patient)/home");
      }
    } catch (e: any) {
      Alert.alert("Authentication Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-4 py-8"
        >
          <ResponsiveContainer maxWidth="sm">
            {/* Brand Header */}
            <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center mb-3 shadow-md">
                <Text className="text-3xl">🏥</Text>
              </View>
              <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Crest<Text className="text-blue-600">Care</Text>
              </Text>
              <Text className="text-slate-500 text-sm font-medium mt-1">
                Hospital Scheduling & Patient Management
              </Text>
            </View>

            {/* Login Card */}
            <View className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
              <Text className="text-xl font-bold text-slate-900 mb-1">Welcome back</Text>
              <Text className="text-slate-500 text-xs mb-6">
                Enter your credentials to access your hospital portal.
              </Text>

              {/* Email */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </Text>
                <TextInput
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition text-sm"
                  placeholder="name@hospital.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              {/* Password */}
              <View className="mb-6">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </Text>
                <TextInput
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition text-sm"
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {/* Submit CTA */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className={`w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl py-3.5 items-center justify-center shadow-sm transition ${
                  loading ? "opacity-60" : ""
                }`}
              >
                <Text className="text-white font-bold text-base">
                  {loading ? "Authenticating…" : "Sign In to Portal"}
                </Text>
              </TouchableOpacity>

              {/* Register Link */}
              <View className="mt-5 pt-4 border-t border-slate-100 flex-row justify-center items-center">
                <Text className="text-slate-500 text-xs">Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                  <Text className="text-blue-600 font-bold text-xs ml-1">Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Demo Credentials Autofill */}
            <View className="mt-6 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                ⚡ 1-Click Demo Login:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <TouchableOpacity
                  onPress={() => fillDemo("dr.smith@hospital.com")}
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-3 py-2"
                >
                  <Text className="text-xs font-semibold text-blue-700">
                    👨‍⚕️ Dr. Smith (15m)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => fillDemo("dr.patel@hospital.com")}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-3 py-2"
                >
                  <Text className="text-xs font-semibold text-emerald-700">
                    👨‍⚕️ Dr. Patel (45m)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => fillDemo("alice@patient.com")}
                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl px-3 py-2"
                >
                  <Text className="text-xs font-semibold text-indigo-700">
                    🧑 Alice (Patient)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ResponsiveContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
