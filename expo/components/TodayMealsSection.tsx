import React, { useEffect, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";
import { Clock } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useToday } from "@/providers/TodayProvider";
import {
  useMealTracking,
} from "@/providers/MealTrackingProvider";
import {
  getMealWindows,
  mealStatus,
  minutesNow,
  MEAL_CATEGORY_META,
} from "@/constants/mealTimes";
import type { MealCategory } from "@/constants/mealTimes";
import MealCheckoffCard from "@/components/MealCheckoffCard";
import MealTimeline from "@/components/MealTimeline";
import MealProgressHeader from "@/components/MealProgressHeader";
import WeeklyHistoryStrip from "@/components/WeeklyHistoryStrip";

/**
 * "Today's Meals" block on the home tab: progress header, status timeline, one
 * check-off card per meal and the weekly history strip. Shows skeletons until the
 * tracking store has loaded.
 */
export default function TodayMealsSection() {
  const { todayData } = useToday();
  const {
    tracking,
    history,
    customTimes,
    isLoaded,
    highlightMealId,
    checkoffMeal,
    skipMeal,
    undoMeal,
    stats,
  } = useMealTracking();

  const [nowMin, setNowMin] = useState<number>(() => minutesNow());

  // Keep the due/missed states honest while the app is open
  useEffect(() => {
    const tick = () => setNowMin(minutesNow());
    const interval = setInterval(tick, 30000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") tick();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  if (!isLoaded || !tracking) {
    return (
      <View style={styles.wrap}>
        <View style={[styles.card, styles.skeletonCard]}>
          <View style={styles.skeletonBar} />
          <View style={styles.skeletonBar} />
          <View style={[styles.skeletonBar, { width: "45%" }]} />
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.card, styles.skeletonCard]}>
            <View style={styles.skeletonRow}>
              <View style={styles.skeletonCircle} />
              <View style={[styles.skeletonBar, { flex: 1 }]} />
            </View>
            <View style={[styles.skeletonBar, { width: "60%" }]} />
          </View>
        ))}
      </View>
    );
  }

  const windows = getMealWindows(customTimes, tracking.dayType);

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHeader}>
        <Clock size={16} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
        <Text style={styles.sectionSubtitle}>
          {MEAL_CATEGORY_META[tracking.meals[0]?.category ?? "breakfast"].label === "" ? "" : todayData?.dayName ?? ""}
        </Text>
      </View>

      <MealProgressHeader
        totalMeals={stats.totalMeals}
        completedCount={stats.completedCount}
        skippedCount={stats.skippedCount}
        caloriesConsumed={stats.caloriesConsumed}
        calorieTarget={tracking.calorieTarget}
        completionPercent={stats.completionPercent}
      >
        <MealTimeline meals={tracking.meals} windows={windows} nowMin={nowMin} compact />
      </MealProgressHeader>

      {tracking.meals.map((meal, index) => (
        <MealCheckoffCard
          key={meal.mealId}
          meal={meal}
          window={windows[meal.category as MealCategory]}
          status={mealStatus(meal, windows, nowMin)}
          highlighted={highlightMealId === meal.mealId}
          index={index}
          onCheckoff={() => checkoffMeal(meal.mealId)}
          onSkip={() => skipMeal(meal.mealId)}
          onUndo={() => undoMeal(meal.mealId)}
        />
      ))}

      <WeeklyHistoryStrip history={history} today={tracking} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  card: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  skeletonCard: {
    gap: 12,
  },
  skeletonBar: {
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.bg4,
    width: "85%",
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skeletonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bg4,
  },
});
