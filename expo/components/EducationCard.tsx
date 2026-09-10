import React, { useEffect, useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import type { DayType } from "@/types";
import { dismissEducationCard, getTodayEducationCard, type EducationCard as Card } from "@/data/educationCards";
import SourceTag from "@/components/SourceTag";

/**
 * Rotating "Why This Works" card — one per day, matched to the current day
 * type, teal left border, dismissable (next card appears tomorrow).
 */
export default function EducationCardContainer({ dayType }: { dayType: DayType }) {
  const [card, setCard] = useState<Card | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getTodayEducationCard(dayType).then((c) => {
      if (!cancelled) setCard(c);
    });
    return () => {
      cancelled = true;
    };
  }, [dayType]);

  if (!card) return null;

  const handleDismiss = () => {
    void dismissEducationCard();
    setCard(null);
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={handleDismiss} hitSlop={8} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
      <Text style={styles.title}>{card.title}</Text>
      <Text style={styles.body}>{card.body}</Text>
      <SourceTag text={card.source} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#2DD4A8",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 12,
    padding: 4,
  },
  closeText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  title: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 6,
    paddingRight: 24,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
    marginBottom: 8,
  },
});
