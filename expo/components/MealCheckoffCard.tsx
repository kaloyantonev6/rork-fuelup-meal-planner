import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { AlertCircle, Check, Minus } from "lucide-react-native";
import Colors from "@/constants/colors";
import { MEAL_CATEGORY_META } from "@/constants/mealTimes";
import type { MealCheckoff, MealStatus, MealWindow } from "@/constants/mealTimes";

interface MealCheckoffCardProps {
  meal: MealCheckoff;
  window: MealWindow | undefined;
  status: MealStatus;
  /** Brief teal border pulse (fired when the user taps a meal reminder notification) */
  highlighted: boolean;
  index: number;
  onPress?: () => void;
  onCheckoff: () => void;
  onSkip: () => void;
  onUndo: () => void;
}

const UNDO_WINDOW_MS = 10000;

/**
 * A meal plan card with the check-off circle on the left: pending → due (pulsing)
 * → completed (teal fill + checkmark) / skipped (grey dash, dimmed) / missed (red).
 * "Ate it" and "Skip" actions with a 10-second Undo window and animated transitions.
 */
export default function MealCheckoffCard({
  meal,
  window,
  status,
  highlighted,
  index,
  onPress,
  onCheckoff,
  onSkip,
  onUndo,
}: MealCheckoffCardProps) {
  const entrance = useRef(new Animated.Value(0)).current;
  const fill = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;
  const dash = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  // Numeric driver mapped to border colour: 0 = default, 1 = skipped grey, 2 = teal glow
  const borderGlow = useRef(new Animated.Value(0)).current;
  const duePulse = useRef(new Animated.Value(1)).current;
  const undoOpacity = useRef(new Animated.Value(1)).current;
  const duePulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const undoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStatus = useRef<MealStatus>(status);
  const [showUndo, setShowUndo] = useState(false);
  const [undoColor, setUndoColor] = useState<string>(Colors.textSecondary);

  // Staggered card entrance (60ms per card)
  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 300,
      delay: index * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance, index]);

  // Initial render reflects an already-settled status without animating
  useEffect(() => {
    if (status === "completed") {
      fill.setValue(1);
      check.setValue(1);
    } else if (status === "skipped") {
      dash.setValue(1);
      cardOpacity.setValue(0.5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startUndoWindow = (color: string) => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    setUndoColor(color);
    undoOpacity.setValue(1);
    setShowUndo(true);
    undoTimeout.current = setTimeout(() => {
      Animated.timing(undoOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
        setShowUndo(false),
      );
    }, UNDO_WINDOW_MS);
  };

  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;
    if (prev === status) return;

    if (status === "completed") {
      Animated.parallel([
        Animated.spring(fill, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(check, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
        ]),
        // Teal glow on the card border that fades back out over 500ms
        // (native driver — the card's style also hosts native-driven props, so a
        // JS-driven value here would crash with a driver-conflict error)
        Animated.sequence([
          Animated.timing(borderGlow, { toValue: 2, duration: 80, useNativeDriver: true }),
          Animated.timing(borderGlow, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]).start();
      startUndoWindow(Colors.primary);
    } else if (status === "skipped") {
      Animated.parallel([
        Animated.timing(dash, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0.5, duration: 300, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(borderGlow, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(borderGlow, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
      startUndoWindow(Colors.textTertiary);
    } else if (prev === "completed" || prev === "skipped") {
      // Undo — reverse everything
      Animated.parallel([
        Animated.timing(fill, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(check, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(dash, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      if (undoTimeout.current) clearTimeout(undoTimeout.current);
      setShowUndo(false);
    }
  }, [status, borderGlow, fill, check, dash, cardOpacity]);

  // Pulsing ring while the meal is due right now
  useEffect(() => {
    if (status === "due") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(duePulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
          Animated.timing(duePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      );
      duePulseLoop.current = loop;
      loop.start();
      return () => loop.stop();
    }
  }, [status, duePulse]);

  // Reminder-notification highlight: teal border pulse
  useEffect(() => {
    if (!highlighted) return;
    Animated.sequence([
      Animated.timing(borderGlow, { toValue: 2, duration: 150, useNativeDriver: true }),
      Animated.timing(borderGlow, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(borderGlow, { toValue: 2, duration: 150, useNativeDriver: true }),
      Animated.timing(borderGlow, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [highlighted, borderGlow]);

  useEffect(
    () => () => {
      if (undoTimeout.current) clearTimeout(undoTimeout.current);
    },
    [],
  );

  const handleAte = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    onCheckoff();
  };

  const handleSkip = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onSkip();
  };

  const handleUndo = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onUndo();
  };

  const meta = MEAL_CATEGORY_META[meal.category];
  const windowLabel = window ? `${window.start}–${window.end}` : meal.scheduledTime;

  const circleStyle =
    status === "completed"
      ? styles.circleCompleted
      : status === "skipped"
        ? styles.circleSkipped
        : status === "missed"
          ? styles.circleMissed
          : status === "due"
            ? styles.circleDue
            : styles.circlePending;

  const completedAtLabel = meal.completedAt
    ? new Date(meal.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const isDone = status === "completed" || status === "skipped";

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: Animated.multiply(cardOpacity, entrance),
          borderColor: borderGlow.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [Colors.border, "#6B7280", Colors.primary],
          }),
          transform: [
            {
              translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
            },
          ],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Animated.View style={{ transform: [{ scale: status === "due" ? duePulse : 1 }] }}>
          <View style={[styles.circle, circleStyle]}>
            <Animated.View
              style={[
                styles.circleFill,
                { backgroundColor: Colors.primary, transform: [{ scale: fill }] },
              ]}
            />
            {status === "completed" ? (
              <Animated.View style={[styles.circleIcon, { transform: [{ scale: check }] }]}>
                <Check size={15} color="#FFFFFF" strokeWidth={3.5} />
              </Animated.View>
            ) : status === "skipped" ? (
              <Animated.View style={[styles.circleIcon, { opacity: dash }]}>
                <Minus size={15} color="#6B7280" strokeWidth={3.5} />
              </Animated.View>
            ) : status === "missed" ? (
              <AlertCircle size={15} color="#EF4444" strokeWidth={2.5} />
            ) : null}
          </View>
        </Animated.View>
        <Text style={styles.categoryLabel}>
          {meta.label.toUpperCase()} · {windowLabel}
        </Text>
        {status === "missed" ? <Text style={styles.missedTag}>Missed</Text> : null}
      </View>

      <View style={styles.divider} />

      <Pressable onPress={onPress} disabled={!onPress} style={styles.body}>
        <Text style={styles.title}>{meal.mealTitle}</Text>
        <Text style={styles.meta}>🔥 {meal.calories} kcal</Text>
        <Text style={styles.macros}>
          P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fats}g
        </Text>
      </Pressable>

      <View style={styles.actionsRow}>
        {status === "completed" ? (
          <Text style={styles.completedText}>✓ Completed at {completedAtLabel}</Text>
        ) : status === "skipped" ? (
          <View style={styles.skippedRow}>
            <Text style={styles.skippedText}>Skipped</Text>
            {showUndo ? (
              <Animated.View style={{ opacity: undoOpacity }}>
                <Pressable onPress={handleUndo} hitSlop={8} style={styles.undoBtn}>
                  <Text style={[styles.undoText, { color: undoColor }]}>Undo</Text>
                </Pressable>
              </Animated.View>
            ) : null}
          </View>
        ) : (
          <>
            <Pressable
              onPress={handleAte}
              style={({ pressed }) => [styles.ateBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.ateBtnText}>Ate it</Text>
            </Pressable>
            <Pressable
              onPress={handleSkip}
              style={({ pressed }) => [styles.skipBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </Pressable>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  circlePending: {
    borderWidth: 2,
    borderColor: Colors.borderLight,
    backgroundColor: "transparent",
  },
  circleDue: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: "#2DD4A818",
  },
  circleCompleted: {
    backgroundColor: Colors.primary,
  },
  circleSkipped: {
    borderWidth: 2,
    borderColor: "#6B7280",
    backgroundColor: "#6B728018",
  },
  circleMissed: {
    borderWidth: 2,
    borderColor: "#EF4444",
    backgroundColor: "#EF444418",
  },
  circleFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
  },
  circleIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
    color: Colors.textSecondary,
  },
  missedTag: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#EF4444",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  body: {
    minHeight: 44,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  macros: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    minHeight: 44,
  },
  ateBtn: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ateBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  skipBtn: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  btnPressed: {
    opacity: 0.7,
  },
  completedText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  skippedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skippedText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  undoBtn: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  undoText: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
});
