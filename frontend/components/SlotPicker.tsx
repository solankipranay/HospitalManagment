import { View, Text, TouchableOpacity, ScrollView } from "react-native";

interface Props {
  slots: string[];
  selected: string | null;
  onSelect: (slot: string) => void;
  bookedSlots?: string[];
  duration: number;
}

function fmtSlot(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SlotPicker({ slots, selected, onSelect, bookedSlots = [], duration }: Props) {
  if (slots.length === 0) {
    return (
      <View className="py-6 items-center">
        <Text className="text-muted text-sm">No slots available for this date</Text>
      </View>
    );
  }

  return (
    <View>
      <Text className="text-xs text-muted mb-2">{duration}-min slots (IST)</Text>
      <View className="flex-row flex-wrap gap-2">
        {slots.map((slot) => {
          const isBooked = bookedSlots.includes(slot);
          const isSelected = selected === slot;
          return (
            <TouchableOpacity
              key={slot}
              disabled={isBooked}
              onPress={() => onSelect(slot)}
              className={[
                "px-4 py-2 rounded-xl border",
                isBooked
                  ? "bg-gray-100 border-gray-200 opacity-50"
                  : isSelected
                  ? "bg-primary border-primary"
                  : "bg-white border-gray-200",
              ].join(" ")}
            >
              <Text
                className={[
                  "text-sm font-medium",
                  isBooked
                    ? "text-muted"
                    : isSelected
                    ? "text-white"
                    : "text-gray-700",
                ].join(" ")}
              >
                {fmtSlot(slot)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
