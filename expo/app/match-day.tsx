import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  Animated,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Pencil,
  Trophy,
  Dumbbell,
  Moon,
  Heart,
  Clock,
  Flame,
  Droplet,
  Check,
  ChevronRight,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { calculateDayTargets } from "@/utils/dailyTargets";
import { getDayTypeFromSchedule } from "@/utils/mealGenerator";
import {
  TIMELINE_TEMPLATES,
  generateTimeline,
  getCurrentTimelineStatus,
  entryTimeToDate,
  formatDuration,
  parseTimeString,
  formatTime,
} from "@/utils/timeline";
import type { DayType } from "@/types";
import type { TimelineEntry, TimelineTemplate } from "@/utils/timeline";

const KICKOFF_KEY = "fuelup_default_kickoff";
const TRAINING_TIME_KEY = "fuelup_default_training_time";
const COMPLETED_SESSIONS_PREFIX = "fuelup_completed_sessions_";

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCompletedKey(): string {
  return `${COMPLETED_SESSIONS_PREFIX}${getTodayKey()}`;
}

const SLOT_ICONS: Record<TimelineEntry["mealSlot"], string> = {
  breakfast: "🍳",
  pre_match_meal: "🍝",
  pre_match_snack: "🍌",
  hydration: "💧",
  half_time: "🍊",
  post_match: "🥤",
  evening: "🍽️",
  pre_training_meal: "🍚",
  pre_training_snack: "🍌",
  training_session: "⚽",
  post_training: "🥤",
  mid_morning_snack: "🥜",
  afternoon_snack: "🍎",
};

const DAY_PLAN_CONFIG: Record<DayType, { title: string; icon: React.ReactNode; sessionLabel: string; timeLabel: string; color: string; headerGradient: readonly [string, string, string]; accentColor: string }> = {
  training: {
    title: "Training Day Fuel Plan",
    icon: <Dumbbell size={22} color={Colors.training} />,
    sessionLabel: "TRAINING",
    timeLabel: "Training",
    color: Colors.training,
    headerGradient: ["#0f2f1a", "#0f3d2a", "#0F1115"] as const,
    accentColor: Colors.training,
  },
  match: {
    title: "Match Day Fuel Plan",
    icon: <Trophy size={22} color={Colors.match} />,
    sessionLabel: "KICKOFF",
    timeLabel: "Kickoff",
    color: Colors.match,
    headerGradient: ["#3a1a1a", "#2a1212", "#0F1115"] as const,
    accentColor: Colors.match,
  },
  rest: {
    title: "Rest Day Fuel Plan",
    icon: <Moon size={22} color={Colors.rest} />,
    sessionLabel: "DAY",
    timeLabel: "Rest",
    color: Colors.rest,
    headerGradient: ["#1f2229", "#1a1d23", "#0F1115"] as const,
    accentColor: Colors.primary,
  },
  recovery: {
    title: "Recovery Day Fuel Plan",
    icon: <Heart size={22} color={Colors.recovery} />,
    sessionLabel: "DAY",
    timeLabel: "Recovery",
    color: Colors.recovery,
    headerGradient: ["#2a1d0f", "#1f1a12", "#0F1115"] as const,
    accentColor: Colors.recovery,
  },
};

function AnimatedCheckbox({ checked }: { checked: boolean }) {
  const scale = React.useRef(new Animated.Value(checked ? 1 : 0)).current;
  const opacity = React.useRef(new Animated.Value(checked ? 1 : 0)).current;

  React.useEffect(() => {
    if (checked) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 0,
          friction: 5,
          tension: 50,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 80,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [checked, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.checkbox,
        checked && styles.checkboxChecked,
        checked && { transform: [{ scale }] },
      ]}
    >
      <Animated.View style={[{ transform: [{ scale }] }, { opacity }]}>
        <Check size={13} color={Colors.background} />
      </Animated.View>
    </Animated.View>
  );
}

export default function MatchDayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile } = useMealPlan();
  const params = useLocalSearchParams<{ dayType?: DayType }>();
  const firstName = profile.name?.split(" ")[0] || "player";

  const todayDayType = useMemo((): DayType => {
    return getDayTypeFromSchedule(new Date(), profile);
  }, [profile]);

  const activeDayType = useMemo((): DayType => {
    const param = params.dayType;
    if (param === "training" || param === "match" || param === "rest" || param === "recovery") {
      return param;
    }
    return todayDayType;
  }, [params.dayType, todayDayType]);

  const template = TIMELINE_TEMPLATES[activeDayType];
  const config = DAY_PLAN_CONFIG[activeDayType];
  const isSessionDay = activeDayType === "match" || activeDayType === "training";

  const defaultSessionTime = activeDayType === "match" ? profile.defaultKickoffTime : profile.defaultTrainingTime;
  const [sessionTime, setSessionTime] = useState(defaultSessionTime ?? (activeDayType === "match" ? "15:00" : "18:00"));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerHour, setPickerHour] = useState(15);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [celebration, setCelebration] = useState<null | { title: string; body: string }>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadSessionTime = async () => {
      try {
        if (activeDayType === "match") {
          const stored = await AsyncStorage.getItem(KICKOFF_KEY);
          const time = stored ?? profile.defaultKickoffTime ?? "15:00";
          setSessionTime(time);
          const parsed = parseTimeString(time);
          setPickerHour(parsed.hour);
          setPickerMinute(parsed.minute);
        } else if (activeDayType === "training") {
          const stored = await AsyncStorage.getItem(TRAINING_TIME_KEY);
          const time = stored ?? profile.defaultTrainingTime ?? "18:00";
          setSessionTime(time);
          const parsed = parseTimeString(time);
          setPickerHour(parsed.hour);
          setPickerMinute(parsed.minute);
        }
      } catch (e) {
        console.log("[DayFuelPlan] Error loading session time:", e);
      }
    };
    void loadSessionTime();
  }, [activeDayType, profile.defaultKickoffTime, profile.defaultTrainingTime]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const loadCompleted = async () => {
      try {
        const stored = await AsyncStorage.getItem(getCompletedKey());
        if (stored) {
          const parsed = JSON.parse(stored) as number[];
          if (Array.isArray(parsed)) {
            setCompletedIndices(parsed);
          }
        }
      } catch (e) {
        console.log("[DayFuelPlan] Error loading completed sessions:", e);
      }
    };
    void loadCompleted();
  }, []);

  const dayTargets = useMemo(() => {
    return calculateDayTargets(profile, activeDayType);
  }, [profile, activeDayType]);

  const timeline = useMemo(
    () => generateTimeline(sessionTime, dayTargets.calories, template),
    [sessionTime, dayTargets.calories, template],
  );

  const { activeIdx } = useMemo(
    () => getCurrentTimelineStatus(timeline, sessionTime, template),
    [timeline, sessionTime, template],
  );

  const totalCalFromTimeline = timeline.reduce(
    (sum: number, e: TimelineEntry) => sum + Math.round(dayTargets.calories * e.caloriePct),
    0,
  );

  const toggleCompleted = useCallback(async (idx: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let willComplete = false;
    setCompletedIndices((prev) => {
      const isAlready = prev.includes(idx);
      willComplete = !isAlready;
      const next = isAlready
        ? prev.filter((i) => i !== idx)
        : [...prev, idx];
      void AsyncStorage.setItem(getCompletedKey(), JSON.stringify(next)).catch((e) =>
        console.log("[DayFuelPlan] Error saving completed sessions:", e),
      );
      return next;
    });

    // Fire celebration popup when a meal is newly completed.
    if (willComplete) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const completedSet = new Set(completedIndices);
      completedSet.add(idx);

      // Only the final meal in the timeline gets the "last fuel session" message.
      if (idx === timeline.length - 1) {
        setCelebration({
          title: `Well done, ${firstName}! 🎉`,
          body: "That was your last fuel session of the day. Recovery starts now — rest up and refuel for tomorrow!",
        });
      } else {
        // Find the next incomplete fuel session after this one (regardless of time).
        let nextIdx: number | null = null;
        for (let i = idx + 1; i < timeline.length; i++) {
          if (!completedSet.has(i)) {
            nextIdx = i;
            break;
          }
        }

        if (nextIdx === null) {
          // Everything else is already checked off.
          setCelebration({
            title: `You're on fire, ${firstName}! 🔥`,
            body: "All remaining fuel sessions are already checked off. You're ahead of the game today!",
          });
        } else {
          const nextEntry = timeline[nextIdx]!;
          const nextTime = entryTimeToDate(nextEntry, sessionTime, template, nextIdx);
          const progress = idx / (timeline.length - 1);
          const title =
            progress < 0.35
              ? `Great start, ${firstName}! 🚀`
              : progress < 0.7
                ? `Keep it up, ${firstName}! 💪`
                : `Strong finish, ${firstName}! 🔥`;
          const body = nextTime
            ? `Your next fuel session, ${nextEntry.label}, is ${formatDuration(nextTime.getTime() - Date.now())}. Keep it up and see you there!`
            : `Your next fuel session, ${nextEntry.label}, is coming up. Keep it up and see you there!`;
          setCelebration({ title, body });
        }
      }
    }
  }, [completedIndices, timeline, sessionTime, template, firstName]);

  const handleSaveSessionTime = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTime = formatTime(pickerHour, pickerMinute);
    setSessionTime(newTime);
    setShowTimePicker(false);
    try {
      if (activeDayType === "match") {
        await AsyncStorage.setItem(KICKOFF_KEY, newTime);
        updateProfile({ defaultKickoffTime: newTime });
      } else if (activeDayType === "training") {
        await AsyncStorage.setItem(TRAINING_TIME_KEY, newTime);
        updateProfile({ defaultTrainingTime: newTime });
      }
    } catch (e) {
      console.log("[DayFuelPlan] Error saving session time:", e);
    }
  }, [pickerHour, pickerMinute, activeDayType, updateProfile]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={config.headerGradient}
        locations={[0, 0.4, 1]}
        style={[styles.headerGradient, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.topBarTitle}>{config.title}</Text>
          <View style={styles.backBtn} />
        </View>

        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <View style={styles.kickoffCard}>
            <View style={styles.kickoffLeft}>
              <View style={[styles.kickoffIconWrap, { backgroundColor: config.color + "25" }]}>
                {config.icon}
              </View>
              <View>
                <Text style={styles.kickoffLabel}>{config.sessionLabel}</Text>
                <Text style={styles.kickoffTime}>{sessionTime}</Text>
              </View>
            </View>
            {isSessionDay && (
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const parsed = parseTimeString(sessionTime);
                  setPickerHour(parsed.hour);
                  setPickerMinute(parsed.minute);
                  setShowTimePicker(true);
                }}
                style={({ pressed }) => [styles.editKickoffBtn, pressed && { opacity: 0.7 }]}
              >
                <Pencil size={14} color={Colors.primary} />
                <Text style={styles.editKickoffText}>Edit</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Flame size={16} color={config.accentColor} />
              <Text style={styles.summaryValue}>{dayTargets.calories}</Text>
              <Text style={styles.summaryLabel}>kcal target</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.macroText}>{dayTargets.protein}g P</Text>
              <Text style={styles.macroText}>{dayTargets.carbs}g C</Text>
              <Text style={styles.macroText}>{dayTargets.fat}g F</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                <Text style={{ color: Colors.primary }}>{completedIndices.length}</Text>
                <Text style={{ color: Colors.textTertiary, fontSize: 14 }}>{`/${timeline.length}`}</Text>
              </Text>
              <Text style={styles.summaryLabel}>fuel points</Text>
            </View>
          </View>

          {activeDayType !== todayDayType && (
            <View style={styles.notMatchDayNote}>
              <Text style={styles.notMatchDayText}>
                Today is a {todayDayType} day. You are planning a {activeDayType} day.
              </Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timelineContainer}>
          {timeline.map((entry, idx) => {
            const isActive = idx === activeIdx;
            const isPast = idx < activeIdx;
            const isFuture = idx > activeIdx;
            const entryCalories = Math.round(dayTargets.calories * entry.caloriePct);
            const icon = SLOT_ICONS[entry.mealSlot];
            const isCompleted = completedIndices.includes(idx);

            return (
              <View key={idx} style={styles.timelineItem}>
                {/* Timeline line and node */}
                <View style={styles.timelineRail}>
                  {idx > 0 && (
                    <View
                      style={[
                        styles.timelineLineTop,
                        isPast ? { backgroundColor: Colors.primary + "60" } : { backgroundColor: Colors.border },
                      ]}
                    />
                  )}
                  {idx < timeline.length - 1 && (
                    <View
                      style={[
                        styles.timelineLineBottom,
                        isPast || isActive ? { backgroundColor: Colors.primary + "60" } : { backgroundColor: Colors.border },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.timelineNode,
                      isActive && styles.timelineNodeActive,
                      isPast && styles.timelineNodePast,
                      isFuture && styles.timelineNodeFuture,
                      isCompleted && styles.timelineNodeCompleted,
                    ]}
                  >
                    {isCompleted && <Check size={14} color={Colors.background} />}
                    {isActive && !isCompleted && <View style={styles.timelineNodeActiveDot} />}
                  </View>
                </View>

                {/* Content card */}
                <Pressable
                  onPress={() => void toggleCompleted(idx)}
                  style={({ pressed }) => [
                    styles.entryCard,
                    isActive && styles.entryCardActive,
                    isPast && styles.entryCardPast,
                    isCompleted && styles.entryCardCompleted,
                    pressed && { opacity: 0.92 },
                  ]}
                >
                  <View style={styles.entryHeader}>
                    <View style={styles.entryTimeWrap}>
                      <Clock size={13} color={isActive ? Colors.primary : Colors.textTertiary} />
                      <Text
                        style={[
                          styles.entryTime,
                          isActive && styles.entryTimeActive,
                          isPast && styles.entryTimePast,
                          isCompleted && styles.entryTimeCompleted,
                        ]}
                      >
                        {entry.timeLabel}
                      </Text>
                      <Text style={styles.entryOffset}>{entry.offsetLabel}</Text>
                    </View>
                    <View style={styles.entryHeaderRight}>
                      <Text style={styles.entryIcon}>{icon}</Text>
                      <AnimatedCheckbox checked={isCompleted} />
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.entryLabel,
                      isActive && styles.entryLabelActive,
                      isPast && styles.entryLabelPast,
                      isCompleted && styles.entryLabelCompleted,
                    ]}
                  >
                    {entry.label}
                  </Text>
                  <Text style={styles.entryDescription}>{entry.description}</Text>

                  <View style={styles.entryFooter}>
                    {entryCalories > 0 ? (
                      <View style={styles.entryCalWrap}>
                        <Flame size={12} color={config.accentColor} />
                        <Text style={styles.entryCalText}>~{entryCalories} kcal</Text>
                      </View>
                    ) : (
                      <View style={styles.entryCalWrap}>
                        <Droplet size={12} color={Colors.primary} />
                        <Text style={styles.entryCalText}>0 kcal</Text>
                      </View>
                    )}
                    <Text style={styles.entryExample}>
                      {isCompleted ? "Completed ✓" : entry.example}
                    </Text>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Total summary */}
        <View style={styles.totalCard}>
          <Text style={styles.totalTitle}>Daily Fuel Summary</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{totalCalFromTimeline}</Text>
              <Text style={styles.totalLabel}>planned kcal</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>{dayTargets.calories}</Text>
              <Text style={styles.totalLabel}>target kcal</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalValue, { color: Colors.primary }]}>
                {Math.round((totalCalFromTimeline / dayTargets.calories) * 100)}%
              </Text>
              <Text style={styles.totalLabel}>coverage</Text>
            </View>
          </View>
        </View>

        {/* Hydration reminder adapts to day type */}
        <View style={styles.hydrationReminder}>
          <Droplet size={18} color={Colors.primary} />
          <View style={styles.hydrationReminderText}>
            <Text style={styles.hydrationReminderTitle}>{config.timeLabel} Hydration</Text>
            <Text style={styles.hydrationReminderBody}>{template.hydrationNote}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Celebration popup after completing a meal */}
      <Modal
        visible={celebration !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCelebration(null)}
      >
        <View style={styles.celebrationOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCelebration(null)} />
          <View style={styles.celebrationCard}>
            <View style={styles.celebrationIconWrap}>
              <Trophy size={32} color={Colors.primary} />
            </View>
            <Text style={styles.celebrationTitle}>{celebration?.title ?? "Well done!"}</Text>
            <Text style={styles.celebrationBody}>{celebration?.body ?? ""}</Text>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCelebration(null);
              }}
              style={({ pressed }) => [
                styles.celebrationBtn,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.celebrationBtnText}>Keep tracking</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowTimePicker(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Set {activeDayType === "match" ? "Kickoff" : activeDayType === "training" ? "Training" : "Session"} Time
              </Text>
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
            </View>

            <View style={styles.timePickerBody}>
              <View style={styles.timePickerRow}>
                <View style={styles.timePickerColumn}>
                  <Text style={styles.timePickerLabel}>Hour</Text>
                  <View style={styles.timeStepperRow}>
                    <Pressable
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPickerHour((h) => (h + 23) % 24);
                      }}
                      style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}
                    >
                      <Text style={styles.stepperText}>−</Text>
                    </Pressable>
                    <Text style={styles.timeValue}>
                      {String(pickerHour).padStart(2, "0")}
                    </Text>
                    <Pressable
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPickerHour((h) => (h + 1) % 24);
                      }}
                      style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}
                    >
                      <Text style={styles.stepperText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.timeColon}>:</Text>

                <View style={styles.timePickerColumn}>
                  <Text style={styles.timePickerLabel}>Minute</Text>
                  <View style={styles.timeStepperRow}>
                    <Pressable
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPickerMinute((m) => (m + 45) % 60);
                      }}
                      style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}
                    >
                      <Text style={styles.stepperText}>−</Text>
                    </Pressable>
                    <Text style={styles.timeValue}>
                      {String(pickerMinute).padStart(2, "0")}
                    </Text>
                    <Pressable
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPickerMinute((m) => (m + 15) % 60);
                      }}
                      style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}
                    >
                      <Text style={styles.stepperText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={styles.quickTimeRow}>
                {[
                  { label: "10:00", h: 10, m: 0 },
                  { label: "12:00", h: 12, m: 0 },
                  { label: "15:00", h: 15, m: 0 },
                  { label: "17:00", h: 17, m: 0 },
                  { label: "19:00", h: 19, m: 0 },
                  { label: "20:45", h: 20, m: 45 },
                ].map((qt) => (
                  <Pressable
                    key={qt.label}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPickerHour(qt.h);
                      setPickerMinute(qt.m);
                    }}
                    style={({ pressed }) => [
                      styles.quickTimeBtn,
                      pickerHour === qt.h && pickerMinute === qt.m && styles.quickTimeBtnActive,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickTimeText,
                        pickerHour === qt.h && pickerMinute === qt.m && styles.quickTimeTextActive,
                      ]}
                    >
                      {qt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={() => void handleSaveSessionTime()}
                style={({ pressed }) => [styles.saveTimeBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.saveTimeText}>
                  Save {activeDayType === "match" ? "Kickoff" : activeDayType === "training" ? "Training" : "Session"} Time
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  headerContent: {
    gap: 14,
  },
  kickoffCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  kickoffLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  kickoffIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.match + "25",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  kickoffLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1,
  },
  kickoffTime: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  editKickoffBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  editKickoffText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summaryItem: {
    alignItems: "center",
    gap: 2,
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase" as const,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  macroText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  notMatchDayNote: {
    backgroundColor: Colors.recovery + "15",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.recovery + "30",
  },
  notMatchDayText: {
    fontSize: 13,
    color: Colors.recovery,
    fontWeight: "500" as const,
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timelineContainer: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 100,
  },
  timelineRail: {
    width: 32,
    alignItems: "center",
    position: "relative" as const,
  },
  timelineLineTop: {
    position: "absolute" as const,
    top: 0,
    width: 2,
    height: 24,
  },
  timelineLineBottom: {
    position: "absolute" as const,
    top: 32,
    bottom: 0,
    width: 2,
  },
  timelineNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginTop: 16,
    zIndex: 1,
  },
  timelineNodeActive: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineNodeActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.background,
  },
  timelineNodePast: {
    backgroundColor: Colors.primary + "40",
    borderWidth: 0,
  },
  timelineNodeFuture: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.primary + "50",
  },
  timelineNodeCompleted: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  entryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginLeft: 8,
  },
  entryCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  entryCardPast: {
    opacity: 0.55,
  },
  entryCardCompleted: {
    borderColor: Colors.primary + "60",
    backgroundColor: Colors.primary + "10",
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  entryHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary + "80",
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  entryTimeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  entryTime: {
    fontSize: 15,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  entryTimeActive: {
    color: Colors.primary,
  },
  entryTimePast: {
    color: Colors.textTertiary,
  },
  entryTimeCompleted: {
    color: Colors.primary,
  },
  entryOffset: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  entryIcon: {
    fontSize: 22,
  },
  entryLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  entryLabelActive: {
    color: Colors.primary,
  },
  entryLabelPast: {
    color: Colors.textSecondary,
  },
  entryLabelCompleted: {
    color: Colors.primary,
  },
  entryDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  entryFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  entryCalWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  entryCalText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  entryExample: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontStyle: "italic" as const,
    flex: 1,
    textAlign: "right" as const,
  },
  totalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
    marginBottom: 16,
  },
  totalTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalItem: {
    alignItems: "center",
    gap: 3,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  hydrationReminder: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.primary + "12",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  hydrationReminderText: {
    flex: 1,
    gap: 4,
  },
  hydrationReminderTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  hydrationReminderBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  modalCancel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  timePickerBody: {
    padding: 24,
    gap: 20,
  },
  timePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  timePickerColumn: {
    alignItems: "center",
    gap: 10,
  },
  timePickerLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
  },
  timeStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  stepperText: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  timeValue: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: Colors.text,
    minWidth: 70,
    textAlign: "center" as const,
  },
  timeColon: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: Colors.textSecondary,
    marginTop: 24,
  },
  quickTimeRow: {
    flexDirection: "row",
    flexWrap: "wrap" as const,
    gap: 8,
    justifyContent: "center" as const,
  },
  quickTimeBtn: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  quickTimeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  quickTimeText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
  },
  quickTimeTextActive: {
    color: Colors.primary,
  },
  saveTimeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center" as const,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveTimeText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.background,
  },
  celebrationOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 24,
  },
  celebrationCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    padding: 24,
    alignItems: "center",
    gap: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  celebrationIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 1.5,
    borderColor: Colors.primary + "50",
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.text,
    textAlign: "center" as const,
  },
  celebrationBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 20,
  },
  celebrationBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center" as const,
    marginTop: 4,
    width: "100%",
  },
  celebrationBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.background,
  },
});
