import React from "react";
import { Tabs } from "expo-router";
import { Text, Platform } from "react-native";

export default function DoctorLayout() {
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          height: isWeb ? 60 : 64,
          paddingBottom: isWeb ? 8 : 10,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: "Schedule Settings",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>🗓️</Text>
          ),
        }}
      />
      {/* Hidden sub-route */}
      <Tabs.Screen name="appointment/[id]" options={{ href: null }} />
    </Tabs>
  );
}
