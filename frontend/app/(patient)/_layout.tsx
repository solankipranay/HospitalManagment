import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0066CC",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: { borderTopColor: "#F1F5F9" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }}
      />
      <Tabs.Screen
        name="doctors"
        options={{ title: "Doctors", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👨‍⚕️</Text> }}
      />
      <Tabs.Screen
        name="appointments"
        options={{ title: "Appointments", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📅</Text> }}
      />
      <Tabs.Screen
        name="waitlist"
        options={{ title: "Waitlist", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⏳</Text> }}
      />
      {/* Hidden screens (accessed via router.push) */}
      <Tabs.Screen name="book/[doctorId]" options={{ href: null }} />
    </Tabs>
  );
}
