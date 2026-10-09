import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { CheckCircle2, ChevronRight, MoonStar } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useNotifications } from "@/providers/NotificationProvider";
import { getLocalDateString } from "@/constants/dayTypes";
import {
  averageForRange,
  loadSleepLog,
  sleepDiagnosis,
  suggestWindDown,
  type SleepLog,
} from "@/lib/sleepEngine";

/**
 * Bedtime reminder + sleep result summary for the Reminders tab. Read-only
 * status — the adjustable setting lives in the Profile tab, the full log and
 * graph on the Sleep screen.
 */
export default function BedtimeReminderSummary() {
  const router = useRouter();
  const { profile } = useMealPlan();
  const { bedtime } = useNotifications();
  const [log, setLog] = useState<SleepLog>({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void loadSleepLog().then((l) => {
        if (!cancelled) setLog(l);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const age = profile.age || 20;
  const weekAvg = averageForRange(log, 0, 7);
  const wakeTime = bedtime?.wakeTime ?? "07:00";
  const suggestion = suggestWindDown(weekAvg, age, wakeTime);
  const diagnosis = sleepDiagnosis(log, age);

  // Today's log, if any — the check resets at midnight when the key rolls over.
  const todayHours = log[getLocalDateString()];
  const loggedToday = typeof todayHours === "number" && todayHours > 0;

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/sleep" as never);
      }}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={
        bedtime?.enabled
          ? `Bedtime reminder on. Wind-down at ${suggestion.windDownTime}, lights out ${suggestion.bedTime}. Sleep result: ${diagnosis.title}`
          : "Bedtime reminder off. Open sleep screen"
      }
    >
      <View style={styles.iconWrap}>
        <MoonStar size={20} color={Colors.primary} strokeWidth={2.2} />
      </View>
      <View style={styles.textWrap}>
        {bedtime?.enabled ? (
          <>
            <Text style={styles.title}>
              Wind-down <Text style={styles.accent}>{suggestion.windDownTime}</Text> · Lights out{" "}
              <Text style={styles.accent}>{suggestion.bedTime}</Text>
            </Text>
            <Text style={styles.subtitle}>Bedtime reminder · from your {suggestion.durationUsed}h average</Text>
          </>
        ) : (
          <>
            <Text style={styles.titleOff}>Bedtime reminder is off</Text>
            <Text style={styles.subtitle}>Adjust it in your Profile settings</Text>
          </>
        )}
        <View style={styles.resultRow}>
          <CheckCircle2
            size={13}
            color={loggedToday ? Colors.primary : Colors.textTertiary}
            strokeWidth={2.4}
          />
          <Text style={styles.resultText} numberOfLines={1}>
            {loggedToday
              ? `Tonight logged · ${diagnosis.title}`
              : `Not logged yet · ${diagnosis.title}`}
          </Text>
        </View>
      </View>
      <ChevronRight size={16} color={Colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  titleOff: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  accent: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  resultText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
});
