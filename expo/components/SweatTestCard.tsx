import React, { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  calculateSweatRate,
  loadSweatTestResult,
  saveSweatTestResult,
  type StoredSweatTest,
} from "@/lib/hydrationEngine";
import SourceTag from "@/components/SourceTag";

const STATUS_COLORS: Record<string, string> = {
  "Well hydrated": "#22C55E",
  "Mild dehydration": "#F59E0B",
  "Moderate dehydration": "#F59E0B",
  "Severe dehydration": "#EF4444",
  Overhydrated: "#EF4444",
};

/**
 * Sweat Test card (ACSM 2007 / GSSI methodology): weigh in/out around a
 * session to find a personal sweat rate and hydration status.
 */
export default function SweatTestCard() {
  const [expanded, setExpanded] = useState(false);
  const [preWeight, setPreWeight] = useState("");
  const [postWeight, setPostWeight] = useState("");
  const [fluidMl, setFluidMl] = useState("");
  const [minutes, setMinutes] = useState("");
  const [result, setResult] = useState<StoredSweatTest | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadSweatTestResult().then((r) => {
      if (!cancelled && r) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCalculate = useCallback(async () => {
    const pre = parseFloat(preWeight);
    const post = parseFloat(postWeight);
    const fluid = parseFloat(fluidMl || "0");
    const mins = parseFloat(minutes || "0");
    if (
      !Number.isFinite(pre) ||
      !Number.isFinite(post) ||
      !Number.isFinite(fluid) ||
      !Number.isFinite(mins) ||
      pre <= 0 ||
      post <= 0 ||
      mins <= 0
    ) {
      return;
    }

    const computed = calculateSweatRate(pre, post, fluid, mins);
    await saveSweatTestResult(computed);
    setResult({ ...computed, testedAt: new Date().toISOString() });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, [preWeight, postWeight, fluidMl, minutes]);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.title}>💧 Sweat Test</Text>
        <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
      </Pressable>
      <Text style={styles.subtitle}>
        Find your personal sweat rate to optimise your hydration plan.
      </Text>

      {expanded ? (
        <View style={styles.form}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>1. Weight before training (kg)</Text>
            <TextInput
              style={styles.input}
              value={preWeight}
              onChangeText={setPreWeight}
              placeholder="70.0"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>2. Weight after training (kg)</Text>
            <TextInput
              style={styles.input}
              value={postWeight}
              onChangeText={setPostWeight}
              placeholder="69.2"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>3. Fluid drunk during (ml)</Text>
            <TextInput
              style={styles.input}
              value={fluidMl}
              onChangeText={setFluidMl}
              placeholder="500"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>4. Session length (min)</Text>
            <TextInput
              style={styles.input}
              value={minutes}
              onChangeText={setMinutes}
              placeholder="90"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
            />
          </View>

          <Pressable
            onPress={() => void handleCalculate()}
            style={({ pressed }) => [styles.calcBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.calcBtnText}>Calculate My Sweat Rate</Text>
          </Pressable>

          <SourceTag text="Based on ACSM 2007 / GSSI methodology" />
        </View>
      ) : null}

      {result ? (
        <View style={styles.resultBlock}>
          <View style={styles.resultHeaderRow}>
            <View
              style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[result.status] ?? "#9CA3AF") + "22" }]}
            >
              <Text style={[styles.statusText, { color: STATUS_COLORS[result.status] ?? "#9CA3AF" }]}>
                {result.status}
              </Text>
            </View>
            <Text style={styles.rateText}>{result.sweatRateLPerHour}L/hour</Text>
          </View>
          <Text style={styles.adviceText}>{result.advice}</Text>
          <Text style={styles.massLossText}>Body mass change: {result.massLossPercent}% (limit: 2%)</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  chevron: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  form: {
    gap: 12,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    color: Colors.text,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 88,
    textAlign: "center" as const,
  },
  calcBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  calcBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#0A0D11",
  },
  resultBlock: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
  },
  resultHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  rateText: {
    fontSize: 15,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  adviceText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
    marginBottom: 6,
  },
  massLossText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
});
