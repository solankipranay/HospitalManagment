import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doctorsService, Doctor } from "../../services/doctors";
import { DoctorCard } from "../../components/DoctorCard";
import { LoadingSpinner } from "../../components/LoadingSpinner";

export default function DoctorsScreen() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filtered, setFiltered] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctors = async () => {
    try {
      const data = await doctorsService.list();
      setDoctors(data);
      setFiltered(data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(doctors);
    } else {
      setFiltered(
        doctors.filter(
          (d) =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.specialty.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, doctors]);

  if (loading) return <LoadingSpinner message="Loading doctors…" />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 mb-3">Find a Doctor</Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
          placeholder="Search by name or specialty…"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => <DoctorCard doctor={item} />}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDoctors(); }} />
        }
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-muted text-base">No doctors found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
