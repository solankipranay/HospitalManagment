import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function DoctorLayout() {
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
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: "Availability",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗓️</Text>,
        }}
      />
      {/* Hidden detail screen */}
      <Tabs.Screen name="appointment/[id]" options={{ href: null }} />
    </Tabs>
  );
}
