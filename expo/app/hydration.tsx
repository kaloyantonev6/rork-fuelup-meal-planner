import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Clock3, Droplets, GlassWater, Info, Sunrise } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { fonts } from "@/constants/design";
import ScreenBackground from "@/components/ui/ScreenBackground";
import SweatTestCard from "@/components/SweatTestCard";
import { MetricLegend, MetricRow, RingHero, metricLevel } from "@/components/PerformanceScorecard";
import { useToday } from "@/providers/TodayProvider";
import {
  addWater,
  loadTodayHydration,
  loadTodayHydrationLog,
  type HydrationLogEntry,
} from "@/lib/hydrationStore";
import { getHydrationWarnings } from "@/lib/hydrationEngine";

// Ice-blue accent shared with the sleep hero ring.
const RING_ACCENT = "#8FB8DC";

const SIP_GOAL = 8; // drinks per day — a 250ml glass each

/**
 * Hydration performance screen — the same scorecard language as Sleep, but
 * tracking stays manual: tap-to-log glasses and bottles, a timestamped log,
 * NATA 2017 warnings and the sweat test. The ring and metrics update live
 * with every entry.
 */
export default function HydrationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { todayData } = useToday();

  const [hydrationMl, setHydrationMl] = useState(0);
  const [log, setLog] = useState<HydrationLogEntry[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customMl, setCustomMl] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  const targetMl = Math.round((todayData?.hydrationTarget ?? 3) * 1000);

  const reload = useCallback(async () => {
    setHydrationMl(await loadTodayHydration());
    setLog(await loadTodayHydrationLog());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const handleAdd = useCallback(
    (ml: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void addWater(ml).then((next) => {
        setHydrationMl(next);
        void loadTodayHydrationLog().then(setLog);
      });
    },
    [],
  );

  const handleCustom = useCallback(() => {
    const ml = parseInt(customMl, 10);
    if (!ml || ml <= 0 || ml > 3000) {
      Alert.alert("Invalid amount", "Enter an amount between 1 and 3000 ml.");
      return;
    }
    setShowCustom(false);
    setCustomMl("");
    handleAdd(ml);
  }, [customMl, handleAdd]);

  // ── Metrics (all derived from today's manual entries) ──
  const metrics = useMemo(() => {
    const intakePct = targetMl > 0 ? Math.round((hydrationMl / targetMl) * 100) : 0;

    const beforeNoon = log
      .filter((e) => {
        const [h] = e.time.split(":").map(Number);
        return (h ?? 12) < 12;
      })
      .reduce((sum, e) => sum + e.ml, 0);
    const morningGoal = targetMl * 0.3;
    const morningPct = morningGoal > 0 ? Math.round(Math.min(beforeNoon / morningGoal, 1) * 100) : 0;

    const sipsPct = Math.round(Math.min(log.length / SIP_GOAL, 1) * 100);

    const now = new Date();
    const wakeMin = 7 * 60;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const dayFraction = Math.min(Math.max((nowMin - wakeMin) / (23 * 60 - wakeMin), 0), 1);
    const expectedPct = dayFraction * 100;
    const actualPct = targetMl > 0 ? Math.min((hydrationMl / targetMl) * 100, 130) : 0;
    const pacePct = Math.round(Math.min(Math.max(50 + (actualPct - expectedPct) * 2, 0), 100));

    return { intakePct, morningPct, sipsPct, pacePct };
  }, [hydrationMl, log, targetMl]);

  const progress = targetMl > 0 ? Math.min(hydrationMl / targetMl, 1) : 0;
  const warnings = getHydrationWarnings(hydrationMl / 1000, todayData?.dayType ?? "training");

  return (
    <View style={styles.container}>
      <ScreenBackground />
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
        <Text style={styles.headerTitle}>TODAY</Text>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setInfoOpen(true);
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="How this is measured"
        >
          <Info size={20} color="rgba(241,245,249,0.5)" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ring ── */}
        <RingHero
          brand="FUELIFY"
          percent={Math.round(metrics.intakePct)}
          label={"HYDRATION"}
          level={metricLevel(metrics.intakePct)}
          subText={`${(hydrationMl / 1000).toFixed(2)}L of ${(targetMl / 1000).toFixed(1)}L target`}
        />

        {/* ── Metric breakdown ── */}
        <View style={styles.card}>
          <MetricRow
            icon={Droplets}
            label="INTAKE VS. TARGET"
            value={`${metrics.intakePct}%`}
            level={metricLevel(metrics.intakePct)}
          />
          <MetricRow
            icon={Sunrise}
            label="MORNING START"
            value={`${metrics.morningPct}%`}
            level={metricLevel(metrics.morningPct)}
          />
          <MetricRow
            icon={GlassWater}
            label="DRINKS LOGGED"
            value={`${log.length}/${SIP_GOAL}`}
            level={metricLevel(metrics.sipsPct)}
          />
          <MetricRow
            icon={Clock3}
            label="PACE VS. CLOCK"
            value={`${metrics.pacePct}%`}
            level={metricLevel(metrics.pacePct)}
            last
          />
          <MetricLegend />
        </View>

        {/* ── Quick add ── */}
        <View style={styles.quickRow}>
          <Pressable
            onPress={() => handleAdd(250)}
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
            accessibilityRole="button"
            accessibilityLabel="Add a glass, 250 millilitres"
          >
            <GlassWater size={18} color={RING_ACCENT} />
            <Text style={styles.quickBtnText}>Glass · 250ml</Text>
          </Pressable>
          <Pressable
            onPress={() => handleAdd(500)}
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
            accessibilityRole="button"
            accessibilityLabel="Add a bottle, 500 millilitres"
          >
            <Droplets size={18} color={RING_ACCENT} />
            <Text style={styles.quickBtnText}>Bottle · 500ml</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowCustom(true);
          }}
          style={({ pressed }) => [styles.customBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Add a custom amount"
        >
          <Text style={styles.customBtnText}>Custom amount</Text>
        </Pressable>

        {/* Warnings (NATA 2017) */}
        {warnings.map((w, i) => (
          <View
            key={i}
            style={[styles.warningCard, w.level === "amber" && styles.warningAmber]}
          >
            <Text style={styles.warningText}>{w.text}</Text>
          </View>
        ))}

        {/* Today's log */}
        <View style={styles.logCard}>
          <View style={styles.logHeader}>
            <Text style={styles.logTitle}>Today&apos;s log</Text>
            <Text style={styles.logCount}>{log.length} {log.length === 1 ? "entry" : "entries"}</Text>
          </View>
          {log.length === 0 ? (
            <Text style={styles.logEmpty}>No drinks logged yet — tap a glass to start.</Text>
          ) : (
            [...log].reverse().map((entry, i) => (
              <View key={`${entry.time}-${i}`} style={styles.logRow}>
                <Text style={styles.logTime}>{entry.time}</Text>
                <Text style={styles.logMl}>+{entry.ml}ml</Text>
              </View>
            ))
          )}
        </View>

        {/* Sweat test — personal sweat rate */}
        <SweatTestCard />

        <Text style={styles.sourceTag}>
          📚 Source: ACSM 2007 — aim to lose &lt;2% body weight during exercise. Pre-exercise:
          400–600ml, 30 min before.
        </Text>
      </ScrollView>

      {/* Custom amount modal */}
      <Modal visible={showCustom} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCustom(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Custom amount</Text>
            <TextInput
              style={styles.modalInput}
              value={customMl}
              onChangeText={(t) => setCustomMl(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="ml"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
              maxLength={4}
            />
            <Pressable onPress={handleCustom} style={({ pressed }) => [styles.modalSave, pressed && { opacity: 0.9 }]}>
              <Text style={styles.modalSaveText}>Add</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Info modal */}
      <Modal visible={infoOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setInfoOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>How this is measured</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Intake vs. target</Text> — today&apos;s logged drinks
              against your personal daily target.{"\n\n"}
              <Text style={styles.infoBold}>Morning start</Text> — how much you drank before noon
              against 30% of the target; front-loading helps performance.{"\n\n"}
              <Text style={styles.infoBold}>Drinks logged</Text> — sips today against a steady
              {` ${SIP_GOAL}`}-drink rhythm.{"\n\n"}
              <Text style={styles.infoBold}>Pace vs. clock</Text> — whether you&apos;re ahead of or
              behind where you should be at this hour.{"\n\n"}
              Hydration isn&apos;t auto-tracked — log each drink as you have it and the ring and
              metrics update instantly.
            </Text>
            <Pressable
              onPress={() => setInfoOpen(false)}
              style={({ pressed }) => [styles.modalSave, pressed && { opacity: 0.9 }]}
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
    fontFamily: fonts.display,
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

  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.1)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: 0.2,
  },
  customBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.12)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  customBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    letterSpacing: 0.4,
  },

  warningCard: {
    backgroundColor: Colors.bg2,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.06)",
    padding: 12,
    marginTop: 12,
  },
  warningAmber: {
    borderLeftColor: "#F5A623",
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text,
  },

  logCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.06)",
    padding: 16,
    marginTop: 12,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  logTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  logCount: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textTertiary,
  },
  logEmpty: {
    fontSize: 12,
    color: Colors.textTertiary,
    paddingVertical: 8,
  },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(241,245,249,0.08)",
  },
  logTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  logMl: {
    fontSize: 13,
    fontWeight: "700",
    color: RING_ACCENT,
    fontVariant: ["tabular-nums"],
  },

  sourceTag: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontStyle: "italic",
    marginTop: 16,
    textAlign: "center",
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
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.12)",
    borderRadius: 10,
    color: Colors.text,
    fontSize: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    textAlign: "center",
    marginBottom: 14,
  },
  modalSave: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 14,
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
