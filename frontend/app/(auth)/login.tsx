import { useState } from "react";
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

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Validation", "Please enter email and password.");
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
      Alert.alert("Login Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6">
            {/* Header */}
            <View className="items-center mb-10">
              <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4">
                <Text className="text-4xl">🏥</Text>
              </View>
              <Text className="text-3xl font-bold text-gray-900">Hospital App</Text>
              <Text className="text-muted text-sm mt-1">CrestCode Scheduling System</Text>
            </View>

            {/* Form */}
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <Text className="text-xl font-semibold text-gray-900 mb-6">Sign In</Text>

              <Text className="text-sm text-gray-600 mb-1 font-medium">Email</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-900 bg-gray-50"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Text className="text-sm text-gray-600 mb-1 font-medium">Password</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-900 bg-gray-50"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className={`bg-primary rounded-xl py-4 items-center ${loading ? "opacity-60" : ""}`}
              >
                <Text className="text-white font-semibold text-base">
                  {loading ? "Signing in…" : "Sign In"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Register link */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              className="mt-4 items-center"
            >
              <Text className="text-muted text-sm">
                Don't have an account?{" "}
                <Text className="text-primary font-semibold">Register</Text>
              </Text>
            </TouchableOpacity>

            {/* Demo credentials */}
            <View className="mt-6 bg-blue-50 rounded-xl p-4">
              <Text className="text-xs font-semibold text-blue-700 mb-2">Demo Credentials</Text>
              <Text className="text-xs text-blue-600">👨‍⚕️ Dr. Smith: dr.smith@hospital.com</Text>
              <Text className="text-xs text-blue-600">🧑 Alice: alice@patient.com</Text>
              <Text className="text-xs text-blue-600">🔑 Password: password123</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
