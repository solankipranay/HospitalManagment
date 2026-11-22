import React from "react";
import { View, Text, TouchableOpacity, Alert, Platform } from "react-native";
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

export function AppointmentCard({
  appointment: a,
  isDoctor = false,
  onRefresh,
}: Props) {
  const startMs = new Date(a.start_time).getTime();
  const nowMs = Date.now();
  const hoursUntil = (startMs - nowMs) / (1000 * 60 * 60);

  // 2-hour cancellation rule condition
  const canCancel = !isDoctor && a.status === "Scheduled" && hoursUntil >= 2;

  const doCancel = async () => {
    try {
      const res = await appointmentsService.cancel(a.id);
      const msg = res.notice || "Your slot has been cancelled successfully.";
      if (Platform.OS === "web") {
        window.alert("Appointment Cancelled: " + msg);
      } else {
        Alert.alert("Appointment Cancelled", msg);
      }
      onRefresh();
    } catch (e: any) {
      if (Platform.OS === "web") {
        window.alert("Cancellation Error: " + (e.message || "Failed to cancel"));
      } else {
        Alert.alert("Cancellation Error", e.message);
      }
    }
  };

  const handleCancel = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to cancel this appointment?\n\nIf any patient is waiting on the priority waitlist, this slot will be auto-reallocated immediately."
      );
      if (confirmed) {
        doCancel();
      }
    } else {
      Alert.alert(
        "Confirm Cancellation",
        "Are you sure you want to cancel this appointment? This slot will be auto-reallocated to any priority patient on the waitlist.",
        [
          { text: "Keep Appointment", style: "cancel" },
          { text: "Cancel Slot", style: "destructive", onPress: doCancel },
        ]
      );
    }
  };

  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-200/80 hover:shadow-md transition">
      {/* Top Bar: Title & Status */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center flex-wrap gap-2 mb-1">
            <Text className="text-slate-900 font-bold text-base">
              {isDoctor ? a.patient_name : a.doctor_name}
            </Text>
            {a.auto_assigned && (
              <View className="bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <Text className="text-emerald-700 text-[10px] font-bold">
                  ⚡ Waitlist Priority Auto-Assigned
                </Text>
              </View>
            )}
          </View>
          <Text className="text-slate-500 text-xs font-medium">{fmtDate(a.start_time)}</Text>
        </View>

        <StatusBadge status={a.status} />
      </View>

      {/* Time & Slot Details */}
      <View className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-blue-600 mr-2 text-base">🕐</Text>
          <Text className="text-slate-700 font-semibold text-sm">
            {fmtTime(a.start_time)} – {fmtTime(a.end_time)}
          </Text>
        </View>

        {a.status === "Scheduled" && !isDoctor && (
          <Text
            className={`text-xs font-medium ${
              hoursUntil >= 2 ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {hoursUntil >= 2
              ? "Eligible to cancel"
              : "Within 2h lock window"}
          </Text>
        )}
      </View>

      {/* Clinical Notes & Diagnosis (if completed) */}
      {(a.diagnosis || a.notes) && (
        <View className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 mb-3">
          {a.diagnosis && (
            <Text className="text-slate-800 text-xs font-semibold mb-1">
              🩺 Diagnosis: <Text className="font-normal text-slate-700">{a.diagnosis}</Text>
            </Text>
          )}
          {a.notes && (
            <Text className="text-slate-800 text-xs font-semibold">
              📝 Notes: <Text className="font-normal text-slate-700">{a.notes}</Text>
            </Text>
          )}
        </View>
      )}

      {/* Cancellation Action Button */}
      {canCancel && (
        <TouchableOpacity
          onPress={handleCancel}
          className="bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-xl py-2.5 items-center justify-center transition"
        >
          <Text className="text-rose-700 text-xs font-bold">Cancel Appointment</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
