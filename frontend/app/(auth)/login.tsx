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
  Image,
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
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setErrorMsg("");
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
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
      setErrorMsg(e.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
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
              <View className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 items-center justify-center mb-3 shadow-sm p-3">
                <Image
                  source={require("../../assets/hospital-logo.png")}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Care<Text className="text-blue-600">Pulse</Text>
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

              {/* Inline Error Banner */}
              {errorMsg ? (
                <View className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 flex-row items-center">
                  <Text className="text-rose-700 text-xs font-semibold flex-1">
                    ⚠️ {errorMsg}
                  </Text>
                </View>
              ) : null}

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
          </ResponsiveContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
