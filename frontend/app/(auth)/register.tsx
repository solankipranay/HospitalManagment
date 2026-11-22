import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { authService } from "../../services/auth";
import { useAuthStore } from "../../store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { ResponsiveContainer } from "../../components/ResponsiveContainer";

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient" as "doctor" | "patient",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setErrorMsg("All fields are required.");
      return;
    }
    if (form.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1. Register user
      await authService.register(form);
      setSuccessMsg("Account created! Redirecting to your portal…");

      // 2. Auto-login for instant seamless onboarding
      try {
        const loginRes = await authService.login({
          email: form.email.trim(),
          password: form.password,
        });
        await setAuth(
          loginRes.access_token,
          loginRes.role,
          loginRes.user_id,
          loginRes.name
        );

        // Redirect directly to doctor or patient dashboard
        if (loginRes.role === "doctor") {
          router.replace("/(doctor)/dashboard");
        } else {
          router.replace("/(patient)/home");
        }
      } catch {
        // Fallback: Navigate straight to sign in screen
        router.replace("/(auth)/login");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="px-4 py-8"
      >
        <ResponsiveContainer maxWidth="sm">
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center mb-2 shadow-sm p-2.5">
              <Image
                source={require("../../assets/hospital-logo.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create an Account
            </Text>
            <Text className="text-slate-500 text-xs mt-1">
              Join CarePulse Hospital Scheduling Platform
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
            {/* Inline Error Banner */}
            {errorMsg ? (
              <View className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 flex-row items-center justify-between">
                <Text className="text-rose-700 text-xs font-semibold flex-1">
                  ⚠️ {errorMsg}
                </Text>
                {errorMsg.toLowerCase().includes("already registered") && (
                  <TouchableOpacity
                    onPress={() => router.replace("/(auth)/login")}
                    className="ml-2 bg-rose-600 px-2.5 py-1 rounded-lg"
                  >
                    <Text className="text-white text-[11px] font-bold">Sign In</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {/* Inline Success Banner */}
            {successMsg ? (
              <View className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <Text className="text-emerald-700 text-xs font-semibold">
                  ✅ {successMsg}
                </Text>
              </View>
            ) : null}

            {/* Role Switcher */}
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Your Role
            </Text>
            <View className="flex-row gap-3 mb-5">
              {(["patient", "doctor"] as const).map((r) => {
                const isSelected = form.role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setForm((f) => ({ ...f, role: r }))}
                    className={`flex-1 p-3.5 rounded-2xl border transition items-center ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Text className="text-xl mb-1">
                      {r === "patient" ? "🧑‍💼" : "👨‍⚕️"}
                    </Text>
                    <Text
                      className={`text-xs font-bold capitalize ${
                        isSelected ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {r === "patient" ? "Patient" : "Doctor"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Full Name */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </Text>
              <TextInput
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition text-sm"
                placeholder={form.role === "doctor" ? "Dr. Sarah Jenkins" : "Sarah Jenkins"}
                placeholderTextColor="#94A3B8"
                value={form.name}
                onChangeText={(v) => {
                  setErrorMsg("");
                  setForm((f) => ({ ...f, name: v }));
                }}
              />
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </Text>
              <TextInput
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition text-sm"
                placeholder="sarah@example.com"
                placeholderTextColor="#94A3B8"
                value={form.email}
                onChangeText={(v) => {
                  setErrorMsg("");
                  setForm((f) => ({ ...f, email: v }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </Text>
              <TextInput
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition text-sm"
                placeholder="At least 6 characters"
                placeholderTextColor="#94A3B8"
                value={form.password}
                onChangeText={(v) => {
                  setErrorMsg("");
                  setForm((f) => ({ ...f, password: v }));
                }}
                secureTextEntry
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl py-3.5 items-center justify-center shadow-sm transition ${
                loading ? "opacity-60" : ""
              }`}
            >
              <Text className="text-white font-bold text-base">
                {loading ? "Creating Account…" : "Complete Registration"}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View className="mt-5 pt-4 border-t border-slate-100 flex-row justify-center items-center">
              <Text className="text-slate-500 text-xs">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text className="text-blue-600 font-bold text-xs ml-1">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
