import { View, Text } from "react-native";
import { AppointmentStatus } from "../services/appointments";

const CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string }> = {
  Scheduled:   { label: "Scheduled",   bg: "bg-blue-100",   text: "text-blue-700" },
  In_Progress: { label: "In Progress", bg: "bg-yellow-100", text: "text-yellow-700" },
  Completed:   { label: "Completed",   bg: "bg-green-100",  text: "text-green-700" },
  Cancelled:   { label: "Cancelled",   bg: "bg-red-100",    text: "text-red-700" },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const c = CONFIG[status] ?? CONFIG.Scheduled;
  return (
    <View className={`rounded-full px-3 py-1 ${c.bg} self-start`}>
      <Text className={`text-xs font-semibold ${c.text}`}>{c.label}</Text>
    </View>
  );
}
