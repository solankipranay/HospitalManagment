import React from "react";
import { View, ViewProps, Platform, DimensionValue } from "react-native";

interface Props extends ViewProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const MAX_WIDTHS: Record<"sm" | "md" | "lg" | "xl" | "full", DimensionValue> = {
  sm: 480,   // Auth cards
  md: 680,   // Single column forms/detail
  lg: 960,   // Appointments & standard dashboards
  xl: 1200,  // Full 2-column dashboards & booking
  full: "100%",
};

export function ResponsiveContainer({
  children,
  maxWidth = "xl",
  className = "",
  style,
  ...props
}: Props) {
  const isWeb = Platform.OS === "web";
  const maxW = MAX_WIDTHS[maxWidth];

  return (
    <View
      style={[
        {
          width: "100%",
          flex: 1,
          alignSelf: "center",
          maxWidth: isWeb ? maxW : ("100%" as DimensionValue),
        },
        style,
      ]}
      className={className}
      {...props}
    >
      {children}
    </View>
  );
}
