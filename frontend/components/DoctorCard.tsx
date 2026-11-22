import { TouchableOpacity, View, Text } from "react-native";
import { Doctor } from "../services/doctors";
import { useRouter } from "expo-router";

interface Props {
  doctor: Doctor;
}

export function DoctorCard({ doctor }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(patient)/book/${doctor.id}`)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      {/* Avatar placeholder */}
      <View className="flex-row items-center mb-2">
        <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mr-3">
          <Text className="text-white text-lg font-bold">
            {doctor.name.charAt(3).toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold text-base">{doctor.name}</Text>
          <Text className="text-primary text-sm">{doctor.specialty || "General"}</Text>
        </View>
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="text-muted text-xs">
          ⏱ {doctor.consultation_duration} min slots
        </Text>
        <Text className="text-primary text-xs font-semibold">Book →</Text>
      </View>
    </TouchableOpacity>
  );
}
