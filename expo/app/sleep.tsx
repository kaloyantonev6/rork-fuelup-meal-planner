import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BatteryCharging,
  CalendarCheck2,
  Gauge,
  Info,
  Moon,
  Pencil,
  Sparkles,
  TrendingDown,
  Watch,
  Zap,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getLocalDateString } from "@/constants/dayTypes";
import SleepWheelPicker from "@/components/SleepWheelPicker";
import SleepTrendChart from "@/components/SleepTrendChart";
import { MetricLegend, MetricRow, RingHero, rangeLabel, metricLevel } from "@/components/PerformanceScorecard";
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
import { sleepPerformance } from "@/lib/sleepPerformance";

const DIAGNOSIS_STYLES: Record<SleepDiagnosisLevel, { color: string; icon: typeof Zap }> = {
  optimal: { color: Colors.primary, icon: Sparkles },
  good: { color: Colors.success, icon: BatteryCharging },
  fair: { color: Colors.warning, icon: Moon },
  poor: { color: Colors.error, icon: TrendingDown },
};

/**
 * Sleep performance screen — WHOOP-style hero ring with a metric breakdown
 * (hours vs. needed, consistency, efficiency, sleep stress), last night's
 * sleep with inline editing, the weekly trend chart and a recovery diagnosis.
 * Built as the landing surface for automatic wristband tracking; logging is
 * manual via the edit sheet until a device is connected.
 */
export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useMealPlan();
  const { todayData } = useToday();
  const target = getSleepTarget(profile.age || 20);

  const [log, setLog] = useState<SleepLog>({});
  const [hours, setHours] = useState(7);
  const [minutes, setMinutes] = useState(30);
  const [range, setRange] = useState<7 | 30>(7);
  // Today's date key — rolls over at midnight so the log state resets.
  const [dateKey, setDateKey] = useState(() => getLocalDateString());
  const [editOpen, setEditOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

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
  const perf = useMemo(() => sleepPerformance(log, profile.age || 20), [log, profile.age]);

  const DeltaIcon = weekAvg !== null && prevAvg !== null && weekAvg < prevAvg ? ArrowDownRight : ArrowUpRight;
  const delta = weekAvg !== null && prevAvg !== null ? Math.round((weekAvg - prevAvg) * 10) / 10 : null;
  const deltaPositive = delta !== null && delta >= 0;

  const loggedToday = perf.lastNightHours !== null;

  const openEdit = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditOpen(true);
  }, []);

  const saveEdit = useCallback(async () => {
    const total = hours + minutes / 60;
    if (total <= 0 || total > 24) return;
    await saveSleepHours(dateKey, total);
    setLog(await loadSleepLog());
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setEditOpen(false);
  }, [hours, minutes, dateKey]);

  const formatHours = (h: number | null) => {
    if (h === null) return "–";
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    if (mm === 0) return `${hh}h`;
    return `${hh}h ${String(mm).padStart(2, "0")}m`;
  };

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
        <Text style={styles.headerTitle}>{rangeLabel(6)}</Text>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setInfoOpen(true);
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="How these metrics are calculated"
        >
          <Info size={20} color="rgba(241,245,249,0.5)" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero: sleep performance ring ── */}
        <RingHero
          brand="FUELIFY"
          percent={perf.performance}
          label={"SLEEP\nPERFORMANCE"}
          level={perf.performance !== null ? metricLevel(perf.performance) : null}
          subText={
            loggedToday
              ? `Last night: ${formatHours(perf.lastNightHours)} against a ${perf.neededHours}h need`
              : "Awaiting tonight's log — open Last Night's Sleep below"
          }
        />

        {/* ── Metric breakdown ── */}
        <View style={styles.card}>
          <MetricRow
            icon={Moon}
            label="HOURS VS. NEEDED"
            value={perf.hoursVsNeeded !== null ? `${perf.hoursVsNeeded}%` : "–"}
            level={perf.hoursVsNeeded !== null ? metricLevel(perf.hoursVsNeeded) : null}
          />
          <MetricRow
            icon={CalendarCheck2}
            label="SLEEP CONSISTENCY"
            value={perf.consistency !== null ? `${perf.consistency}%` : "–"}
            level={perf.consistency !== null ? metricLevel(perf.consistency) : null}
          />
          <MetricRow
            icon={Gauge}
            label="SLEEP EFFICIENCY"
            value={perf.efficiency !== null ? `${perf.efficiency}%` : "–"}
            level={perf.efficiency !== null ? metricLevel(perf.efficiency) : null}
          />
          <MetricRow
            icon={Zap}
            label="HIGH SLEEP STRESS"
            value={perf.sleepStress !== null ? `${perf.sleepStress}%` : "–"}
            level={perf.sleepStress !== null ? metricLevel(perf.sleepStress, true) : null}
            last
          />
          <MetricLegend />
        </View>

        {/* ── Last night's sleep ── */}
        <View style={styles.card}>
          <View style={styles.lastNightHeader}>
            <Text style={styles.lastNightTitle}>Last Night&apos;s Sleep</Text>
            <Pressable
              onPress={openEdit}
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel="Edit last night's sleep"
            >
              <Text style={styles.editText}>EDIT</Text>
              <Pencil size={13} color={Colors.primary} />
            </Pressable>
          </View>

          <View style={styles.lastNightRow}>
            <Text style={styles.lastNightLabel}>HOURS OF SLEEP</Text>
            <Text style={styles.lastNightValue}>{formatHours(loggedToday ? perf.lastNightHours : null)}</Text>
          </View>
          <View style={[styles.lastNightRow, styles.lastNightRowLast]}>
            <Text style={styles.lastNightLabel}>VS NEEDED</Text>
            <Text
              style={[
                styles.lastNightValue,
                {
                  color:
                    perf.lastNightHours === null
                      ? Colors.text
                      : perf.lastNightHours >= perf.neededHours
                        ? Colors.success
                        : Colors.warning,
                },
              ]}
            >
              {perf.lastNightHours === null
                ? "–"
                : `${perf.lastNightHours >= perf.neededHours ? "+" : ""}${(perf.lastNightHours - perf.neededHours).toFixed(1)}h`}
            </Text>
          </View>

          <View style={styles.deviceRow}>
            <Watch size={13} color="rgba(241,245,249,0.45)" />
            <Text style={styles.deviceText}>
              {loggedToday ? "Logged manually" : "No sleep logged yet"} · wristband auto-tracking coming soon
            </Text>
          </View>
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

        {todayData?.tomorrow.dayType === "match" ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Match eve protocol</Text>
            <Text style={styles.noteBody}>{SLEEP_MATCH_EVE_TEXT}</Text>
          </View>
        ) : null}

        <Text style={styles.sourceTag}>
          Source: Walsh et al. 2021 — sleep targets 9–11h (under 14), 8–10h (under 18), 7–9h (adults)
        </Text>
      </ScrollView>

      {/* ── Edit sheet: wheel picker ── */}
      <Modal visible={editOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Last night&apos;s sleep</Text>
            <SleepWheelPicker hours={hours} minutes={minutes} onHoursChange={setHours} onMinutesChange={setMinutes} />
            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditOpen(false);
                }}
                style={({ pressed }) => [styles.modalCancel, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void saveEdit()}
                style={({ pressed }) => [styles.modalSave, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Info sheet: how metrics work ── */}
      <Modal visible={infoOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setInfoOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>How this is measured</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Hours vs. needed</Text> — last night against your age-based
              sleep need ({perf.neededHours}h).{"\n\n"}
              <Text style={styles.infoBold}>Sleep consistency</Text> — how many of your logged nights
              this week reached your target minimum.{"\n\n"}
              <Text style={styles.infoBold}>Sleep efficiency</Text> — your weekly average against the
              target midpoint.{"\n\n"}
              <Text style={styles.infoBold}>High sleep stress</Text> — the opposite: 0% means your
              routine fully covers recovery, higher means a larger shortfall.{"\n\n"}
              Until your Fuelify wristband is connected, nights are logged manually — every value
              updates the moment you save.
            </Text>
            <Pressable
              onPress={() => setInfoOpen(false)}
              style={({ pressed }) => [styles.modalSave, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.modalSaveText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(241,245,249,0.85)",
    letterSpacing: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.06)",
    padding: 16,
    marginTop: 12,
  },

  lastNightHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  lastNightTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.4,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 32,
  },
  editText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1.2,
  },
  lastNightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(241,245,249,0.08)",
  },
  lastNightRowLast: {
    borderBottomWidth: 0,
  },
  lastNightLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(241,245,249,0.5)",
    letterSpacing: 1.4,
  },
  lastNightValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    fontVariant: ["tabular-nums"],
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(241,245,249,0.08)",
  },
  deviceText: {
    flex: 1,
    fontSize: 11,
    color: "rgba(241,245,249,0.45)",
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
    marginTop: 12,
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
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.06)",
    padding: 16,
    marginTop: 12,
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
    marginTop: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.08)",
    padding: 20,
    width: "100%",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 10,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: Colors.bg4,
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  modalSave: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  infoBold: {
    fontWeight: "700",
    color: Colors.text,
  },
});
