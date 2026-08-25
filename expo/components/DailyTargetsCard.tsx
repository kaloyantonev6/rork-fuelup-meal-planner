import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { UserProfile } from "@/types";
import { calculateDailyTargets, DailyTargets } from "@/utils/dailyTargets";

interface DailyTargetsCardProps {
  profile: UserProfile;
  dayType?: import("@/types").DayType;
}

function DailyTargetsCard({ profile, dayType }: DailyTargetsCardProps) {
  const targets: DailyTargets = useMemo(
    () => calculateDailyTargets(profile, dayType ?? "training"),
    [profile, dayType],
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>📊 Today's Fuel Targets</Text>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>{targets.dayTypeLabel}</Text>
        </View>
      </View>

      <View style={styles.chainRow}>
        <Text style={styles.chainText}>
          BMR: {targets.bmr} kcal → TDEE: {targets.tdee} kcal →{" "}
        </Text>
        <Text style={styles.chainHighlight}>
          {targets.calories} kcal/day
        </Text>
      </View>

      <View style={styles.positionRow}>
        <Text style={styles.positionLabel}>⚽ {targets.positionLabel}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, styles.statBoxCalories]}>
          <Text style={[styles.statValue, { color: Colors.primary }]}>
            {targets.calories}
          </Text>
          <Text style={styles.statLabel}>kcal/day</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxProtein]}>
          <Text style={[styles.statValue, { color: Colors.match }]}>
            {targets.protein}g
          </Text>
          <Text style={styles.statLabel}>Protein</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxCarbs]}>
          <Text style={[styles.statValue, { color: Colors.recovery }]}>
            {targets.carbs}g
          </Text>
          <Text style={styles.statLabel}>Carbs</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxFat]}>
          <Text style={[styles.statValue, { color: "#A78BFA" }]}>
            {targets.fat}g
          </Text>
          <Text style={styles.statLabel}>Fat</Text>
        </View>
      </View>

      <View style={styles.extrasRow}>
        <View style={styles.extraItem}>
          <Text style={styles.extraText}>
            🥬 Fiber: <Text style={styles.extraBold}>{targets.fiber}g/day</Text>
          </Text>
        </View>
        <View style={styles.extraDot} />
        <View style={styles.extraItem}>
          <Text style={styles.extraText}>
            💧 Water: <Text style={styles.extraBold}>{targets.waterLiters}L/day</Text>
          </Text>
        </View>
      </View>

      {targets.notes.length > 0 && (
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Why These Targets?</Text>
          {targets.notes.map((note, idx) => (
            <View key={idx} style={styles.noteRow}>
              <View style={styles.noteBullet} />
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default React.memo(DailyTargetsCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
  },
  dayBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  chainRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 8,
  },
  chainText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: "500" as const,
  },
  chainHighlight: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  positionRow: {
    marginBottom: 14,
  },
  positionLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  statBoxCalories: {
    backgroundColor: Colors.primaryLight,
  },
  statBoxProtein: {
    backgroundColor: Colors.match + "15",
  },
  statBoxCarbs: {
    backgroundColor: Colors.recovery + "15",
  },
  statBoxFat: {
    backgroundColor: "#A78BFA15",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800" as const,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  extrasRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  extraItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  extraDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textTertiary,
  },
  extraText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  extraBold: {
    fontWeight: "700" as const,
    color: Colors.text,
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  noteBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 5,
  },
  noteText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
});
