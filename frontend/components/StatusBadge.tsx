import React from "react";
import { View, Text } from "react-native";
import { AppointmentStatus } from "../services/appointments";

const CONFIG: Record<
  AppointmentStatus,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  Scheduled: {
    label: "Scheduled",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: "📅",
  },
  In_Progress: {
    label: "In Progress",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "⚡",
  },
  Completed: {
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "✅",
  },
  Cancelled: {
    label: "Cancelled",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "✕",
  },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const c = CONFIG[status] ?? CONFIG.Scheduled;
  return (
    <View
      className={`flex-row items-center rounded-full px-2.5 py-1 ${c.bg} border ${c.border} self-start`}
    >
      <Text className="text-[11px] mr-1">{c.icon}</Text>
      <Text className={`text-xs font-semibold ${c.text}`}>{c.label}</Text>
    </View>
  );
}
