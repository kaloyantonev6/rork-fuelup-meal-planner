import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, MoonStar, Utensils } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { DAY_TYPE_META } from "@/constants/dayTypes";
import {
  categoriesForDay,
  getMealWindows,
  MEAL_CATEGORY_META,
  type MealCategory,
} from "@/constants/mealTimes";
import { useToday } from "@/providers/TodayProvider";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useMealTracking } from "@/providers/MealTrackingProvider";
import { useNotifications } from "@/providers/NotificationProvider";
import { suggestWindDown, weeklyAverage, type SleepLog } from "@/lib/sleepEngine";

/**
 * Daily overview card for the home screen: tomorrow's planned meals (with
 * their scheduled windows) and the expected bedtime wind-down time.
 */
export default function TomorrowOverview({ sleepLog }: { sleepLog: SleepLog }) {
  const router = useRouter();
  const { todayData } = useToday();
  const { todayPlan, profile } = useMealPlan();
  const { customTimes } = useMealTracking();
  const { bedtime } = useNotifications();

  const tomorrow = todayData?.tomorrow;
  const tomorrowType = tomorrow?.dayType ?? "training";
  const dayMeta = DAY_TYPE_META[tomorrowType];

  const meals = useMemo(() => {
    if (!tomorrow) return [];
    const windows = getMealWindows(customTimes, tomorrowType);
    return categoriesForDay(tomorrowType).map((category: MealCategory) => ({
      category,
      title: todayPlan.meals[category]?.title ?? "Fuel up",
      time: windows[category]?.start ?? "12:00",
    }));
  }, [tomorrow, tomorrowType, customTimes, todayPlan]);

  const windDown = useMemo(() => {
    if (!bedtime?.enabled) return null;
    return suggestWindDown(weeklyAverage(sleepLog), profile.age || 20, bedtime.wakeTime);
  }, [bedtime, sleepLog, profile.age]);

  if (!tomorrow) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.dayBadge, { backgroundColor: dayMeta.bgColor, borderColor: dayMeta.color }]}>
          <Text style={[styles.dayBadgeIcon, { color: dayMeta.color }]}>{dayMeta.icon}</Text>
          <Text style={[styles.dayBadgeText, { color: dayMeta.color }]}>{dayMeta.label}</Text>
        </View>
        <Text style={styles.dayName}>{tomorrow.dayName}</Text>
      </View>

      {/* Planned meals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Utensils size={13} color={Colors.textTertiary} strokeWidth={2.2} />
          <Text style={styles.sectionTitle}>PLANNED MEALS</Text>
        </View>
        {meals.map((meal) => (
          <Pressable
            key={meal.category}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/plan" as never);
            }}
            style={({ pressed }) => [styles.mealRow, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`${MEAL_CATEGORY_META[meal.category].label} at ${meal.time}: ${meal.title}`}
          >
            <Text style={styles.mealIcon}>{MEAL_CATEGORY_META[meal.category].icon}</Text>
            <View style={styles.mealText}>
              <Text style={styles.mealTitle} numberOfLines={1}>{meal.title}</Text>
              <Text style={styles.mealCategory}>{MEAL_CATEGORY_META[meal.category].label}</Text>
            </View>
            <Text style={styles.mealTime}>{meal.time}</Text>
          </Pressable>
        ))}
      </View>

      {/* Bedtime reminder */}
      <View style={styles.divider} />
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/sleep" as never);
        }}
        style={({ pressed }) => [styles.bedtimeRow, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel={
          windDown
            ? `Bedtime reminder: wind down at ${windDown.windDownTime}, lights out ${windDown.bedTime}`
            : "Enable bedtime reminder"
        }
      >
        <View style={styles.bedtimeIconWrap}>
          <MoonStar size={15} color={Colors.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.bedtimeText}>
          {windDown ? (
            <>
              <Text style={styles.bedtimeMain}>
                Wind-down <Text style={{ color: Colors.primary }}>{windDown.windDownTime}</Text> · Lights out{" "}
                <Text style={{ color: Colors.primary }}>{windDown.bedTime}</Text>
              </Text>
              <Text style={styles.bedtimeSub}>
                {windDown.usedTargetFallback
                  ? "Reminder on — based on your age target"
                  : "Reminder on — from your nightly average"}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.bedtimeMainOff}>Bedtime reminder off</Text>
              <Text style={styles.bedtimeSub}>Tap to set a smart wind-down time</Text>
            </>
          )}
        </View>
        <ChevronRight size={16} color={Colors.textTertiary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginTop: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  dayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dayBadgeIcon: {
    fontSize: 11,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  dayName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.4,
    flex: 1,
  },
  section: {
    gap: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textTertiary,
    letterSpacing: 0.8,
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    paddingVertical: 6,
  },
  mealIcon: {
    fontSize: 18,
  },
  mealText: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    letterSpacing: -0.1,
  },
  mealCategory: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  mealTime: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 12,
  },
  bedtimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bedtimeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  bedtimeText: {
    flex: 1,
  },
  bedtimeMain: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  bedtimeMainOff: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  bedtimeSub: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
});
