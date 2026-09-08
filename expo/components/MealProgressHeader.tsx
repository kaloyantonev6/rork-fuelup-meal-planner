import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useCountUp } from "@/hooks/useCountUp";
import Toast from "@/components/ui/Toast";

interface MealProgressHeaderProps {
  totalMeals: number;
  completedCount: number;
  skippedCount: number;
  caloriesConsumed: number;
  calorieTarget: number;
  completionPercent: number;
  /** Mini timeline rendered between the header and the calorie bar */
  children?: React.ReactNode;
}

/**
 * "Today's Progress" card at the top of the meal plan view: completion badge,
 * animated progress bar (turns green with a shimmer sweep on 100%), rolling
 * calorie counter, and a confetti toast + success haptic when every meal is done.
 */
export default function MealProgressHeader({
  totalMeals,
  completedCount,
  skippedCount,
  caloriesConsumed,
  calorieTarget,
  completionPercent,
  children,
}: MealProgressHeaderProps) {
  const width = useRef(new Animated.Value(completionPercent)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const prevAllDone = useRef(false);
  const [allDone, setAllDone] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const consumed = useCountUp(caloriesConsumed);

  useEffect(() => {
    Animated.timing(width, {
      toValue: completionPercent,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [completionPercent, width]);

  // 100% completion celebration — fires once per transition
  useEffect(() => {
    const done = totalMeals > 0 && completedCount + skippedCount >= totalMeals;
    if (done && !prevAllDone.current) {
      setAllDone(true);
      setShowToast(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      shimmer.setValue(0);
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (!done && prevAllDone.current) {
      setAllDone(false);
    }
    prevAllDone.current = done;
  }, [completedCount, skippedCount, totalMeals, shimmer]);

  const barColor = allDone ? Colors.success : Colors.primary;
  const clampedTarget = Math.max(calorieTarget, 1);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Today&apos;s Progress</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: allDone ? "#22C55E18" : "#2DD4A818" },
          ]}
        >
          <Text style={[styles.badgeText, { color: allDone ? Colors.success : Colors.primary }]}>
            {completedCount}/{totalMeals}
          </Text>
        </View>
      </View>

      {children}

      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: barColor, width: width.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) },
          ]}
        />
        {allDone ? (
          <Animated.View
            style={[
              styles.shimmer,
              {
                opacity: 0.35,
                transform: [
                  {
                    translateX: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-260, 400],
                    }),
                  },
                  { skewX: "-12deg" },
                ],
              },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.calorieRow}>
        <Text style={styles.calories}>{Math.round(consumed)}</Text>
        <Text style={styles.calorieTarget}>/ {calorieTarget} kcal consumed</Text>
        {skippedCount > 0 ? (
          <Text style={styles.skippedNote}>{skippedCount} skipped</Text>
        ) : null}
      </View>

      <Toast
        visible={showToast}
        message="All meals done! Great fueling today."
        icon="🎉"
        duration={3000}
        onHide={() => setShowToast(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.bg4,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#FFFFFF",
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 10,
  },
  calories: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  calorieTarget: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    marginLeft: 8,
  },
  skippedNote: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#F59E0B",
  },
});
