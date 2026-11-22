import { useState } from "react";
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
    if (!form.name || !form.email || !form.password) {
      Alert.alert("Validation", "All fields are required.");
      return;
    }
    setLoading(true);
    try {
      await authService.register(form);
      Alert.alert("Success", "Account created! Please log in.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-8">
          <Text className="text-2xl font-bold text-gray-900 mb-6">Create Account</Text>

          <View className="bg-white rounded-2xl p-6 shadow-sm">
            {/* Name */}
            <Text className="text-sm text-gray-600 mb-1 font-medium">Full Name</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 mb-4 bg-gray-50"
              placeholder="Dr. John Smith"
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            />

            {/* Email */}
            <Text className="text-sm text-gray-600 mb-1 font-medium">Email</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 mb-4 bg-gray-50"
              placeholder="you@example.com"
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <Text className="text-sm text-gray-600 mb-1 font-medium">Password</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 mb-4 bg-gray-50"
              placeholder="Min 6 characters"
              value={form.password}
              onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
              secureTextEntry
            />

            {/* Role */}
            <Text className="text-sm text-gray-600 mb-2 font-medium">I am a…</Text>
            <View className="flex-row gap-3 mb-6">
              {(["patient", "doctor"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setForm((f) => ({ ...f, role: r }))}
                  className={`flex-1 py-3 rounded-xl border items-center ${
                    form.role === r
                      ? "bg-primary border-primary"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <Text className={`font-semibold capitalize ${form.role === r ? "text-white" : "text-gray-700"}`}>
                    {r === "patient" ? "🧑 Patient" : "👨‍⚕️ Doctor"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className={`bg-primary rounded-xl py-4 items-center ${loading ? "opacity-60" : ""}`}
            >
              <Text className="text-white font-semibold text-base">
                {loading ? "Creating account…" : "Register"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.back()} className="mt-4 items-center">
            <Text className="text-muted text-sm">
              Already have an account? <Text className="text-primary font-semibold">Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
