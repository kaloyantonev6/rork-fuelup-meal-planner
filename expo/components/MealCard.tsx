import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Clock, Flame } from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { radius, spacing } from "@/constants/design";
import PressableScale from "@/components/ui/PressableScale";
import { Recipe } from "@/types";

interface MealCardProps {
  meal: Recipe;
  mealLabel: string;
  compact?: boolean;
  /** Position in a list — enables staggered fade + slide-up entry (60ms per index). */
  index?: number;
}

export default function MealCard({ meal, mealLabel, compact = false, index }: MealCardProps) {
  const router = useRouter();
  const shouldAnimate = typeof index === "number";
  const opacity = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(shouldAnimate ? 20 : 0)).current;

  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }
    const delay = (index ?? 0) * 60;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [shouldAnimate, index, opacity, translateY]);

  const handlePress = () => {
    router.push({ pathname: "/recipe", params: { id: meal.id } });
  };

  if (compact) {
    return (
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <PressableScale onPress={handlePress}>
          <View style={styles.compactCard}>
            <Image source={{ uri: meal.image }} style={styles.compactImage} contentFit="cover" />
            <View style={styles.compactContent}>
              <Text style={styles.compactLabel}>{mealLabel}</Text>
              <Text style={styles.compactTitle} numberOfLines={1}>{meal.title}</Text>
              <View style={styles.compactMeta}>
                <Flame size={12} color={Colors.accent} />
                <Text style={styles.compactMetaText}>{meal.nutrition.calories} kcal</Text>
                <Clock size={12} color={Colors.textTertiary} />
                <Text style={styles.compactMetaText}>{meal.duration} min</Text>
              </View>
            </View>
          </View>
        </PressableScale>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <PressableScale onPress={handlePress}>
        <View style={styles.card}>
          <Image source={{ uri: meal.image }} style={styles.image} contentFit="cover" />
          <View style={styles.overlay}>
            <View style={styles.labelBadge}>
              <Text style={styles.labelText}>{mealLabel}</Text>
            </View>
          </View>
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>{meal.title}</Text>
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Flame size={14} color={Colors.accent} />
                <Text style={styles.metaText}>{meal.nutrition.calories} kcal</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={14} color={Colors.textTertiary} />
                <Text style={styles.metaText}>{meal.duration} min</Text>
              </View>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>{meal.difficulty}</Text>
              </View>
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: "100%",
    height: 140,
  },
  overlay: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
  },
  labelBadge: {
    backgroundColor: Colors.accentMuted,
    borderWidth: 1,
    borderColor: Colors.accent + "55",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  labelText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
    color: Colors.text,
  },
  meta: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  difficultyBadge: {
    backgroundColor: Colors.bg3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginLeft: "auto" as const,
  },
  difficultyText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
    textTransform: "capitalize" as const,
  },
  compactCard: {
    backgroundColor: Colors.bg2,
    borderRadius: radius.lg,
    flexDirection: "row" as const,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactImage: {
    width: 80,
    height: 80,
  },
  compactContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "center" as const,
    gap: 3,
  },
  compactLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.accent,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  compactMeta: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  compactMetaText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginRight: 6,
  },
});
