import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, StyleProp, ViewStyle, TextStyle, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { radius } from "@/constants/design";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /** Icon rendered before the label. */
  icon?: React.ReactNode;
}

/**
 * Filter chip. Selected state is a subtle teal tint with teal text and
 * teal border (never solid teal), with a 150ms color cross-fade and a
 * small 1.05 scale pop on selection.
 */
export default function Chip({ label, selected = false, onPress, disabled, style, textStyle, icon }: ChipProps) {
  const pop = useRef(new Animated.Value(1)).current;
  const tintOpacity = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(tintOpacity, {
      toValue: selected ? 1 : 0,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [selected, tintOpacity]);

  const handlePress = () => {
    if (selected) {
      return;
    }
    Animated.sequence([
      Animated.spring(pop, { toValue: 1.05, useNativeDriver: true, speed: 40, bounciness: 0 }),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 26, bounciness: 5 }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled} accessibilityRole="button" accessibilityState={{ selected }}>
      <Animated.View style={[styles.chip, { transform: [{ scale: pop }] }, style]}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.tintLayer,
            { opacity: tintOpacity },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.borderLayer, { opacity: tintOpacity }]}
        />
        {icon}
        <Text style={[styles.text, selected ? styles.textSelected : styles.textIdle, textStyle]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.bg3,
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    overflow: "hidden",
  },
  tintLayer: {
    backgroundColor: Colors.accentMuted,
    borderRadius: radius.full,
  },
  borderLayer: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: radius.full,
  },
  text: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  textIdle: {
    color: Colors.textSecondary,
  },
  textSelected: {
    color: Colors.accent,
    fontWeight: "600" as const,
  },
});
