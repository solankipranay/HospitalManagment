import { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { appointmentsService, Appointment } from "../../services/appointments";
import { AppointmentCard } from "../../components/AppointmentCard";
import { LoadingSpinner } from "../../components/LoadingSpinner";

export default function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const data = await appointmentsService.mine();
      setAppointments(data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return <LoadingSpinner message="Loading appointments…" />;

  const upcoming = appointments.filter(
    (a) => new Date(a.start_time) >= new Date() && a.status !== "Completed"
  );
  const past = appointments.filter(
    (a) => new Date(a.start_time) < new Date() || a.status === "Completed"
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <FlatList
        data={[]}
        keyExtractor={() => ""}
        renderItem={null}
        ListHeaderComponent={
          <View className="px-5 pt-4">
            <Text className="text-2xl font-bold text-gray-900 mb-4">My Appointments</Text>

            {/* Upcoming */}
            <Text className="text-base font-semibold text-gray-700 mb-2">Upcoming</Text>
            {upcoming.length === 0 ? (
              <Text className="text-muted text-sm mb-4">No upcoming appointments</Text>
            ) : (
              upcoming.map((a) => (
                <AppointmentCard key={a.id} appointment={a} onRefresh={fetch} />
              ))
            )}

            {/* Past */}
            <Text className="text-base font-semibold text-gray-700 mt-2 mb-2">Past</Text>
            {past.length === 0 ? (
              <Text className="text-muted text-sm mb-4">No past appointments</Text>
            ) : (
              past.map((a) => (
                <AppointmentCard key={a.id} appointment={a} onRefresh={fetch} />
              ))
            )}
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} />
        }
      />
    </SafeAreaView>
  );
}
