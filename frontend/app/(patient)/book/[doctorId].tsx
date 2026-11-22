import { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Alert,
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

  // ★ Live WebSocket updates
  const { liveBookedSlots } = useWebSocket(doctorId ?? "", selectedDate);

  useEffect(() => {
    if (doctorId) {
      doctorsService.getById(doctorId).then((d) => { setDoctor(d); setLoading(false); });
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
      Alert.alert("✅ Booked!", "Your appointment has been confirmed.", [
        { text: "OK", onPress: () => router.replace("/(patient)/appointments") },
      ]);
    } catch (e: any) {
      Alert.alert("Booking Failed", e.message);
      // Refresh slots on conflict
      if (selectedDate) handleDateSelect({ dateString: selectedDate });
    } finally {
      setBooking(false);
    }
  };

  const handleJoinWaitlist = async (urgency: UrgencyLevel) => {
    try {
      await waitlistService.join(doctorId!, selectedDate, urgency);
      Alert.alert(
        "Added to Waitlist",
        `You'll be auto-assigned the next available slot on ${selectedDate} based on priority.`
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading doctor info…" />;

  const allBookedSlots = [...liveBookedSlots];
  const availableSlots = slots.filter((s) => !allBookedSlots.includes(s));
  const noSlotsLeft = selectedDate && !slotsLoading && availableSlots.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Back + Doctor info */}
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-semibold">← Back</Text>
        </TouchableOpacity>

        <View className="bg-white rounded-2xl p-4 shadow-sm mb-5">
          <Text className="text-xl font-bold text-gray-900">{doctor?.name}</Text>
          <Text className="text-primary">{doctor?.specialty}</Text>
          <Text className="text-muted text-sm mt-1">
            ⏱ {doctor?.consultation_duration} min per appointment
          </Text>
        </View>

        {/* Calendar */}
        <Text className="text-base font-semibold text-gray-700 mb-2">Select a Date</Text>
        <View className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm">
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={
              selectedDate
                ? { [selectedDate]: { selected: true, selectedColor: "#0066CC" } }
                : {}
            }
            minDate={new Date().toISOString().split("T")[0]}
            theme={{
              selectedDayBackgroundColor: "#0066CC",
              todayTextColor: "#0066CC",
              arrowColor: "#0066CC",
            }}
          />
        </View>

        {/* Slots */}
        {selectedDate && (
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <Text className="text-base font-semibold text-gray-700 mb-3">
              Available Slots — {selectedDate}
            </Text>
            {slotsLoading ? (
              <Text className="text-muted text-sm">Loading slots…</Text>
            ) : (
              <SlotPicker
                slots={availableSlots}
                selected={selectedSlot}
                onSelect={setSelectedSlot}
                bookedSlots={[]}
                duration={doctor?.consultation_duration ?? 15}
              />
            )}
          </View>
        )}

        {/* Book button */}
        {selectedSlot && (
          <TouchableOpacity
            onPress={handleBook}
            disabled={booking}
            className={`bg-primary rounded-2xl py-4 items-center mb-4 ${booking ? "opacity-60" : ""}`}
          >
            <Text className="text-white font-semibold text-base">
              {booking ? "Booking…" : "Confirm Appointment"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Waitlist option when no slots */}
        {noSlotsLeft && (
          <View className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
            <Text className="text-yellow-800 font-semibold mb-2">No slots available</Text>
            <Text className="text-yellow-700 text-sm mb-3">
              Join the waitlist — you'll be auto-assigned the next cancelled slot based on urgency.
            </Text>
            {(["low", "medium", "high", "critical"] as UrgencyLevel[]).map((u) => (
              <TouchableOpacity
                key={u}
                onPress={() => handleJoinWaitlist(u)}
                className="bg-white border border-yellow-200 rounded-xl py-2 mb-2 items-center"
              >
                <Text className="text-yellow-800 font-medium capitalize">{u} urgency</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
