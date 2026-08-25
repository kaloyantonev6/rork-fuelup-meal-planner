import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Clock, Flame } from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { Recipe } from "@/types";

interface MealCardProps {
  meal: Recipe;
  mealLabel: string;
  compact?: boolean;
}

export default function MealCard({ meal, mealLabel, compact = false }: MealCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push({ pathname: "/recipe", params: { id: meal.id } });
  };

  if (compact) {
    return (
      <Pressable onPress={handlePress} style={({ pressed }) => [styles.compactCard, pressed && styles.pressed]}>
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
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  image: {
    width: "100%",
    height: 140,
  },
  overlay: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  labelBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  labelText: {
    color: Colors.textInverse,
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  content: {
    padding: 14,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  meta: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
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
    backgroundColor: Colors.tagBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: "auto" as const,
  },
  difficultyText: {
    fontSize: 11,
    color: Colors.tagText,
    fontWeight: "500" as const,
    textTransform: "capitalize" as const,
  },
  compactCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    flexDirection: "row" as const,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  compactImage: {
    width: 80,
    height: 80,
  },
  compactContent: {
    flex: 1,
    padding: 10,
    justifyContent: "center" as const,
    gap: 3,
  },
  compactLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
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
