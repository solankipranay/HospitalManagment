import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  appointmentsService,
  Appointment,
  AppointmentStatus,
} from "../../../services/appointments";
import { StatusBadge } from "../../../components/StatusBadge";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { AppHeader } from "../../../components/AppHeader";
import { ResponsiveContainer } from "../../../components/ResponsiveContainer";

const NEXT_STATUS: Record<string, AppointmentStatus | null> = {
  Scheduled: "In_Progress",
  In_Progress: "Completed",
  Completed: null,
  Cancelled: null,
};

const NEXT_LABEL: Record<string, string> = {
  Scheduled: "▶ Begin Consultation (In Progress)",
  In_Progress: "✅ Complete Consultation",
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAppt = async () => {
    try {
      const all = await appointmentsService.mine();
      const found = all.find((a) => a.id === id);
      if (found) {
        setAppt(found);
        setNotes(found.notes ?? "");
        setDiagnosis(found.diagnosis ?? "");
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppt();
  }, [id]);

  const handleStatusChange = async () => {
    if (!appt) return;
    const nextStatus = NEXT_STATUS[appt.status];
    if (!nextStatus) return;

    setUpdating(true);
    try {
      await appointmentsService.updateStatus(appt.id, nextStatus);
      await fetchAppt();
    } catch (e: any) {
      Alert.alert("Status Transition Error", e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!appt || appt.status !== "Completed") return;
    if (!diagnosis.trim()) {
      Alert.alert("Validation", "Please provide a diagnosis before saving.");
      return;
    }
    setSaving(true);
    try {
      await appointmentsService.updateNotes(appt.id, notes, diagnosis);
      Alert.alert("Records Saved", "Clinical notes & diagnosis updated successfully.");
    } catch (e: any) {
      Alert.alert("Save Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading patient file…" />;
  if (!appt) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-slate-600 font-bold mb-4">Appointment not found.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-blue-600 px-4 py-2 rounded-xl"
        >
          <Text className="text-white text-xs font-bold">Return to Dashboard</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const nextStatus = NEXT_STATUS[appt.status];

  // Steps for consultation progress
  const steps = [
    { label: "Scheduled", active: true },
    { label: "In Progress", active: appt.status === "In_Progress" || appt.status === "Completed" },
    { label: "Completed", active: appt.status === "Completed" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <AppHeader showBack />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
      >
        <ResponsiveContainer maxWidth="md">
          {/* Back link */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center self-start mb-4 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm"
          >
            <Text className="text-blue-600 font-bold text-xs mr-1">←</Text>
            <Text className="text-slate-700 font-semibold text-xs">Back to Dashboard</Text>
          </TouchableOpacity>

          {/* Patient Overview Card */}
          <View className="bg-white rounded-3xl p-6 mb-5 shadow-sm border border-slate-200/80">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 mr-3">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Patient File
                </Text>
                <Text className="text-2xl font-black text-slate-900 mt-0.5">
                  {appt.patient_name}
                </Text>
                <Text className="text-slate-500 text-xs mt-1">
                  Scheduled: {fmtDateTime(appt.start_time)}
                </Text>
              </View>

              <StatusBadge status={appt.status} />
            </View>

            {appt.auto_assigned && (
              <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-4">
                <Text className="text-emerald-800 text-xs font-bold">
                  ⚡ Auto-Assigned from Priority Waitlist
                </Text>
                <Text className="text-emerald-700 text-xs mt-0.5">
                  Slot was automatically allocated when another appointment was cancelled.
                </Text>
              </View>
            )}

            {/* Stepper progress visual */}
            <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Consultation Status Lifecycle
              </Text>
              <View className="flex-row items-center justify-between">
                {steps.map((st, i) => (
                  <View key={st.label} className="flex-row items-center flex-1">
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center ${
                        st.active ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      <Text className="text-white text-[10px] font-black">{i + 1}</Text>
                    </View>
                    <Text
                      className={`text-xs ml-1.5 font-bold ${
                        st.active ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {st.label}
                    </Text>
                    {i < steps.length - 1 && (
                      <View
                        className={`flex-1 h-[2px] mx-2 ${
                          steps[i + 1].active ? "bg-blue-600" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Action to update status */}
          {nextStatus && (
            <View className="bg-white rounded-3xl p-5 mb-5 shadow-sm border border-slate-200/80">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Transition Appointment Status
              </Text>
              <TouchableOpacity
                onPress={handleStatusChange}
                disabled={updating}
                className={`bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-2xl py-4 items-center justify-center shadow-sm ${
                  updating ? "opacity-60" : ""
                }`}
              >
                <Text className="text-white font-extrabold text-sm sm:text-base">
                  {updating ? "Updating Status…" : NEXT_LABEL[appt.status]}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notes & Diagnosis Editor (Available when Completed) */}
          {appt.status === "Completed" ? (
            <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 mb-6">
              <Text className="text-base font-extrabold text-slate-900 mb-1">
                📝 Clinical Notes & Diagnosis
              </Text>
              <Text className="text-slate-500 text-xs mb-4">
                Recorded medical notes and diagnosis are accessible by the patient.
              </Text>

              {/* Diagnosis Input */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Diagnosis / Assessment *
                </Text>
                <TextInput
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition text-sm"
                  value={diagnosis}
                  onChangeText={setDiagnosis}
                  placeholder="e.g. Mild viral rhinitis with low-grade fever"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Notes Input */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Consultation Notes & Prescription
                </Text>
                <TextInput
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition text-sm"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholder="Prescription details, advised lifestyle adjustments, and follow-up timeline…"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <TouchableOpacity
                onPress={handleSaveNotes}
                disabled={saving}
                className={`bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-2xl py-3.5 items-center justify-center shadow-sm ${
                  saving ? "opacity-60" : ""
                }`}
              >
                <Text className="text-white font-extrabold text-sm">
                  {saving ? "Saving Records…" : "💾 Save Clinical Records"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-slate-100 rounded-2xl p-4 border border-slate-200 items-center">
              <Text className="text-slate-500 text-xs text-center font-medium">
                Clinical diagnosis and prescription entry will unlock once consultation status is transitioned to <Text className="font-bold text-slate-700">Completed</Text>.
              </Text>
            </View>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
