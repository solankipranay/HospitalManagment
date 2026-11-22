import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { waitlistService, WaitlistEntry } from "../../services/waitlist";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { AppHeader } from "../../components/AppHeader";
import { ResponsiveContainer } from "../../components/ResponsiveContainer";

const URGENCY_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", label: "Critical Priority (Level 4)" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "High Priority (Level 3)" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Medium Priority (Level 2)" },
  low: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", label: "Standard Priority (Level 1)" },
};

export default function WaitlistScreen() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const data = await waitlistService.mine();
      setEntries(data);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleLeave = (id: string) => {
    const doLeave = async () => {
      try {
        await waitlistService.leave(id);
        fetch();
      } catch (e: any) {
        if (Platform.OS === "web") {
          window.alert("Error: " + e.message);
        } else {
          Alert.alert("Error", e.message);
        }
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to withdraw your waitlist request for this doctor and date?")) {
        doLeave();
      }
    } else {
      Alert.alert(
        "Remove From Waitlist",
        "Are you sure you want to withdraw your waitlist request for this doctor and date?",
        [
          { text: "Keep My Place", style: "cancel" },
          { text: "Remove Me", style: "destructive", onPress: doLeave },
        ]
      );
    }
  };

  if (loading) return <LoadingSpinner message="Loading waitlist queue…" />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <AppHeader />
      <ResponsiveContainer maxWidth="lg" className="px-4 py-6">
        {/* Title */}
        <View className="mb-5">
          <Text className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
            Priority Waitlist Queue
          </Text>
          <Text className="text-slate-500 text-xs sm:text-sm">
            When another patient cancels their appointment, the dynamic engine automatically reallocates that slot based on medical urgency.
          </Text>
        </View>

        {/* Explain Card */}
        <View className="bg-blue-50/70 border border-blue-200 rounded-3xl p-5 mb-5 flex-row items-center">
          <Text className="text-2xl mr-3">🔄</Text>
          <View className="flex-1">
            <Text className="text-blue-900 font-bold text-xs mb-0.5">
              Automated Reallocation System
            </Text>
            <Text className="text-blue-700 text-xs leading-relaxed">
              Slots are prioritized by urgency rating: Critical &gt; High &gt; Medium &gt; Low. If multiple patients share the same urgency, allocation uses First-Come First-Served.
            </Text>
          </View>
        </View>

        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetch();
              }}
            />
          }
          ListEmptyComponent={
            <View className="items-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6">
              <Text className="text-3xl mb-2">⏳</Text>
              <Text className="text-slate-800 font-bold text-base">
                No active waitlist entries
              </Text>
              <Text className="text-slate-400 text-xs mt-1 text-center max-w-xs">
                When you encounter a doctor whose calendar is fully booked on your preferred date, you can join their waitlist.
              </Text>
            </View>
          }
          renderItem={({ item: e }) => {
            const conf = URGENCY_STYLES[e.urgency_level] ?? URGENCY_STYLES.medium;
            return (
              <View className="bg-white rounded-2xl p-5 mb-3.5 shadow-sm border border-slate-200/80">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="font-bold text-slate-900 text-base">
                      {e.doctor_name}
                    </Text>
                    <Text className="text-slate-500 text-xs mt-0.5">
                      Requested Date: <Text className="font-semibold text-slate-700">{e.preferred_date}</Text>
                    </Text>
                  </View>

                  <View className={`rounded-full px-2.5 py-1 border ${conf.bg} ${conf.border}`}>
                    <Text className={`text-[11px] font-bold ${conf.text}`}>
                      {conf.label}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center pt-3 border-t border-slate-100 mt-2">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                    <Text className="text-slate-500 text-xs font-medium">
                      Status: Standing by for open slot
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleLeave(e.id)}
                    className="p-1"
                  >
                    <Text className="text-rose-600 text-xs font-bold hover:underline">
                      Withdraw Request
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
