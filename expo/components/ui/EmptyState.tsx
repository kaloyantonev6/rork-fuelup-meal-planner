import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import AppButton from "@/components/ui/AppButton";

interface EmptyStateProps {
  /** Large icon (64×64) — pass a Text emoji or a lucide icon sized 64. */
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  /** When set, renders a primary CTA below the subtitle. */
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Centered empty state with a gently floating icon (±6px over a 3s loop),
 * h3 title, body subtitle and an optional primary action.
 */
export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 6],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconWrap, { transform: [{ translateY }] }]}>{icon}</Animated.View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel ? <AppButton title={actionLabel} onPress={onAction} style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingBottom: 40,
    gap: 8,
  },
  iconWrap: {
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  action: {
    marginTop: 16,
    minWidth: 200,
  },
});
