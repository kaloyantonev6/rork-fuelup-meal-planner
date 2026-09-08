import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import Colors from "@/constants/colors";
import type { DayType } from "@/types";
import {
  DAY_ABBREVIATIONS,
  DAY_TYPE_META,
  DAY_TYPES,
  FULL_DAY_NAMES,
  PROGRAM_PRESETS,
} from "@/constants/dayTypes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// 52px circles only fit on wide screens; 44 keeps the 7-day row legible on smaller ones.
const CIRCLE = SCREEN_WIDTH >= 430 ? 52 : 44;
const SHEET_HEIGHT = 400;

interface WeeklyProgramEditorProps {
  /** Exactly 7 entries, index 0 = Monday */
  schedule: DayType[];
  /** Called with the new 7-entry schedule on every change (auto-save handled by parent) */
  onChange: (next: DayType[]) => void;
  /** Header title; pass null to hide (e.g. parent card already has a heading) */
  title?: string | null;
  subtitle?: string | null;
}

/**
 * Reusable weekly program editor: 7 tappable day circles with a bottom-sheet
 * day-type picker, color legend, quick presets with staggered apply animation,
 * long-press day tooltips and a transient "✓ Saved" confirmation.
 */
export default function WeeklyProgramEditor({
  schedule,
  onChange,
  title = "My Weekly Program",
  subtitle = "Tap each day to set your schedule",
}: WeeklyProgramEditorProps) {
  const [sheetDay, setSheetDay] = useState<number | null>(null);
  const [tooltipDay, setTooltipDay] = useState<number | null>(null);

  const sheetAnim = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;
  const savedAnim = useRef(new Animated.Value(0)).current;

  const scaleAnims = useRef<Animated.Value[]>([]);
  const colorAnims = useRef<{ anim: Animated.Value; from: DayType }[]>([]);
  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;
  const firstScheduleRef = useRef(true);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureScale = (i: number): Animated.Value => {
    if (!scaleAnims.current[i]) scaleAnims.current[i] = new Animated.Value(1);
    return scaleAnims.current[i]!;
  };

  const popDay = useCallback((i: number) => {
    const scale = ensureScale(i);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.15, friction: 3, tension: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }),
    ]).start();
  }, []);

  /** Cross-fades day i's colors from `from` to its (new) current type over 200ms. */
  const fadeDayColor = useCallback((i: number, from: DayType) => {
    const entry = colorAnims.current[i];
    if (!entry) {
      colorAnims.current[i] = { anim: new Animated.Value(0), from };
    } else {
      entry.from = from;
      entry.anim.setValue(0);
    }
    Animated.timing(colorAnims.current[i]!.anim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  // "✓ Saved" confirmation on every schedule change (skip the initial render)
  useEffect(() => {
    if (firstScheduleRef.current) {
      firstScheduleRef.current = false;
      return;
    }
    savedAnim.setValue(0);
    Animated.sequence([
      Animated.timing(savedAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(savedAnim, {
        toValue: 0,
        duration: 400,
        delay: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [schedule, savedAnim]);

  useEffect(
    () => () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    },
    [],
  );

  const showTooltip = useCallback(
    (i: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
      setTooltipDay(i);
      tooltipAnim.setValue(0);
      Animated.timing(tooltipAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      tooltipTimer.current = setTimeout(() => {
        Animated.timing(tooltipAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(
          () => setTooltipDay(null),
        );
      }, 1800);
    },
    [tooltipAnim],
  );

  const openSheet = useCallback(
    (i: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSheetDay(i);
      dragY.setValue(0);
      sheetAnim.setValue(0);
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [sheetAnim, dragY],
  );

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setSheetDay(null));
  }, [sheetAnim]);

  const setDayType = useCallback(
    (index: number, type: DayType) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const prev = scheduleRef.current[index] ?? "rest";
      if (prev !== type) {
        fadeDayColor(index, prev);
        popDay(index);
        const next = [...scheduleRef.current];
        next[index] = type;
        onChange(next);
      }
      closeSheet();
    },
    [onChange, closeSheet, fadeDayColor, popDay],
  );

  /** Applies a preset with a staggered 40ms-per-day animation cascade. */
  const applyPreset = useCallback(
    (presetSchedule: DayType[]) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const prev = [...scheduleRef.current];
      presetSchedule.forEach((type, i) => {
        setTimeout(() => {
          if (prev[i] !== type) {
            fadeDayColor(i, prev[i] ?? "rest");
            popDay(i);
          }
        }, i * 40);
      });
      onChange([...presetSchedule]);
    },
    [onChange, fadeDayColor, popDay],
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dx) < 40,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) dragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) {
          dragY.setValue(0);
          closeSheet();
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            friction: 8,
            tension: 80,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  const sheetInterp = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });
  const translateY = Animated.add(sheetInterp, dragY);
  const backdropOpacity = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const selectedPresetId =
    PROGRAM_PRESETS.find((p) => p.schedule.every((t, i) => t === schedule[i]))?.id ?? null;
  const sheetType = sheetDay !== null ? (schedule[sheetDay] ?? "rest") : null;

  return (
    <View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.tooltipAnchor}>
        {tooltipDay !== null ? (
          <Animated.View
            style={[
              styles.tooltip,
              { left: `${((tooltipDay + 0.5) / 7) * 100}%`, opacity: tooltipAnim },
            ]}
          >
            <Text style={styles.tooltipText}>
              {FULL_DAY_NAMES[tooltipDay]} — {DAY_TYPE_META[schedule[tooltipDay] ?? "rest"].label}
            </Text>
          </Animated.View>
        ) : null}

        <View style={styles.daysRow}>
          {schedule.map((dayType, i) => {
            const meta = DAY_TYPE_META[dayType] ?? DAY_TYPE_META.rest;
            const entry = colorAnims.current[i];
            const animating = entry !== undefined && entry.from !== dayType;
            const mix = (a: string, b: string) =>
              animating
                ? entry!.anim.interpolate({ inputRange: [0, 1], outputRange: [a, b] })
                : b;
            const scale = scaleAnims.current[i];
            return (
              <Pressable
                key={`${DAY_ABBREVIATIONS[i]}-${i}`}
                onPress={() => openSheet(i)}
                onLongPress={() => showTooltip(i)}
                style={styles.daySlot}
              >
                <Animated.View
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: mix(DAY_TYPE_META[entry?.from ?? "rest"].bgColor, meta.bgColor),
                      borderColor: mix(DAY_TYPE_META[entry?.from ?? "rest"].borderColor, meta.borderColor),
                      transform: [{ scale: scale ?? 1 }],
                    },
                  ]}
                >
                  <Text style={styles.dayIcon}>{meta.icon}</Text>
                </Animated.View>
                <Text style={[styles.dayLabel, { color: meta.color }]}>{DAY_ABBREVIATIONS[i]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.legendRow}>
        {DAY_TYPES.map((t) => (
          <View key={t} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: DAY_TYPE_META[t].color }]} />
            <Text style={styles.legendText}>{DAY_TYPE_META[t].label}</Text>
          </View>
        ))}
      </View>

      <Animated.View style={[styles.savedWrap, { opacity: savedAnim }]} pointerEvents="none">
        <Text style={styles.savedText}>✓ Saved</Text>
      </Animated.View>

      <Text style={styles.presetsTitle}>Quick Presets</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetsRow}
      >
        {PROGRAM_PRESETS.map((preset) => (
          <Pressable
            key={preset.id}
            onPress={() => applyPreset(preset.schedule)}
            style={({ pressed }) => [
              styles.presetCard,
              selectedPresetId === preset.id && styles.presetCardActive,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.presetName}>{preset.name}</Text>
            <View style={styles.presetDots}>
              {preset.schedule.map((t, i) => (
                <View
                  key={`${preset.id}-${i}`}
                  style={[styles.presetDot, { backgroundColor: DAY_TYPE_META[t].color }]}
                />
              ))}
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Modal transparent visible={sheetDay !== null} animationType="none" onRequestClose={closeSheet}>
        <View style={styles.sheetRoot}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          </Animated.View>
          <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{sheetDay !== null ? FULL_DAY_NAMES[sheetDay] : ""}</Text>
            {DAY_TYPES.map((t) => {
              const meta = DAY_TYPE_META[t];
              const selected = sheetType === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    if (sheetDay !== null) setDayType(sheetDay, t);
                  }}
                  style={({ pressed }) => [styles.optionRow, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.optionIcon}>{meta.icon}</Text>
                  <Text style={styles.optionLabel}>{meta.label}</Text>
                  <View style={[styles.optionDot, { backgroundColor: meta.color }]} />
                  {selected ? (
                    <Check size={18} color={Colors.primary} />
                  ) : (
                    <View style={styles.optionCheckSpace} />
                  )}
                </Pressable>
              );
            })}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  tooltipAnchor: {
    position: "relative" as const,
  },
  tooltip: {
    position: "absolute" as const,
    top: -36,
    transform: [{ translateX: -64 }],
    backgroundColor: Colors.bg4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    zIndex: 10,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  daysRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  daySlot: {
    alignItems: "center" as const,
    width: CIRCLE + 4,
  },
  dayCircle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 2,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  dayIcon: {
    fontSize: CIRCLE >= 52 ? 20 : 17,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  legendRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    rowGap: 6,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    width: "50%" as const,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  savedWrap: {
    height: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 6,
  },
  savedText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    marginTop: 8,
    marginBottom: 8,
  },
  presetsRow: {
    gap: 10,
    paddingRight: 8,
  },
  presetCard: {
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 150,
  },
  presetCardActive: {
    borderColor: Colors.primary,
  },
  presetName: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  presetDots: {
    flexDirection: "row" as const,
    gap: 5,
  },
  presetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: "flex-end" as const,
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: Colors.bg2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
    minHeight: SHEET_HEIGHT - 80,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.bg4,
    alignSelf: "center" as const,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    height: 52,
  },
  optionIcon: {
    fontSize: 20,
    width: 28,
    textAlign: "center" as const,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionCheckSpace: {
    width: 18,
  },
});
