import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import { MEAL_CATEGORY_META, mealStatus } from "@/constants/mealTimes";
import type { MealCheckoff, MealStatus, MealWindows } from "@/constants/mealTimes";

interface MealTimelineProps {
  meals: MealCheckoff[];
  windows: MealWindows;
  nowMin: number;
  /** Compact variant for the home progress card */
  compact?: boolean;
}

const STATUS_COLORS: Record<MealStatus, string> = {
  completed: Colors.primary,
  skipped: "#6B7280",
  missed: "#EF4444",
  due: Colors.primary,
  pending: Colors.bg4,
};

/**
 * Horizontal meal status timeline: one dot per meal on a line, teal connectors
 * between completed meals, and the current in-window meal pulsing to draw attention.
 */
export default function MealTimeline({ meals, windows, nowMin, compact = false }: MealTimelineProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  const statuses = meals.map((meal) => mealStatus(meal, windows, nowMin));
  const currentIndex = statuses.findIndex((s) => s === "due");

  useEffect(() => {
    if (currentIndex === -1) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [currentIndex, pulse]);

  const dotSize = compact ? 10 : 12;
  const currentSize = compact ? 14 : 16;

  if (meals.length === 0) return null;

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {meals.map((meal, index) => {
        const status = statuses[index];
        const isCurrent = index === currentIndex;
        const size = isCurrent ? currentSize : dotSize;
        const meta = MEAL_CATEGORY_META[meal.category];
        return (
          <React.Fragment key={meal.mealId}>
            <View style={styles.dotWrap}>
              <Animated.View
                style={{
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: STATUS_COLORS[status],
                  borderWidth: isCurrent && status !== "completed" ? 2 : 0,
                  borderColor: Colors.primary,
                  transform: [{ scale: isCurrent ? pulse : 1 }],
                }}
              />
              <Text
                style={[
                  styles.dotLabel,
                  compact && styles.dotLabelCompact,
                  {
                    color:
                      status === "completed"
                        ? Colors.primary
                        : status === "missed"
                          ? "#EF4444"
                          : Colors.textTertiary,
                  },
                ]}
              >
                {meta.short}
              </Text>
              {!compact ? (
                <Text style={styles.timeLabel}>
                  {meal.completedAt
                    ? new Date(meal.completedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : `(${meal.scheduledTime})`}
                </Text>
              ) : null}
            </View>
            {index < meals.length - 1 ? (
              <View
                style={[
                  styles.connector,
                  compact && styles.connectorCompact,
                  {
                    backgroundColor:
                      status === "completed" && statuses[index + 1] === "completed"
                        ? Colors.primary
                        : Colors.bg4,
                  },
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 8,
    marginVertical: 12,
  },
  rowCompact: {
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  dotWrap: {
    alignItems: "center",
  },
  dotLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    marginTop: 6,
  },
  dotLabelCompact: {
    fontSize: 9,
    marginTop: 4,
  },
  timeLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  connector: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    marginTop: 5,
  },
  connectorCompact: {
    marginTop: 4,
  },
});
