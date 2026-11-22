import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doctorsService, DayAvailability } from "../../services/doctors";
import { LoadingSpinner } from "../../components/LoadingSpinner";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function emptyDay(day: string): DayAvailability {
  return { day, start_time: "09:00", end_time: "17:00", breaks: [], is_available: false };
}

export default function AvailabilityScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [days, setDays] = useState<DayAvailability[]>(DAYS.map(emptyDay));
  const [specialty, setSpecialty] = useState("");
  const [duration, setDuration] = useState("15");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    doctorsService.getMyProfile().then((p) => {
      setProfile(p);
      setSpecialty(p.specialty ?? "");
      setDuration(String(p.consultation_duration ?? 15));
      // Merge existing availability into days
      const updated = DAYS.map((day) => {
        const existing = p.availability?.find((a: DayAvailability) => a.day === day);
        return existing ?? emptyDay(day);
      });
      setDays(updated);
      setLoading(false);
    });
  }, []);

  const updateDay = (index: number, field: keyof DayAvailability, value: any) => {
    setDays((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await doctorsService.updateProfile({
        specialty,
        consultation_duration: parseInt(duration),
        availability: days.filter((d) => d.is_available),
      });
      Alert.alert("Saved", "Your availability has been updated.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile…" />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-5">My Availability</Text>

        {/* Specialty + Duration */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="font-semibold text-gray-700 mb-2">Specialty</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-4 bg-gray-50"
            value={specialty}
            onChangeText={setSpecialty}
            placeholder="e.g. Cardiology"
          />
          <Text className="font-semibold text-gray-700 mb-2">Consultation Duration (minutes)</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            placeholder="15"
          />
        </View>

        {/* Days */}
        {days.map((day, i) => (
          <View key={day.day} className="bg-white rounded-2xl p-4 shadow-sm mb-3">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-semibold text-gray-800 capitalize">{day.day}</Text>
              <Switch
                value={day.is_available}
                onValueChange={(v) => updateDay(i, "is_available", v)}
                trackColor={{ true: "#0066CC" }}
              />
            </View>
            {day.is_available && (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">Start</Text>
                  <TextInput
                    className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm"
                    value={day.start_time}
                    onChangeText={(v) => updateDay(i, "start_time", v)}
                    placeholder="09:00"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">End</Text>
                  <TextInput
                    className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm"
                    value={day.end_time}
                    onChangeText={(v) => updateDay(i, "end_time", v)}
                    placeholder="17:00"
                  />
                </View>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className={`bg-primary rounded-2xl py-4 items-center mt-2 mb-10 ${saving ? "opacity-60" : ""}`}
        >
          <Text className="text-white font-semibold text-base">
            {saving ? "Saving…" : "Save Availability"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
