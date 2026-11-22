import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { doctorsService, Doctor } from "../../../services/doctors";
import { appointmentsService } from "../../../services/appointments";
import { waitlistService, UrgencyLevel } from "../../../services/waitlist";
import { SlotPicker } from "../../../components/SlotPicker";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { AppHeader } from "../../../components/AppHeader";
import { ResponsiveContainer } from "../../../components/ResponsiveContainer";

export default function BookAppointment() {
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const router = useRouter();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  // Live WebSocket slot synchronization
  const { liveBookedSlots } = useWebSocket(doctorId ?? "", selectedDate);

  useEffect(() => {
    if (doctorId) {
      doctorsService.getById(doctorId).then((d) => {
        setDoctor(d);
        setLoading(false);
      });
    }
  }, [doctorId]);

  const handleDateSelect = async (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setSelectedSlot(null);
    setSlots([]);
    setSlotsLoading(true);
    try {
      const res = await doctorsService.getSlots(doctorId!, day.dateString);
      setSlots(res.slots);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      await appointmentsService.book(doctorId!, selectedSlot);
      Alert.alert(
        "Booking Confirmed! 🎉",
        "Your appointment has been successfully scheduled. You can view or manage it in My Appointments.",
        [{ text: "Go to Appointments", onPress: () => router.replace("/(patient)/appointments") }]
      );
    } catch (e: any) {
      Alert.alert("Booking Conflict", e.message);
      // Refresh slot list
      if (selectedDate) handleDateSelect({ dateString: selectedDate });
    } finally {
      setBooking(false);
    }
  };

  const handleJoinWaitlist = async (urgency: UrgencyLevel) => {
    setJoiningWaitlist(true);
    try {
      const res = await waitlistService.join(doctorId!, selectedDate, urgency);
      Alert.alert(
        "Added to Priority Waitlist! ⏳",
        `You have been queued with ${urgency.toUpperCase()} urgency. If a patient cancels their appointment on ${selectedDate}, this slot will automatically be reassigned to you.`
      );
    } catch (e: any) {
      Alert.alert("Waitlist Request", e.message);
    } finally {
      setJoiningWaitlist(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading doctor calendar…" />;

  const allBookedSlots = [...liveBookedSlots];
  const availableSlots = slots.filter((s) => !allBookedSlots.includes(s));
  const noSlotsLeft = selectedDate && !slotsLoading && availableSlots.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <AppHeader showBack />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
      >
        <ResponsiveContainer maxWidth="xl">
          {/* Top Back & Title Bar */}
          <View className="mb-4 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center py-1.5 px-3 rounded-xl bg-white border border-slate-200 shadow-sm"
            >
              <Text className="text-blue-600 font-bold text-xs mr-1">←</Text>
              <Text className="text-slate-700 font-semibold text-xs">Back to Directory</Text>
            </TouchableOpacity>

            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
              <Text className="text-slate-500 text-xs font-medium">Real-Time Engine Active</Text>
            </View>
          </View>

          {/* 2-Column Responsive Layout (sm+: 2 cols, mobile: 1 col) */}
          <View className="flex-col lg:flex-row gap-6">
            {/* Left Column: Doctor Profile & Calendar */}
            <View className="flex-1 lg:max-w-md">
              {/* Doctor Summary Card */}
              <View className="bg-white rounded-3xl p-5 mb-5 shadow-sm border border-slate-200/80">
                <View className="flex-row items-center mb-3">
                  <View className="w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center mr-4 shadow-sm">
                    <Text className="text-white text-xl font-black">
                      {(doctor?.name.replace(/^Dr\.\s*/i, "")[0] || "D").toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-extrabold text-lg">
                      {doctor?.name}
                    </Text>
                    <Text className="text-blue-600 font-semibold text-xs">
                      {doctor?.specialty || "General Specialist"}
                    </Text>
                  </View>
                </View>

                <View className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex-row justify-between">
                  <View>
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">Duration</Text>
                    <Text className="text-slate-800 text-xs font-bold mt-0.5">
                      ⏱ {doctor?.consultation_duration} mins
                    </Text>
                  </View>
                  <View>
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">Mode</Text>
                    <Text className="text-slate-800 text-xs font-bold mt-0.5">
                      🏥 In-Clinic
                    </Text>
                  </View>
                  <View>
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">Concurrency</Text>
                    <Text className="text-emerald-700 text-xs font-bold mt-0.5">
                      🔒 Atomic Lock
                    </Text>
                  </View>
                </View>
              </View>

              {/* Interactive Calendar */}
              <View className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 overflow-hidden">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 px-2">
                  1. Select Appointment Date
                </Text>
                <Calendar
                  onDayPress={handleDateSelect}
                  markedDates={
                    selectedDate
                      ? {
                          [selectedDate]: {
                            selected: true,
                            selectedColor: "#2563EB",
                            selectedTextColor: "#FFFFFF",
                          },
                        }
                      : {}
                  }
                  minDate={new Date().toISOString().split("T")[0]}
                  theme={{
                    backgroundColor: "#ffffff",
                    calendarBackground: "#ffffff",
                    textSectionTitleColor: "#64748B",
                    selectedDayBackgroundColor: "#2563EB",
                    selectedDayTextColor: "#ffffff",
                    todayTextColor: "#2563EB",
                    dayTextColor: "#1E293B",
                    textDisabledColor: "#CBD5E1",
                    arrowColor: "#2563EB",
                    monthTextColor: "#0F172A",
                    textDayFontWeight: "600",
                    textMonthFontWeight: "bold",
                    textDayHeaderFontWeight: "600",
                    textDayFontSize: 13,
                    textMonthFontSize: 14,
                    textDayHeaderFontSize: 11,
                  }}
                />
              </View>
            </View>

            {/* Right Column: Dynamic Slots & Actions */}
            <View className="flex-1">
              {!selectedDate ? (
                <View className="h-full min-h-[300px] bg-white rounded-3xl p-8 border border-dashed border-slate-200 items-center justify-center">
                  <Text className="text-4xl mb-3">📅</Text>
                  <Text className="text-slate-800 font-bold text-base mb-1">
                    No Date Selected
                  </Text>
                  <Text className="text-slate-400 text-xs text-center max-w-xs">
                    Please pick a date on the calendar to dynamically calculate the doctor's open consultation slots.
                  </Text>
                </View>
              ) : (
                <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
                  <View className="flex-row items-center justify-between pb-4 mb-4 border-b border-slate-100">
                    <View>
                      <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        2. Select Time Slot
                      </Text>
                      <Text className="text-slate-900 font-bold text-lg mt-0.5">
                        {new Date(selectedDate + "T00:00:00").toLocaleDateString([], {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </View>
                    {slotsLoading && (
                      <Text className="text-xs text-blue-600 font-semibold animate-pulse">
                        Calculating slots…
                      </Text>
                    )}
                  </View>

                  {/* Slot Picker Component */}
                  {slotsLoading ? (
                    <View className="py-12 items-center">
                      <Text className="text-slate-400 text-xs font-medium">
                        Running dynamic slot generation algorithm…
                      </Text>
                    </View>
                  ) : (
                    <SlotPicker
                      slots={availableSlots}
                      selected={selectedSlot}
                      onSelect={setSelectedSlot}
                      bookedSlots={[]}
                      duration={doctor?.consultation_duration ?? 15}
                    />
                  )}

                  {/* Confirm Booking CTA */}
                  {selectedSlot && (
                    <View className="mt-6 pt-5 border-t border-slate-100">
                      <TouchableOpacity
                        onPress={handleBook}
                        disabled={booking}
                        className={`w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-2xl py-4 items-center justify-center shadow-md transition ${
                          booking ? "opacity-60" : ""
                        }`}
                      >
                        <Text className="text-white font-extrabold text-base">
                          {booking ? "Locking & Confirming Slot…" : "Confirm Appointment"}
                        </Text>
                        <Text className="text-blue-100 text-xs mt-0.5">
                          Guaranteed atomic double-booking protection
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Waitlist Section when no slots available */}
                  {noSlotsLeft && (
                    <View className="mt-6 bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
                      <View className="flex-row items-center mb-2">
                        <Text className="text-xl mr-2">⏳</Text>
                        <Text className="text-amber-900 font-bold text-sm">
                          Doctor is Fully Booked on this Date
                        </Text>
                      </View>
                      <Text className="text-amber-800 text-xs mb-4 leading-relaxed">
                        Join our <Text className="font-bold">Priority Auto-Reallocation Waitlist</Text>. If any patient cancels an appointment (at least 2 hours before), the system automatically allocates the freed slot to the highest urgency patient.
                      </Text>

                      <Text className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                        Choose Urgency Level:
                      </Text>

                      <View className="flex-row flex-wrap gap-2">
                        {[
                          { level: "critical", label: "Critical", bg: "bg-rose-600 text-white" },
                          { level: "high", label: "High", bg: "bg-orange-600 text-white" },
                          { level: "medium", label: "Medium", bg: "bg-amber-600 text-white" },
                          { level: "low", label: "Low", bg: "bg-slate-700 text-white" },
                        ].map((u) => (
                          <TouchableOpacity
                            key={u.level}
                            onPress={() => handleJoinWaitlist(u.level as UrgencyLevel)}
                            disabled={joiningWaitlist}
                            className={`px-3.5 py-2 rounded-xl shadow-sm ${u.bg}`}
                          >
                            <Text className="text-xs font-bold text-white capitalize">
                              + {u.label} Priority
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
