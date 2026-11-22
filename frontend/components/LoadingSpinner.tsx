import { View, ActivityIndicator, Text } from "react-native";

interface Props {
  message?: string;
}

export function LoadingSpinner({ message = "Loading…" }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-surface">
      <ActivityIndicator size="large" color="#0066CC" />
      <Text className="mt-3 text-muted text-sm">{message}</Text>
    </View>
  );
}
