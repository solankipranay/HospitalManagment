import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Alert, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { waitlistService, WaitlistEntry } from "../../services/waitlist";
import { LoadingSpinner } from "../../components/LoadingSpinner";

const URGENCY_COLORS: Record<string, string> = {
  low:      "bg-gray-100 text-gray-700",
  medium:   "bg-blue-100 text-blue-700",
  high:     "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function WaitlistScreen() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const data = await waitlistService.mine();
      setEntries(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleLeave = (id: string) => {
    Alert.alert("Leave Waitlist", "Remove yourself from this waitlist?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          await waitlistService.leave(id);
          fetch();
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner message="Loading waitlist…" />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 mb-1">My Waitlist</Text>
        <Text className="text-muted text-sm mb-4">
          When a slot opens, the highest priority patient is auto-assigned.
        </Text>
      </View>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} />}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-muted">You are not on any waitlist.</Text>
            <Text className="text-muted text-sm mt-1">
              Book a slot or join waitlist from the booking screen.
            </Text>
          </View>
        }
        renderItem={({ item: e }) => {
          const colorClass = URGENCY_COLORS[e.urgency_level] ?? URGENCY_COLORS.medium;
          return (
            <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
              <Text className="font-semibold text-gray-900">{e.doctor_name}</Text>
              <Text className="text-muted text-sm mb-2">{e.preferred_date}</Text>
              <View className="flex-row justify-between items-center">
                <View className={`rounded-full px-3 py-1 ${colorClass.split(" ")[0]}`}>
                  <Text className={`text-xs font-semibold capitalize ${colorClass.split(" ")[1]}`}>
                    {e.urgency_level} priority
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleLeave(e.id)}>
                  <Text className="text-danger text-sm">Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
