import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import {
  AIS_CATEGORY_META,
  BATCH_TESTING_NOTE,
  FOOD_FIRST_NOTE,
  YOUTH_SUPPLEMENT_NOTE,
  supplementsForAge,
  type Supplement,
} from "@/data/supplements";
import { checkYouthSafety } from "@/lib/youthSafety";
import SourceTag from "@/components/SourceTag";

/**
 * Supplement safety screen — AIS ABCD classification (AIS / IOC 2018).
 * Under-18s only see micronutrient supplements with a doctor note (SDA 2014).
 */
export default function SupplementsScreen() {
  const { profile } = useMealPlan();
  const insets = useSafeAreaInsets();
  const age = profile.age || 20;
  const visible = supplementsForAge(age);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Supplements</Text>
        </View>

        <Text style={styles.intro}>
          Classified with the AIS Group ABCD framework. Food first — supplements never replace a
          good diet.
        </Text>

        {age < 18 ? (
          <View style={styles.youthNote}>
            <Text style={styles.youthNoteText}>
              You're under 18, so only vitamin and mineral supplements are shown. Performance
              supplements aren't recommended for minors — focus on food-first nutrition.
            </Text>
          </View>
        ) : null}

        {visible.map((supplement) => (
          <SupplementCard key={supplement.name} supplement={supplement} age={age} />
        ))}

        <View style={styles.batchCard}>
          <Text style={styles.batchTitle}>🧪 Batch Testing</Text>
          <Text style={styles.batchText}>{BATCH_TESTING_NOTE}</Text>
          <SourceTag text="Kölner Liste · Informed Sport" />
        </View>

        <SourceTag text="AIS ABCD Classification Framework · IOC Supplement Consensus 2018" style={styles.footerSource} />
      </ScrollView>
    </View>
  );
}

function SupplementCard({ supplement, age }: { supplement: Supplement; age: number }) {
  const meta = AIS_CATEGORY_META[supplement.category];
  const safety = age < 18 ? checkYouthSafety(age, "view_supplement", { supplementCategory: supplement.isMicronutrient ? "micronutrient" : "performance" }) : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{supplement.name}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: meta.backgroundColor }]}>
          <Text style={[styles.categoryBadgeText, { color: meta.color }]}>
            {supplement.category} · {meta.label}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionText}>{supplement.evidenceSummary}</Text>
      <Text style={styles.relevanceText}>⚽ {supplement.footballRelevance}</Text>

      <View style={styles.badgeRow}>
        {supplement.ageRestriction > 0 ? (
          <View style={styles.ageBadge}>
            <Text style={styles.ageBadgeText}>🔒 {supplement.ageRestriction}+ only</Text>
          </View>
        ) : null}
        <View
          style={[
            styles.riskBadge,
            {
              backgroundColor:
                supplement.antiDopingRisk === "high"
                  ? "#EF444418"
                  : supplement.antiDopingRisk === "medium"
                    ? "#F59E0B18"
                    : "#22C55E18",
            },
          ]}
        >
          <Text
            style={[
              styles.riskBadgeText,
              {
                color:
                  supplement.antiDopingRisk === "high"
                    ? "#EF4444"
                    : supplement.antiDopingRisk === "medium"
                      ? "#F59E0B"
                      : "#22C55E",
              },
            ]}
          >
            Doping risk: {supplement.antiDopingRisk}
          </Text>
        </View>
        {supplement.batchTestingRequired ? (
          <View style={styles.batchBadge}>
            <Text style={styles.batchBadgeText}>Batch-tested only</Text>
          </View>
        ) : null}
      </View>

      {safety && !safety.allowed && safety.message ? (
        <View style={styles.blockNote}>
          <Text style={styles.blockNoteText}>{safety.message}</Text>
        </View>
      ) : null}

      {age < 18 && supplement.isMicronutrient ? (
        <Text style={styles.youthDoctorNote}>⚕️ {YOUTH_SUPPLEMENT_NOTE}</Text>
      ) : null}

      <Text style={styles.foodFirst}>{FOOD_FIRST_NOTE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  intro: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  youthNote: {
    backgroundColor: "#F59E0B18",
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  youthNoteText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
  },
  categoryBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
    marginBottom: 6,
  },
  relevanceText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  ageBadge: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ageBadgeText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  riskBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: "600" as const,
  },
  batchBadge: {
    backgroundColor: "#2DD4A818",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  batchBadgeText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  blockNote: {
    backgroundColor: "#EF444418",
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  blockNoteText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text,
  },
  youthDoctorNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  foodFirst: {
    fontSize: 11,
    fontStyle: "italic",
    color: Colors.textTertiary,
  },
  batchCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  batchTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  batchText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  footerSource: {
    textAlign: "center" as const,
    marginTop: 4,
  },
});
