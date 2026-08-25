import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Colors from "@/constants/colors";

interface NutritionRingProps {
  current: number;
  target: number;
  label: string;
  color: string;
  size?: number;
  unit?: string;
}

export default function NutritionRing({ current, target, label, color, size = 72, unit = "g" }: NutritionRingProps) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / target, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.borderLight}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[styles.innerLabel, { width: size, height: size }]}>
          <Text style={[styles.value, { color }]}>{current}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 4,
  },
  innerLabel: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  value: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  unit: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginTop: -2,
  },
  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
});
