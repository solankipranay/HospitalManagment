import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  appointmentsService,
  Appointment,
} from "../../services/appointments";
import { StatusBadge } from "../../components/StatusBadge";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useAuthStore } from "../../store/authStore";
import { AppHeader } from "../../components/AppHeader";
import { ResponsiveContainer } from "../../components/ResponsiveContainer";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { name } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const data = await appointmentsService.mine();
      setAppointments(data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  if (loading) return <LoadingSpinner message="Loading doctor dashboard…" />;

  const todayStr = new Date().toDateString();
  const todayAppts = appointments.filter(
    (a) => new Date(a.start_time).toDateString() === todayStr
  );
  const inProgressAppts = appointments.filter((a) => a.status === "In_Progress");
  const completedAppts = appointments.filter((a) => a.status === "Completed");
  const autoAssignedCount = appointments.filter((a) => a.auto_assigned).length;

  const renderAppointmentItem = ({ item: a }: { item: Appointment }) => (
    <TouchableOpacity
      key={a.id}
      onPress={() => router.push(`/(doctor)/appointment/${a.id}`)}
      className="bg-white rounded-2xl p-4 sm:p-5 mb-3 shadow-sm border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center flex-wrap gap-2 mb-1">
            <Text className="font-extrabold text-slate-900 text-base">
              {a.patient_name}
            </Text>
            {a.auto_assigned && (
              <View className="bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <Text className="text-emerald-700 text-[10px] font-bold">
                  ⚡ Auto-Assigned
                </Text>
              </View>
            )}
          </View>
          <Text className="text-slate-500 text-xs">{fmtDate(a.start_time)}</Text>
        </View>

        <StatusBadge status={a.status} />
      </View>

      <View className="flex-row items-center justify-between pt-2 border-t border-slate-100 mt-2">
        <View className="flex-row items-center">
          <Text className="text-blue-600 mr-1.5 text-xs">🕐</Text>
          <Text className="text-slate-700 font-semibold text-xs">
            {fmtTime(a.start_time)} – {fmtTime(a.end_time)}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Text className="text-blue-600 text-xs font-bold mr-1">
            {a.status === "Completed" ? "Review Notes" : "Manage Consultation"}
          </Text>
          <Text className="text-blue-600 font-bold text-xs">→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <AppHeader />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetch();
            }}
          />
        }
      >
        <ResponsiveContainer maxWidth="xl">
          {/* Header Greeting */}
          <View className="mb-6 flex-col sm:flex-row sm:items-center justify-between gap-3">
            <View>
              <Text className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Clinical Overview
              </Text>
              <Text className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                Welcome, {name}. Manage your consultations and review diagnoses.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/(doctor)/availability")}
              className="bg-white hover:bg-slate-100 border border-slate-200 self-start sm:self-auto rounded-xl px-4 py-2.5 flex-row items-center shadow-sm"
            >
              <Text className="text-slate-700 text-xs font-bold mr-1.5">
                🗓️ Configure Working Hours
              </Text>
              <Text className="text-slate-400 text-xs">→</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Analytics Grid (4 cards) */}
          <View className="flex-row flex-wrap gap-3.5 mb-7">
            <View className="flex-1 min-w-[140px] bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                Today's Slots
              </Text>
              <Text className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
                {todayAppts.length}
              </Text>
              <Text className="text-slate-400 text-[11px] mt-1">Scheduled today</Text>
            </View>

            <View className="flex-1 min-w-[140px] bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                In Progress
              </Text>
              <Text className="text-2xl sm:text-3xl font-black text-amber-500 mt-1">
                {inProgressAppts.length}
              </Text>
              <Text className="text-slate-400 text-[11px] mt-1">Active right now</Text>
            </View>

            <View className="flex-1 min-w-[140px] bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                Completed
              </Text>
              <Text className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                {completedAppts.length}
              </Text>
              <Text className="text-slate-400 text-[11px] mt-1">With diagnosis</Text>
            </View>

            <View className="flex-1 min-w-[140px] bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                Reallocated
              </Text>
              <Text className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
                {autoAssignedCount}
              </Text>
              <Text className="text-slate-400 text-[11px] mt-1">From waitlist</Text>
            </View>
          </View>

          {/* Today's Schedule */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Today's Consultations ({todayAppts.length})
              </Text>
            </View>

            {todayAppts.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 border border-dashed border-slate-200 items-center">
                <Text className="text-slate-400 text-xs">
                  No appointments scheduled for today.
                </Text>
              </View>
            ) : (
              todayAppts.map((a) => renderAppointmentItem({ item: a }))
            )}
          </View>

          {/* Upcoming Schedule */}
          <View>
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Upcoming Queue ({appointments.length - todayAppts.length})
              </Text>
            </View>

            {appointments
              .filter((a) => new Date(a.start_time).toDateString() !== todayStr)
              .map((a) => renderAppointmentItem({ item: a }))}
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
