import React, { useCallback, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { MoonStar } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { TimeWheelPicker } from "@/components/SleepWheelPicker";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useNotifications } from "@/providers/NotificationProvider";
import { averageForRange, loadSleepLog, suggestWindDown, type SleepLog } from "@/lib/sleepEngine";

/**
 * Bedtime reminder settings — the adjustable control lives in the Profile tab.
 * Flat block (no outer card) so the host screen can wrap it in its own card.
 */
export default function BedtimeReminderSettings() {
  const { profile } = useMealPlan();
  const { bedtime, setBedtimeReminder, requestPermissions } = useNotifications();
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [log, setLog] = useState<SleepLog>({});

  // Reload on focus so the wind-down times reflect any newly logged nights.
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

  const wakeTime = bedtime?.wakeTime ?? "07:00";
  const weekAvg = averageForRange(log, 0, 7);
  const suggestion = suggestWindDown(weekAvg, profile.age || 20, wakeTime);

  const toggleReminder = useCallback(
    async (enabled: boolean) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (enabled) {
        const ok = await requestPermissions();
        setPermissionDenied(!ok);
      }
      await setBedtimeReminder({ enabled, wakeTime });
    },
    [requestPermissions, setBedtimeReminder, wakeTime],
  );

  const changeWakeTime = useCallback(
    async (value: string) => {
      void Haptics.selectionAsync().catch(() => undefined);
      await setBedtimeReminder({ enabled: bedtime?.enabled ?? false, wakeTime: value });
    },
    [bedtime?.enabled, setBedtimeReminder],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MoonStar size={17} color={Colors.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Bedtime reminder</Text>
          <Text style={styles.subtitle}>A daily nudge to start winding down</Text>
        </View>
        <Switch
          value={bedtime?.enabled ?? false}
          onValueChange={(value) => void toggleReminder(value)}
          trackColor={{ false: Colors.bg4, true: Colors.primary }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={Colors.bg4}
          accessibilityLabel="Enable bedtime reminder"
        />
      </View>

      {bedtime?.enabled ? (
        <>
          <Text style={styles.wakeLabel}>I usually wake at</Text>
          <TimeWheelPicker value={wakeTime} onChange={(value) => void changeWakeTime(value)} />
          <View style={styles.suggestionRow}>
            <View style={styles.suggestionBlock}>
              <Text style={styles.suggestionTime}>{suggestion.bedTime}</Text>
              <Text style={styles.suggestionLabel}>Lights out</Text>
            </View>
            <View style={styles.suggestionDivider} />
            <View style={styles.suggestionBlock}>
              <Text style={[styles.suggestionTime, { color: Colors.primary }]}>{suggestion.windDownTime}</Text>
              <Text style={styles.suggestionLabel}>Wind-down</Text>
            </View>
          </View>
          <Text style={styles.suggestionNote}>
            {suggestion.usedTargetFallback
              ? `Based on your age target of ${suggestion.durationUsed}h — log a few nights to refine it.`
              : `Based on your ${suggestion.durationUsed}h nightly average and a ${wakeTime} wake-up. Updates as your routine changes.`}
          </Text>
          {permissionDenied ? (
            <Text style={styles.permissionHint}>
              Notifications are turned off — enable them in Settings to get reminded.
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  wakeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    marginTop: 16,
  },
  suggestionBlock: {
    alignItems: "center",
  },
  suggestionTime: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: 0.3,
    fontVariant: ["tabular-nums"],
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginTop: 3,
  },
  suggestionDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderLight,
  },
  suggestionNote: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 14,
  },
  permissionHint: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.warning,
    textAlign: "center",
    marginTop: 10,
  },
});
