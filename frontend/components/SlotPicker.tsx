import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

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

export function SlotPicker({
  slots,
  selected,
  onSelect,
  bookedSlots = [],
  duration,
}: Props) {
  if (slots.length === 0) {
    return (
      <View className="py-8 items-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <Text className="text-2xl mb-2">🗓️</Text>
        <Text className="text-slate-600 font-semibold text-sm">
          No available slots for this date
        </Text>
        <Text className="text-slate-400 text-xs mt-1 text-center max-w-xs">
          The doctor might not be available or all slots have been booked. You can join the priority waitlist below!
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Available Time Slots
        </Text>
        <View className="bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
          <Text className="text-[11px] font-bold text-blue-700">
            {duration} min duration
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2.5">
        {slots.map((slot) => {
          const isBooked = bookedSlots.includes(slot);
          const isSelected = selected === slot;

          return (
            <TouchableOpacity
              key={slot}
              disabled={isBooked}
              onPress={() => onSelect(slot)}
              className={[
                "px-3.5 py-2.5 rounded-xl border transition items-center justify-center min-w-[95px]",
                isBooked
                  ? "bg-slate-100 border-slate-200 opacity-40 cursor-not-allowed"
                  : isSelected
                  ? "bg-blue-600 border-blue-600 shadow-sm"
                  : "bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/40",
              ].join(" ")}
            >
              <Text
                className={[
                  "text-xs font-bold",
                  isBooked
                    ? "text-slate-400 line-through"
                    : isSelected
                    ? "text-white"
                    : "text-slate-800",
                ].join(" ")}
              >
                {fmtSlot(slot)}
              </Text>
              {isSelected && (
                <Text className="text-[10px] text-blue-100 font-medium mt-0.5">
                  Selected
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
