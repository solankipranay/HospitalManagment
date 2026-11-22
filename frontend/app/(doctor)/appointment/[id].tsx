import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert,
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

const NEXT_STATUS: Record<string, AppointmentStatus | null> = {
  Scheduled: "In_Progress",
  In_Progress: "Completed",
  Completed: null,
  Cancelled: null,
};

const NEXT_LABEL: Record<string, string> = {
  Scheduled: "▶ Start Consultation",
  In_Progress: "✅ Mark Completed",
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
    const all = await appointmentsService.mine();
    const found = all.find((a) => a.id === id);
    if (found) {
      setAppt(found);
      setNotes(found.notes ?? "");
      setDiagnosis(found.diagnosis ?? "");
    }
    setLoading(false);
  };

  useEffect(() => { fetchAppt(); }, [id]);

  const handleStatusChange = async () => {
    if (!appt) return;
    const nextStatus = NEXT_STATUS[appt.status];
    if (!nextStatus) return;

    setUpdating(true);
    try {
      await appointmentsService.updateStatus(appt.id, nextStatus);
      await fetchAppt();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!appt || appt.status !== "Completed") return;
    setSaving(true);
    try {
      await appointmentsService.updateNotes(appt.id, notes, diagnosis);
      Alert.alert("Saved", "Consultation notes saved successfully.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!appt) return (
    <SafeAreaView className="flex-1 bg-surface items-center justify-center">
      <Text className="text-muted">Appointment not found.</Text>
    </SafeAreaView>
  );

  const nextStatus = NEXT_STATUS[appt.status];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-semibold">← Back to Dashboard</Text>
        </TouchableOpacity>

        {/* Patient info */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-xl font-bold text-gray-900">{appt.patient_name}</Text>
              <Text className="text-muted text-sm mt-0.5">{fmtDateTime(appt.start_time)}</Text>
            </View>
            <StatusBadge status={appt.status} />
          </View>
          {appt.auto_assigned && (
            <View className="mt-2 bg-green-50 rounded-lg px-2 py-1 self-start">
              <Text className="text-xs text-secondary">⚡ Auto-assigned from waitlist</Text>
            </View>
          )}
        </View>

        {/* Status transition */}
        {nextStatus && (
          <TouchableOpacity
            onPress={handleStatusChange}
            disabled={updating}
            className={`bg-primary rounded-2xl py-4 items-center mb-4 ${updating ? "opacity-60" : ""}`}
          >
            <Text className="text-white font-semibold text-base">
              {updating ? "Updating…" : NEXT_LABEL[appt.status]}
            </Text>
          </TouchableOpacity>
        )}

        {/* Notes / Diagnosis (only after Completed) */}
        {appt.status === "Completed" && (
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <Text className="font-semibold text-gray-800 mb-3">📝 Consultation Notes</Text>

            <Text className="text-sm text-gray-600 mb-1">Notes</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 mb-4 bg-gray-50 text-gray-900"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Enter consultation notes…"
            />

            <Text className="text-sm text-gray-600 mb-1">Diagnosis</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 mb-4 bg-gray-50 text-gray-900"
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder="Enter diagnosis…"
            />

            <TouchableOpacity
              onPress={handleSaveNotes}
              disabled={saving}
              className={`bg-secondary rounded-xl py-3 items-center ${saving ? "opacity-60" : ""}`}
            >
              <Text className="text-white font-semibold">
                {saving ? "Saving…" : "Save Notes & Diagnosis"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Existing notes (read-only display) */}
        {appt.status !== "Completed" && (appt.notes || appt.diagnosis) && (
          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            {appt.notes && <Text className="text-sm text-gray-600">📋 {appt.notes}</Text>}
            {appt.diagnosis && (
              <Text className="text-sm text-gray-600 mt-2 italic">Dx: {appt.diagnosis}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
