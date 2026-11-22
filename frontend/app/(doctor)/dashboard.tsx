import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { appointmentsService, Appointment, AppointmentStatus } from "../../services/appointments";
import { StatusBadge } from "../../components/StatusBadge";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useAuthStore } from "../../store/authStore";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { name, logout } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const data = await appointmentsService.mine();
      setAppointments(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;

  const today = appointments.filter(
    (a) => new Date(a.start_time).toDateString() === new Date().toDateString()
  );
  const upcoming = appointments.filter(
    (a) =>
      new Date(a.start_time) > new Date() &&
      new Date(a.start_time).toDateString() !== new Date().toDateString()
  );

  const renderItem = ({ item: a }: { item: Appointment }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(doctor)/appointment/${a.id}`)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start mb-1">
        <Text className="font-semibold text-gray-900 text-base">{a.patient_name}</Text>
        <StatusBadge status={a.status} />
      </View>
      <Text className="text-muted text-sm">{fmtDate(a.start_time)}</Text>
      <Text className="text-gray-600 text-sm mt-1">
        🕐 {fmtTime(a.start_time)} – {fmtTime(a.end_time)}
      </Text>
      {a.auto_assigned && (
        <View className="mt-2 bg-green-50 rounded-lg px-2 py-1 self-start">
          <Text className="text-xs text-secondary">⚡ Auto-assigned from waitlist</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <FlatList
        data={[]}
        keyExtractor={() => ""}
        renderItem={null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} />}
        ListHeaderComponent={
          <View className="px-5 pt-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-5">
              <View>
                <Text className="text-2xl font-bold text-gray-900">Dr. {name?.split(" ").slice(-1)[0]}'s Dashboard</Text>
                <Text className="text-muted text-sm">
                  {new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
                </Text>
              </View>
              <TouchableOpacity onPress={handleLogout} className="bg-red-50 px-3 py-2 rounded-xl">
                <Text className="text-danger text-sm font-medium">Logout</Text>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View className="flex-row gap-3 mb-5">
              <View className="flex-1 bg-primary rounded-2xl p-4">
                <Text className="text-white text-2xl font-bold">{today.length}</Text>
                <Text className="text-blue-100 text-sm">Today</Text>
              </View>
              <View className="flex-1 bg-secondary rounded-2xl p-4">
                <Text className="text-white text-2xl font-bold">{upcoming.length}</Text>
                <Text className="text-green-100 text-sm">Upcoming</Text>
              </View>
            </View>

            {/* Today */}
            <Text className="text-base font-semibold text-gray-700 mb-2">Today's Appointments</Text>
            {today.length === 0 && (
              <Text className="text-muted text-sm mb-4">No appointments today.</Text>
            )}
            {today.map((a) => renderItem({ item: a }))}

            {/* Upcoming */}
            <Text className="text-base font-semibold text-gray-700 mt-2 mb-2">Upcoming</Text>
            {upcoming.length === 0 && (
              <Text className="text-muted text-sm mb-4">No upcoming appointments.</Text>
            )}
            {upcoming.map((a) => renderItem({ item: a }))}
          </View>
        }
      />
    </SafeAreaView>
  );
}
