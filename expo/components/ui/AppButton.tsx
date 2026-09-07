import React, { useCallback, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { spacing, radius } from "@/constants/design";
import PressableScale from "@/components/ui/PressableScale";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Optional accent color override for the primary gradient (e.g. premium gold). */
  gradientColors?: [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
}

const variantText: Record<ButtonVariant, { fontSize: number; fontWeight: "500" | "600"; color: string }> = {
  primary: { fontSize: 15, fontWeight: "600", color: Colors.textOnAccent },
  secondary: { fontSize: 15, fontWeight: "500", color: Colors.text },
  ghost: { fontSize: 14, fontWeight: "500", color: Colors.accent },
};

/**
 * App-wide button.
 * - primary: teal gradient fill, scales to 0.97 + darkens on press
 * - secondary: outlined, background fades to bg3 on press
 * - ghost: plain accent text, dims on press
 */
export default function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  gradientColors = [Colors.accentGradientStart, Colors.accentGradientEnd],
  style,
}: AppButtonProps) {
  const bgOpacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(bgOpacity, {
      toValue: variant === "secondary" ? 0.35 : 0.82,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [bgOpacity, variant]);

  const handlePressOut = useCallback(() => {
    Animated.timing(bgOpacity, {
      toValue: 1,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [bgOpacity]);

  const text = variantText[variant];

  if (variant === "ghost") {
    return (
      <PressableScale
        scaleTo={0.96}
        onPress={onPress}
        disabled={disabled}
        style={style}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <Animated.View style={{ opacity: disabled ? 0.4 : 1 }}>
          <Text style={[styles.ghostText, text, disabled && { opacity: 0.4 }]}>{title}</Text>
        </Animated.View>
      </PressableScale>
    );
  }

  if (variant === "primary") {
    return (
      <PressableScale
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={style}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <Animated.View style={[styles.base, { opacity: disabled ? 0.45 : 1 }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity, backgroundColor: "#000" }]} />
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: Animated.multiply(bgOpacity, 0.35), backgroundColor: "#000" }]} />
          <Text style={[styles.primaryText, text]}>{title}</Text>
        </Animated.View>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Animated.View style={[styles.base, styles.secondary, { opacity: disabled ? 0.45 : 1 }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity, backgroundColor: Colors.bg3, borderRadius: radius.md }]} />
        <Text style={[styles.secondaryText, text]}>{title}</Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  primaryText: {
    fontWeight: "600" as const,
    fontSize: 15,
    color: Colors.textOnAccent,
  },
  secondaryText: {
    fontWeight: "500" as const,
    fontSize: 15,
    color: Colors.text,
  },
  ghostText: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
