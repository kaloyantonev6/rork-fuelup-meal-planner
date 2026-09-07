import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Colors from "@/constants/colors";
import { motion } from "@/constants/design";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface NutritionRingProps {
  current: number;
  target: number;
  label: string;
  color: string;
  size?: number;
  unit?: string;
}

/**
 * Macro ring with an animated fill (0 → target over 600ms) and a
 * number that counts up in sync with the stroke.
 */
export default function NutritionRing({ current, target, label, color, size = 72, unit = "g" }: NutritionRingProps) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const targetOffset = circumference * (1 - progress);

  const anim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value }) => {
      setDisplayValue(Math.round(current * value));
    });
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: motion.progressDuration,
      delay: motion.progressDelay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
      anim.removeListener(id);
    };
  }, [anim, current]);

  const dashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, targetOffset],
  });

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.bg4}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[styles.innerLabel, { width: size, height: size }]}>
          <Text style={[styles.value, { color }]}>{displayValue}</Text>
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
    fontVariant: ["tabular-nums"],
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
