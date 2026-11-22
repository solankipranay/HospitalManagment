import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Doctor } from "../services/doctors";
import { useRouter } from "expo-router";

interface Props {
  doctor: Doctor;
}

export function DoctorCard({ doctor }: Props) {
  const router = useRouter();

  // Extract clean initials
  const cleanName = doctor.name.replace(/^Dr\.\s*/i, "");
  const initial = (cleanName[0] || doctor.name[0] || "D").toUpperCase();

  // Specialty color theme
  const isCardio = doctor.specialty?.toLowerCase().includes("cardio");
  const badgeBg = isCardio ? "bg-rose-50 border-rose-200" : "bg-blue-50 border-blue-200";
  const badgeText = isCardio ? "text-rose-700" : "text-blue-700";

  // Working days count
  const activeDays = (doctor.availability || []).filter((a) => a.is_available).length;

  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-200/80 hover:shadow-md hover:border-blue-300 transition duration-150">
      <View className="flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Doctor Info Block */}
        <View className="flex-row items-center flex-1">
          <View className="w-14 h-14 rounded-2xl bg-gradient-to-tr bg-blue-600 items-center justify-center mr-4 shadow-sm">
            <Text className="text-white text-xl font-black">{initial}</Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center flex-wrap gap-2 mb-1">
              <Text className="text-slate-900 font-bold text-lg">{doctor.name}</Text>
              <View className={`px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
                <Text className={`text-xs font-semibold ${badgeText}`}>
                  {doctor.specialty || "General Medicine"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center flex-wrap gap-3 mt-1">
              <View className="flex-row items-center">
                <Text className="text-slate-500 text-xs">
                  ⏱ <Text className="font-semibold text-slate-700">{doctor.consultation_duration} mins</Text> / slot
                </Text>
              </View>
              <Text className="text-slate-300">•</Text>
              <View className="flex-row items-center">
                <Text className="text-slate-500 text-xs">
                  🗓 <Text className="font-semibold text-slate-700">{activeDays} days</Text> / week
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={() => router.push(`/(patient)/book/${doctor.id}`)}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl px-5 py-3 items-center justify-center flex-row shadow-sm"
        >
          <Text className="text-white font-semibold text-sm mr-1">Book Slot</Text>
          <Text className="text-white font-bold text-sm">→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
