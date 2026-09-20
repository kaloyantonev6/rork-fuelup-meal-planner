import React from "react";
import { Text, View, type StyleProp, type TextStyle } from "react-native";

/**
 * "Fuelify" wordmark — "Fuel" in the base text colour with an "ify" accent in
 * the brand teal, rendered as two adjacent Text elements inside a row.
 */
export function BrandLogo({ style }: { style?: StyleProp<TextStyle> }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={[{ fontSize: 28, fontWeight: "700", color: "#F1F5F9" }, style]}>Fuel</Text>
      <Text style={[{ fontSize: 28, fontWeight: "700", color: "#2DD4A8" }, style]}>ify</Text>
    </View>
  );
}
