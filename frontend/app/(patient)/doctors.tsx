import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doctorsService, Doctor } from "../../services/doctors";
import { DoctorCard } from "../../components/DoctorCard";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { AppHeader } from "../../components/AppHeader";
import { ResponsiveContainer } from "../../components/ResponsiveContainer";

const SPECIALTY_CHIPS = ["All", "General Medicine", "Cardiology"];

export default function DoctorsScreen() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filtered, setFiltered] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctors = async () => {
    try {
      const data = await doctorsService.list();
      setDoctors(data);
      setFiltered(data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    let result = doctors;

    // Filter by Specialty
    if (selectedSpecialty !== "All") {
      result = result.filter((d) =>
        d.specialty?.toLowerCase().includes(selectedSpecialty.toLowerCase())
      );
    }

    // Filter by Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [search, selectedSpecialty, doctors]);

  if (loading) return <LoadingSpinner message="Loading doctors directory…" />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <AppHeader />
      <ResponsiveContainer maxWidth="lg" className="px-4 py-6">
        {/* Header & Search */}
        <View className="mb-5">
          <Text className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
            Browse Medical Specialists
          </Text>
          <Text className="text-slate-500 text-xs sm:text-sm mb-4">
            Select a doctor to inspect working hours and book dedicated consultation slots.
          </Text>

          {/* Search Box */}
          <View className="relative mb-3">
            <TextInput
              className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 shadow-sm text-sm focus:border-blue-500"
              placeholder="Search by doctor name or medical specialty…"
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Specialty Filter Chips */}
          <View className="flex-row gap-2 flex-wrap">
            {SPECIALTY_CHIPS.map((chip) => {
              const isSelected = selectedSpecialty === chip;
              return (
                <TouchableOpacity
                  key={chip}
                  onPress={() => setSelectedSpecialty(chip)}
                  className={`px-3.5 py-1.5 rounded-full border transition ${
                    isSelected
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Doctors List */}
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => <DoctorCard doctor={item} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchDoctors();
              }}
            />
          }
          ListEmptyComponent={
            <View className="items-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6">
              <Text className="text-3xl mb-2">🔍</Text>
              <Text className="text-slate-700 font-bold text-base">
                No matching doctors found
              </Text>
              <Text className="text-slate-400 text-xs mt-1 text-center">
                Try searching with a different term or clear the specialty filter.
              </Text>
            </View>
          }
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
