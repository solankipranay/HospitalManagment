import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { authService } from "../../services/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { ResponsiveContainer } from "../../components/ResponsiveContainer";

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient" as "doctor" | "patient",
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      Alert.alert("Validation", "All fields are required.");
      return;
    }
    if (form.password.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await authService.register(form);
      Alert.alert("Account Created", "Registration successful! You can now sign in.", [
        { text: "Sign In Now", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (e: any) {
      Alert.alert("Registration Error", e.message);
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
            <View className="w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center mb-2 shadow-md">
              <Text className="text-2xl">🏥</Text>
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
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
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
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
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
                onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
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
                {loading ? "Registering…" : "Complete Registration"}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View className="mt-5 pt-4 border-t border-slate-100 flex-row justify-center items-center">
              <Text className="text-slate-500 text-xs">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-blue-600 font-bold text-xs ml-1">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
