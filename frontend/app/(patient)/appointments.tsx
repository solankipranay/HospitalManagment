import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { appointmentsService, Appointment } from "../../services/appointments";
import { AppointmentCard } from "../../components/AppointmentCard";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { AppHeader } from "../../components/AppHeader";
import { ResponsiveContainer } from "../../components/ResponsiveContainer";

export default function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
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

  if (loading) return <LoadingSpinner message="Retrieving appointments…" />;

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => new Date(a.start_time) >= now && a.status !== "Completed"
  );
  const past = appointments.filter(
    (a) => new Date(a.start_time) < now || a.status === "Completed"
  );

  const displayedList = activeTab === "upcoming" ? upcoming : past;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <AppHeader />
      <ResponsiveContainer maxWidth="lg" className="px-4 py-6">
        {/* Title & Info */}
        <View className="mb-5">
          <Text className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
            My Appointments
          </Text>
          <Text className="text-slate-500 text-xs sm:text-sm">
            Keep track of your clinical consults. Cancellations must be made at least 2 hours prior to the slot.
          </Text>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row bg-slate-200/70 p-1 rounded-2xl mb-5 self-start">
          <TouchableOpacity
            onPress={() => setActiveTab("upcoming")}
            className={`px-5 py-2 rounded-xl transition ${
              activeTab === "upcoming"
                ? "bg-white shadow-sm"
                : "hover:bg-slate-200"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === "upcoming" ? "text-blue-600" : "text-slate-600"
              }`}
            >
              Upcoming ({upcoming.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("past")}
            className={`px-5 py-2 rounded-xl transition ${
              activeTab === "past"
                ? "bg-white shadow-sm"
                : "hover:bg-slate-200"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === "past" ? "text-blue-600" : "text-slate-600"
              }`}
            >
              Past / Completed ({past.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List of Appointments */}
        <FlatList
          data={displayedList}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <AppointmentCard appointment={item} onRefresh={fetch} />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetch();
              }}
            />
          }
          ListEmptyComponent={
            <View className="items-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6">
              <Text className="text-3xl mb-2">
                {activeTab === "upcoming" ? "📅" : "📋"}
              </Text>
              <Text className="text-slate-800 font-bold text-base">
                No {activeTab} appointments found
              </Text>
              <Text className="text-slate-400 text-xs mt-1 text-center">
                {activeTab === "upcoming"
                  ? "Browse the doctors directory to book your next consultation."
                  : "Completed visits and medical diagnoses will appear here."}
              </Text>
            </View>
          }
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
