import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PatientHome() {
  const router = useRouter();
  const { name, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const cards = [
    {
      icon: "👨‍⚕️",
      title: "Find a Doctor",
      subtitle: "Browse by specialty",
      route: "/(patient)/doctors",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      icon: "📅",
      title: "My Appointments",
      subtitle: "View upcoming & past",
      route: "/(patient)/appointments",
      bg: "bg-green-50",
      border: "border-green-100",
    },
    {
      icon: "⏳",
      title: "My Waitlist",
      subtitle: "Track priority slots",
      route: "/(patient)/waitlist",
      bg: "bg-yellow-50",
      border: "border-yellow-100",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Hello, {name?.split(" ")[0]}! 👋</Text>
            <Text className="text-muted text-sm">What would you like to do today?</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} className="bg-red-50 px-3 py-2 rounded-xl">
            <Text className="text-danger text-sm font-medium">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Quick action cards */}
        {cards.map((card) => (
          <TouchableOpacity
            key={card.route}
            onPress={() => router.push(card.route as any)}
            className={`${card.bg} border ${card.border} rounded-2xl p-5 mb-4 flex-row items-center`}
          >
            <Text className="text-4xl mr-4">{card.icon}</Text>
            <View>
              <Text className="text-gray-900 font-semibold text-base">{card.title}</Text>
              <Text className="text-muted text-sm">{card.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Info banner */}
        <View className="bg-primary rounded-2xl p-4 mt-2">
          <Text className="text-white font-semibold mb-1">⚡ Live Availability</Text>
          <Text className="text-blue-100 text-sm">
            Slot availability updates in real-time. If a slot appears and disappears,
            another patient booked it just now!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
