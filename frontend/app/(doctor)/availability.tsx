import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doctorsService, DayAvailability } from "../../services/doctors";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { AppHeader } from "../../components/AppHeader";
import { ResponsiveContainer } from "../../components/ResponsiveContainer";
import { useRouter } from "expo-router";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function emptyDay(day: string): DayAvailability {
  return {
    day,
    start_time: "09:00",
    end_time: "17:00",
    breaks: [{ start: "13:00", end: "14:00" }],
    is_available: false,
  };
}

export default function AvailabilityScreen() {
  const router = useRouter();
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
      const updated = DAYS.map((day) => {
        const existing = p.availability?.find(
          (a: DayAvailability) => a.day.toLowerCase() === day
        );
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
    const durNum = parseInt(duration, 10);
    if (isNaN(durNum) || durNum < 5 || durNum > 180) {
      if (Platform.OS === "web") {
        window.alert("Validation: Consultation duration must be between 5 and 180 minutes.");
      } else {
        Alert.alert("Validation", "Consultation duration must be between 5 and 180 minutes.");
      }
      return;
    }
    setSaving(true);
    try {
      await doctorsService.updateProfile({
        specialty: specialty.trim(),
        consultation_duration: durNum,
        availability: days.filter((d) => d.is_available),
      });
      const successMsg = "Schedule Saved: Your weekly working schedule and consultation duration have been updated successfully.";
      if (Platform.OS === "web") {
        window.alert(successMsg);
      } else {
        Alert.alert("Schedule Saved", successMsg);
      }
    } catch (e: any) {
      if (Platform.OS === "web") {
        window.alert("Save Error: " + (e.message || "Failed to update"));
      } else {
        Alert.alert("Save Error", e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading availability profile…" />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <AppHeader showBack />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
      >
        <ResponsiveContainer maxWidth="lg">
          {/* Header */}
          <View className="mb-5 flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-black text-slate-900 tracking-tight">
                Practice & Schedule Settings
              </Text>
              <Text className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Define your specialty, dynamic slot duration, and working hours for each day.
              </Text>
            </View>
          </View>

          {/* Specialty & Duration Card */}
          <View className="bg-white rounded-3xl p-6 mb-5 shadow-sm border border-slate-200/80">
            <Text className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
              General Parameters
            </Text>

            <View className="flex-col sm:flex-row gap-4 mb-2">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Medical Specialty
                </Text>
                <TextInput
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition text-sm"
                  value={specialty}
                  onChangeText={setSpecialty}
                  placeholder="e.g. Cardiology, Neurology, Pediatrics"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View className="sm:w-56">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Slot Duration (Minutes)
                </Text>
                <TextInput
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition text-sm font-bold"
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                  placeholder="15"
                  placeholderTextColor="#94A3B8"
                />
                <Text className="text-[11px] text-slate-400 mt-1">
                  e.g. 15 for checkups, 45 for deep diagnostics
                </Text>
              </View>
            </View>
          </View>

          {/* Weekly Hours Grid */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 mb-6">
            <Text className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2">
              Weekly Working Hours & Breaks
            </Text>
            <Text className="text-slate-500 text-xs mb-5">
              The dynamic engine generates slots only within these active hours and skips specified break times.
            </Text>

            {days.map((day, i) => (
              <View
                key={day.day}
                className={`py-3.5 ${
                  i < days.length - 1 ? "border-b border-slate-100" : ""
                }`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Text className="font-extrabold text-slate-900 capitalize text-sm mr-2 w-28">
                      {day.day}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        day.is_available ? "bg-emerald-50" : "bg-slate-100"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          day.is_available ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        {day.is_available ? "Active" : "Off"}
                      </Text>
                    </View>
                  </View>

                  <Switch
                    value={day.is_available}
                    onValueChange={(v) => updateDay(i, "is_available", v)}
                    trackColor={{ true: "#2563EB", false: "#E2E8F0" }}
                  />
                </View>

                {day.is_available && (
                  <View className="flex-row gap-3 mt-1.5 pl-2">
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-slate-500 mb-1">
                        Shift Start (HH:MM)
                      </Text>
                      <TextInput
                        className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 text-xs font-semibold"
                        value={day.start_time}
                        onChangeText={(v) => updateDay(i, "start_time", v)}
                        placeholder="09:00"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-slate-500 mb-1">
                        Shift End (HH:MM)
                      </Text>
                      <TextInput
                        className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 text-xs font-semibold"
                        value={day.end_time}
                        onChangeText={(v) => updateDay(i, "end_time", v)}
                        placeholder="17:00"
                      />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-2xl py-4 items-center justify-center shadow-md mb-8 ${
              saving ? "opacity-60" : ""
            }`}
          >
            <Text className="text-white font-extrabold text-base">
              {saving ? "Saving Schedule…" : "Save Weekly Schedule"}
            </Text>
          </TouchableOpacity>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
