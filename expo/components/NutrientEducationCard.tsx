import React, { useMemo } from "react";
import { Text, View, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { getMonthlyNutrientCard, isTeenNutrientAudience } from "@/lib/youthSafety";
import SourceTag from "@/components/SourceTag";

/**
 * Monthly nutrient watch card for 13-18 year olds (SDA Adolescent 2014):
 * iron (red), calcium (white), vitamin D (amber) — rotating monthly.
 */
export default function NutrientEducationCard({ age }: { age: number }) {
  const card = useMemo(() => getMonthlyNutrientCard(), []);

  if (!isTeenNutrientAudience(age)) return null;

  return (
    <View style={[styles.card, { borderLeftColor: card.accentColor }]}>
      <Text style={styles.title}>
        {card.icon} {card.nutrient} Watch
      </Text>
      <Text style={styles.why}>{card.why}</Text>
      <View style={styles.foodsWrap}>
        {card.foods.map((food) => (
          <View key={food} style={styles.foodPill}>
            <Text style={styles.foodText}>{food}</Text>
          </View>
        ))}
      </View>
      <SourceTag text={card.source} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  why: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
    marginBottom: 10,
  },
  foodsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  foodPill: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  foodText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
});
