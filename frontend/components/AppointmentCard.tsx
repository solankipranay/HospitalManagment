import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Appointment, appointmentsService } from "../services/appointments";
import { StatusBadge } from "./StatusBadge";

interface Props {
  appointment: Appointment;
  isDoctor?: boolean;
  onRefresh: () => void;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AppointmentCard({ appointment: a, isDoctor = false, onRefresh }: Props) {
  const handleCancel = () => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await appointmentsService.cancel(a.id);
              Alert.alert("Cancelled", "Your appointment has been cancelled.");
              onRefresh();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ]
    );
  };

  const canCancel =
    !isDoctor &&
    a.status === "Scheduled" &&
    new Date(a.start_time).getTime() - Date.now() > 2 * 60 * 60 * 1000;

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
      {a.auto_assigned && (
        <View className="bg-secondary rounded-full px-2 py-0.5 self-start mb-2">
          <Text className="text-white text-xs">Auto-assigned</Text>
        </View>
      )}

      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold text-base">
            {isDoctor ? a.patient_name : a.doctor_name}
          </Text>
          <Text className="text-muted text-sm">{fmtDate(a.start_time)}</Text>
        </View>
        <StatusBadge status={a.status} />
      </View>

      <Text className="text-gray-600 text-sm mb-1">
        🕐 {fmtTime(a.start_time)} – {fmtTime(a.end_time)}
      </Text>

      {a.diagnosis && (
        <Text className="text-gray-500 text-xs mt-2 italic">
          Diagnosis: {a.diagnosis}
        </Text>
      )}

      {canCancel && (
        <TouchableOpacity
          onPress={handleCancel}
          className="mt-3 bg-red-50 border border-red-200 rounded-xl py-2 items-center"
        >
          <Text className="text-danger text-sm font-semibold">Cancel Appointment</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
