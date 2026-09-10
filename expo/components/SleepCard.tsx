import React, { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { getLocalDateString } from "@/constants/dayTypes";
import {
  getSleepTarget,
  isSleepDeficient,
  loadSleepLog,
  saveSleepHours,
  SLEEP_WARNING_TEXT,
  weeklyAverage,
  type SleepLog,
} from "@/lib/sleepEngine";
import SourceTag from "@/components/SourceTag";

/**
 * Sleep log card (Walsh et al. 2021): log last night's sleep, see the
 * age-adjusted target, weekly average and an amber warning when low.
 */
export default function SleepCard({ age }: { age: number }) {
  const target = getSleepTarget(age);
  const [log, setLog] = useState<SleepLog>({});
  const [hoursText, setHoursText] = useState("");
  const [minsText, setMinsText] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadSleepLog().then((l) => {
      if (!cancelled) setLog(l);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const avg = weeklyAverage(log);
  const deficient = isSleepDeficient(avg, age);
  const midTarget = (target.min + target.max) / 2;
  const progress = avg !== null ? Math.min(avg / target.max, 1) : 0;

  const handleSave = useCallback(async () => {
    const hours = parseFloat(hoursText || "0");
    const mins = parseFloat(minsText || "0");
    const total = hours + mins / 60;
    if (!Number.isFinite(total) || total <= 0 || total > 24) return;

    await saveSleepHours(getLocalDateString(), total);
    setLog(await loadSleepLog());
    setHoursText("");
    setMinsText("");
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }, [hoursText, minsText]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>😴 Sleep</Text>

      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>Last night:</Text>
        <TextInput
          style={styles.input}
          value={hoursText}
          onChangeText={setHoursText}
          placeholder="7"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="number-pad"
          maxLength={2}
        />
        <Text style={styles.unit}>h</Text>
        <TextInput
          style={styles.inputSmall}
          value={minsText}
          onChangeText={setMinsText}
          placeholder="30"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="number-pad"
          maxLength={2}
        />
        <Text style={styles.unit}>min</Text>
        <Pressable
          onPress={() => void handleSave()}
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.saveBtnText}>{savedFlash ? "✓" : "Log"}</Text>
        </Pressable>
      </View>

      <Text style={styles.targetText}>
        Your target: {target.min}–{target.max} {target.unit} (age-adjusted)
      </Text>

      {avg !== null ? (
        <View style={styles.weekBlock}>
          <Text style={styles.weekText}>This week: {avg}h avg</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.weekSub}>
            {avg}/{midTarget}h
          </Text>
        </View>
      ) : null}

      {deficient ? <Text style={styles.warningText}>{SLEEP_WARNING_TEXT}</Text> : null}

      <SourceTag text="Walsh et al. 2021: sleep targets are individual. Most young athletes need 8–10 hours." />
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
  title: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    width: 44,
    textAlign: "center" as const,
  },
  inputSmall: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    color: Colors.text,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 52,
    textAlign: "center" as const,
  },
  unit: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginLeft: "auto" as const,
    minHeight: 36,
    justifyContent: "center" as const,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#0A0D11",
  },
  targetText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  weekBlock: {
    marginBottom: 10,
  },
  weekText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceElevated,
    overflow: "hidden" as const,
    marginBottom: 4,
  },
  barFill: {
    height: "100%" as const,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  weekSub: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#F59E0B",
    marginBottom: 10,
  },
});
