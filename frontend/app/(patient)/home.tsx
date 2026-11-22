import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../components/AppHeader";
import { ResponsiveContainer } from "../../components/ResponsiveContainer";

export default function PatientHome() {
  const router = useRouter();
  const { name } = useAuthStore();
  const firstName = name ? name.split(" ")[0] : "Patient";

  const cards = [
    {
      icon: "👨‍⚕️",
      title: "Find Doctors",
      desc: "Browse by specialty, working hours & check real-time available slots.",
      route: "/(patient)/doctors",
      color: "bg-blue-600",
      accent: "border-blue-200 bg-blue-50/50",
    },
    {
      icon: "📅",
      title: "My Appointments",
      desc: "Track scheduled consultations, access doctor notes & diagnosis.",
      route: "/(patient)/appointments",
      color: "bg-emerald-600",
      accent: "border-emerald-200 bg-emerald-50/50",
    },
    {
      icon: "⏳",
      title: "Priority Waitlist",
      desc: "View status of your auto-allocation requests for fully-booked days.",
      route: "/(patient)/waitlist",
      color: "bg-amber-600",
      accent: "border-amber-200 bg-amber-50/50",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <AppHeader />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
      >
        <ResponsiveContainer maxWidth="lg">
          {/* Hero Welcome Banner */}
          <View className="bg-gradient-to-r bg-blue-600 rounded-3xl p-6 sm:p-8 mb-6 shadow-md text-white">
            <View className="max-w-xl">
              <View className="bg-white/20 self-start px-3 py-1 rounded-full mb-3">
                <Text className="text-white text-xs font-bold tracking-wide">
                  🏥 Healthcare Portal
                </Text>
              </View>
              <Text className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                Good day, {firstName}!
              </Text>
              <Text className="text-blue-100 text-sm sm:text-base leading-relaxed mb-5">
                Book dynamic consultation slots, manage your upcoming clinical visits, or join the priority queue with auto-reallocation.
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/(patient)/doctors")}
                className="bg-white hover:bg-slate-100 active:bg-slate-200 self-start rounded-xl px-5 py-3 flex-row items-center shadow-sm"
              >
                <Text className="text-blue-700 font-bold text-sm mr-2">
                  Browse Available Doctors
                </Text>
                <Text className="text-blue-700 font-bold text-sm">→</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Action Cards Grid (Responsive 1 col mobile -> 3 cols desktop) */}
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
            Quick Actions
          </Text>

          <View className="flex-col sm:flex-row gap-4 mb-6">
            {cards.map((c) => (
              <TouchableOpacity
                key={c.route}
                onPress={() => router.push(c.route as any)}
                className={`flex-1 bg-white rounded-2xl p-5 border ${c.accent} shadow-sm hover:shadow-md transition`}
              >
                <View className="w-12 h-12 rounded-xl bg-slate-100 items-center justify-center mb-3">
                  <Text className="text-2xl">{c.icon}</Text>
                </View>
                <Text className="text-slate-900 font-bold text-base mb-1">
                  {c.title}
                </Text>
                <Text className="text-slate-500 text-xs leading-relaxed mb-3">
                  {c.desc}
                </Text>
                <Text className="text-blue-600 font-bold text-xs mt-auto">
                  Open Section →
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Real-time sync Info Pill */}
          <View className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-emerald-100 items-center justify-center mr-3">
              <Text className="text-emerald-700 font-black text-sm">⚡</Text>
            </View>
            <View className="flex-1">
              <Text className="text-slate-800 font-bold text-xs">
                WebSocket Real-Time Availability Active
              </Text>
              <Text className="text-slate-500 text-xs">
                Calendar slots update in real-time as other patients book or cancel appointments.
              </Text>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
