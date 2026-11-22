import React from "react";
import { Tabs } from "expo-router";
import { Text, Platform } from "react-native";

export default function PatientLayout() {
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
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: "Doctors",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>👨‍⚕️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "My Consults",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>📅</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="waitlist"
        options={{
          title: "Waitlist",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>⏳</Text>
          ),
        }}
      />
      {/* Hidden sub-route */}
      <Tabs.Screen name="book/[doctorId]" options={{ href: null }} />
    </Tabs>
  );
}
