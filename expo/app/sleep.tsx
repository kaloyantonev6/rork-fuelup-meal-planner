import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, BatteryCharging, Check, CheckCircle2, Moon, Sparkles, TrendingDown, Zap } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getLocalDateString } from "@/constants/dayTypes";
import SleepWheelPicker from "@/components/SleepWheelPicker";
import SleepTrendChart from "@/components/SleepTrendChart";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useToday } from "@/providers/TodayProvider";
import {
  getSleepTarget,
  averageForRange,
  loadSleepLog,
  saveSleepHours,
  sleepDiagnosis,
  SLEEP_MATCH_EVE_TEXT,
  type SleepDiagnosisLevel,
  type SleepLog,
} from "@/lib/sleepEngine";

const DIAGNOSIS_STYLES: Record<SleepDiagnosisLevel, { color: string; icon: typeof Zap }> = {
  optimal: { color: Colors.primary, icon: Sparkles },
  good: { color: Colors.success, icon: BatteryCharging },
  fair: { color: Colors.warning, icon: Moon },
  poor: { color: Colors.error, icon: TrendingDown },
};

/**
 * Sleep detail screen — wheel-based nightly log, a weekly trend chart with
 * range pills, and a performance & recovery diagnosis. The home dashboard
 * keeps a compact mini card that pushes into this screen.
 */
export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useMealPlan();
  const { todayData } = useToday();

  const isMatchEve = todayData?.tomorrow.dayType === "match";
  const target = getSleepTarget(profile.age || 20);

  const [log, setLog] = useState<SleepLog>({});
  const [hours, setHours] = useState(7);
  const [minutes, setMinutes] = useState(30);
  const [range, setRange] = useState<7 | 30>(7);
  const [justLogged, setJustLogged] = useState(false);
  // Today's date key — rolls over at midnight so the "logged" check resets.
  const [dateKey, setDateKey] = useState(() => getLocalDateString());

  useEffect(() => {
    let cancelled = false;
    void loadSleepLog().then((l) => {
      if (cancelled) return;
      setLog(l);
      const todayEntry = l[getLocalDateString()];
      if (typeof todayEntry === "number" && todayEntry > 0) {
        setHours(Math.floor(todayEntry));
        setMinutes(Math.round((todayEntry % 1) * 60 / 5) * 5);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Midnight rollover — the new day awaits a fresh log; saved nights stay in the graph.
  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 30, 0);
    const timeout = setTimeout(() => {
      setDateKey(getLocalDateString());
      void loadSleepLog().then(setLog);
    }, next.getTime() - now.getTime());
    return () => clearTimeout(timeout);
  }, [dateKey]);

  const weekAvg = useMemo(() => averageForRange(log, 0, 7), [log]);
  const prevAvg = useMemo(() => averageForRange(log, 7, 7), [log]);
  const diagnosis = useMemo(() => sleepDiagnosis(log, profile.age || 20), [log, profile.age]);
  const DeltaIcon = weekAvg !== null && prevAvg !== null && weekAvg < prevAvg ? ArrowDownRight : ArrowUpRight;
  const delta = weekAvg !== null && prevAvg !== null ? Math.round((weekAvg - prevAvg) * 10) / 10 : null;
  const deltaPositive = delta !== null && delta >= 0;

  // Done-check for today — back to "awaiting" automatically at midnight.
  const todayHours = log[dateKey];
  const loggedToday = typeof todayHours === "number" && todayHours > 0;

  const handleLog = useCallback(async () => {
    const total = hours + minutes / 60;
    if (total <= 0 || total > 24) return;
    await saveSleepHours(getLocalDateString(), total);
    setLog(await loadSleepLog());
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 1600);
  }, [hours, minutes, dateKey]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Sleep</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Large title, iOS style */}
        <Text style={styles.largeTitle}>Sleep</Text>
        <Text style={styles.largeSubtitle}>
          Log last night, watch your week, and see how it fuels recovery.
        </Text>

        {/* ── Log card: wheel picker + done-check ── */}
        <View style={styles.card}>
          <View style={styles.logHeaderRow}>
            <Text style={styles.cardLabel}>Last night</Text>
            {loggedToday ? (
              <View style={styles.loggedPill}>
                <CheckCircle2 size={13} color={Colors.primary} strokeWidth={2.4} />
                <Text style={styles.loggedPillText}>Logged for today</Text>
              </View>
            ) : null}
          </View>
          <SleepWheelPicker
            hours={hours}
            minutes={minutes}
            onHoursChange={setHours}
            onMinutesChange={setMinutes}
          />
          <Pressable
            onPress={() => void handleLog()}
            style={({ pressed }) => [
              styles.logButton,
              loggedToday && !justLogged && styles.logButtonDone,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={loggedToday ? "Sleep logged — tap to adjust" : "Log sleep"}
          >
            {justLogged ? (
              <Check size={18} color={Colors.textInverse} strokeWidth={3} />
            ) : (
              <Text style={styles.logButtonText}>{loggedToday ? "Adjust tonight's log" : "Log sleep"}</Text>
            )}
          </Pressable>
          <Text style={styles.targetText}>
            {loggedToday
              ? `Logged ${todayHours}h · resets tonight at midnight`
              : `Your target: ${target.min}–${target.max}h, age-adjusted`}
          </Text>
        </View>

        {/* ── Trend card: headline + chart + range pills ── */}
        <View style={styles.card}>
          <Text style={styles.chartEyebrow}>Weekly average</Text>
          {weekAvg !== null ? (
            <>
              <Text style={styles.bigValue}>{weekAvg}h</Text>
              {delta !== null && prevAvg !== null ? (
                <View
                  style={[
                    styles.deltaBadge,
                    { backgroundColor: deltaPositive ? Colors.primaryLight : "rgba(239,68,68,0.14)" },
                  ]}
                >
                  <DeltaIcon size={13} color={deltaPositive ? Colors.primary : Colors.error} strokeWidth={2.5} />
                  <Text style={[styles.deltaText, { color: deltaPositive ? Colors.primary : Colors.error }]}>
                    {deltaPositive ? "+" : ""}{delta}h vs last week
                  </Text>
                </View>
              ) : (
                <Text style={styles.deltaHint}>vs last week once you have history</Text>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.bigValue, styles.bigValueEmpty]}>–</Text>
              <Text style={styles.deltaHint}>No nights logged this week yet</Text>
            </>
          )}

          <SleepTrendChart log={log} targetMin={target.min} days={range} />

          <View style={styles.rangeSwitch}>
            {([7, 30] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => undefined);
                  setRange(value);
                }}
                style={[styles.rangePill, range === value && styles.rangePillActive]}
                accessibilityRole="button"
                accessibilityLabel={value === 7 ? "One week view" : "One month view"}
              >
                <Text style={[styles.rangeText, range === value && styles.rangeTextActive]}>
                  {value === 7 ? "1W" : "1M"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Diagnosis card ── */}
        <View style={styles.card}>
          <View style={styles.diagnosisHeader}>
            {(() => {
              const { color, icon: Icon } = DIAGNOSIS_STYLES[diagnosis.level];
              return (
                <View style={[styles.diagnosisIconWrap, { backgroundColor: `${color}20` }]}>
                  <Icon size={17} color={color} strokeWidth={2.2} />
                </View>
              );
            })()}
            <Text style={styles.diagnosisTitle}>{diagnosis.title}</Text>
          </View>
          <Text style={styles.diagnosisBody}>{diagnosis.body}</Text>
          <Text style={styles.diagnosisTag}>Performance &amp; recovery impact</Text>
        </View>

        {isMatchEve ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Match eve protocol</Text>
            <Text style={styles.noteBody}>{SLEEP_MATCH_EVE_TEXT}</Text>
          </View>
        ) : null}

        <Text style={styles.sourceTag}>
          Source: Walsh et al. 2021 — sleep targets 9–11h (under 14), 8–10h (under 18), 7–9h (adults)
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: 0.37,
    marginTop: 8,
  },
  largeSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 18,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  logHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  loggedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  loggedPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  logButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  logButtonDone: {
    backgroundColor: Colors.bg4,
  },
  logButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.textInverse,
    letterSpacing: -0.2,
  },
  targetText: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 12,
  },
  chartEyebrow: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  bigValue: {
    fontSize: 40,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    letterSpacing: 0.4,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  bigValueEmpty: {
    color: Colors.textTertiary,
  },
  deltaBadge: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  deltaText: {
    fontSize: 13,
    fontWeight: "600",
  },
  deltaHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 8,
  },
  rangeSwitch: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: Colors.bg3,
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  rangePill: {
    minHeight: 34,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  rangePillActive: {
    backgroundColor: Colors.bg4,
  },
  rangeText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textTertiary,
  },
  rangeTextActive: {
    color: Colors.text,
    fontWeight: "600",
  },
  diagnosisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  diagnosisIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  diagnosisTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
    letterSpacing: -0.4,
    flex: 1,
  },
  diagnosisBody: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  diagnosisTag: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textTertiary,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  noteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginTop: 4,
    marginBottom: 14,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.warning,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  noteBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  sourceTag: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 4,
  },
});
