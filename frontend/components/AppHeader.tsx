import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";

interface Props {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export function AppHeader({ title, subtitle, showBack = false }: Props) {
  const router = useRouter();
  const { name, role, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const isDoctor = role === "doctor";
  const userInitials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-sm">
      <View className="max-w-6xl mx-auto w-full flex-row items-center justify-between">
        {/* Brand or Back */}
        <View className="flex-row items-center space-x-3">
          {showBack && (
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-2 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
            >
              <Text className="text-slate-700 font-bold text-base">←</Text>
            </TouchableOpacity>
          )}

          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 items-center justify-center shadow-sm mr-3 p-1">
              <Image
                source={require("../assets/hospital-logo.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text className="text-slate-900 font-extrabold text-lg tracking-tight">
                Care<Text className="text-blue-600">Pulse</Text>
              </Text>
              <Text className="text-slate-400 text-xs font-medium">
                Hospital Scheduling System
              </Text>
            </View>
          </View>
        </View>

        {/* User Info & Actions */}
        <View className="flex-row items-center space-x-3">
          {/* Role badge */}
          <View
            className={`hidden sm:flex px-3 py-1 rounded-full border ${
              isDoctor
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isDoctor ? "text-emerald-700" : "text-blue-700"
              }`}
            >
              {isDoctor ? "👨‍⚕️ Doctor Portal" : "🧑‍💼 Patient Portal"}
            </Text>
          </View>

          {/* User profile capsule */}
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-full pl-2 pr-3 py-1">
            <View className="w-7 h-7 rounded-full bg-blue-600 items-center justify-center mr-2">
              <Text className="text-white text-xs font-bold">{userInitials}</Text>
            </View>
            <Text className="text-slate-700 text-xs font-medium max-w-[120px]" numberOfLines={1}>
              {name || "User"}
            </Text>
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 transition"
          >
            <Text className="text-rose-600 text-xs font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
