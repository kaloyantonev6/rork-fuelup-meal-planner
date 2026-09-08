import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { ChevronDown, ChevronUp, Clock, Bell, Pencil } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useMealTracking } from "@/providers/MealTrackingProvider";
import { useNotifications } from "@/providers/NotificationProvider";
import { useToday } from "@/providers/TodayProvider";
import {
  MEAL_CATEGORY_META,
  REMINDER_DELAY_OPTIONS,
  isValidTime,
  parseTimeToMinutes,
} from "@/constants/mealTimes";
import type { DayType as FootballDayType } from "@/types";
import type { MealCategory } from "@/constants/mealTimes";

const DAY_TYPES: FootballDayType[] = ["training", "match", "rest", "recovery"];

const DAY_META: Record<FootballDayType, { label: string; color: string; light: string; icon: string }> = {
  training: { label: "Training Day", color: Colors.training, light: Colors.trainingLight, icon: "🏃" },
  match: { label: "Match Day", color: Colors.match, light: Colors.matchLight, icon: "⚽" },
  rest: { label: "Rest Day", color: Colors.rest, light: Colors.restLight, icon: "😴" },
  recovery: { label: "Recovery Day", color: Colors.recovery, light: Colors.recoveryLight, icon: "🧊" },
};

const CATEGORIES: MealCategory[] = ["breakfast", "lunch", "snack", "dinner"];

interface EditTarget {
  dayType: FootballDayType;
  category: MealCategory;
  start: string;
  end: string;
}

/**
 * Profile settings section "Meal Times": per-day-type eating windows with an
 * edit bottom sheet, the reminders master toggle and the reminder delay chips.
 * Saving a window persists it and re-schedules today's reminders automatically.
 */
export default function MealTimesSettings() {
  const { customTimes, updateMealTimes, reminderSettings, updateReminderDelay } = useMealTracking();
  const { mealRemindersEnabled, setMealRemindersEnabled } = useNotifications();
  const { todayData } = useToday();

  const [expanded, setExpanded] = useState<FootballDayType | null>(todayData?.dayType ?? "training");
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [error, setError] = useState<string>("");

  const openEditor = (dayType: FootballDayType, category: MealCategory) => {
    const w = customTimes[dayType][category];
    if (!w) return;
    setError("");
    setEdit({ dayType, category, start: w.start, end: w.end });
  };

  const handleSave = () => {
    if (!edit) return;
    if (!isValidTime(edit.start) || !isValidTime(edit.end)) {
      setError("Use the HH:MM format, e.g. 07:30");
      return;
    }
    if (parseTimeToMinutes(edit.end) <= parseTimeToMinutes(edit.start)) {
      setError("The end time must be after the start time");
      return;
    }
    updateMealTimes(edit.dayType, edit.category, edit.start, edit.end);
    setEdit(null);
  };

  const visibleCategories = useMemo(
    () => (dayType: FootballDayType) =>
      CATEGORIES.filter((c) => (dayType === "rest" ? c !== "snack" : true)),
    [],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Clock size={18} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Meal Times</Text>
      </View>
      <Text style={styles.sectionSubtitle}>
        Expected eating windows used for check-offs and reminders.
      </Text>

      {/* Reminders master toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <Bell size={16} color={mealRemindersEnabled ? Colors.primary : Colors.textTertiary} />
          <Text style={styles.toggleLabel}>Meal reminders</Text>
        </View>
        <Switch
          value={mealRemindersEnabled}
          onValueChange={setMealRemindersEnabled}
          trackColor={{ false: Colors.bg4, true: Colors.primary }}
          thumbColor="#F1F5F9"
          ios_backgroundColor={Colors.bg4}
        />
      </View>

      {/* Reminder delay chips */}
      <Text style={styles.chipsLabel}>Remind me after window ends</Text>
      <View style={styles.chipsRow}>
        {REMINDER_DELAY_OPTIONS.map((m) => {
          const active = reminderSettings.delayMinutes === m;
          return (
            <Pressable
              key={m}
              onPress={() => updateReminderDelay(m)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{m}m</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Day type accordions */}
      {DAY_TYPES.map((dayType) => {
        const meta = DAY_META[dayType];
        const isOpen = expanded === dayType;
        return (
          <View key={dayType} style={styles.dayCard}>
            <Pressable
              onPress={() => setExpanded(isOpen ? null : dayType)}
              style={({ pressed }) => [styles.dayHeader, pressed && { opacity: 0.8 }]}
            >
              <View style={[styles.dayDot, { backgroundColor: meta.light }]}>
                <Text style={{ fontSize: 12 }}>{meta.icon}</Text>
              </View>
              <Text style={styles.dayLabel}>{meta.label}</Text>
              {isOpen ? (
                <ChevronUp size={16} color={Colors.textTertiary} />
              ) : (
                <ChevronDown size={16} color={Colors.textTertiary} />
              )}
            </Pressable>
            {isOpen ? (
              <View style={styles.rowsWrap}>
                {visibleCategories(dayType).map((category) => {
                  const w = customTimes[dayType][category];
                  if (!w) return null;
                  return (
                    <Pressable
                      key={category}
                      onPress={() => openEditor(dayType, category)}
                      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
                    >
                      <Text style={styles.rowIcon}>{MEAL_CATEGORY_META[category].icon}</Text>
                      <Text style={styles.rowLabel}>{MEAL_CATEGORY_META[category].label}</Text>
                      <Text style={styles.rowTime}>
                        {w.start}–{w.end}
                      </Text>
                      <Pencil size={13} color={Colors.textTertiary} />
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}

      {/* Edit bottom sheet */}
      <Modal visible={edit !== null} transparent animationType="slide" onRequestClose={() => setEdit(null)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEdit(null)} />
          {edit ? (
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>
                {MEAL_CATEGORY_META[edit.category].label} · {DAY_META[edit.dayType].label}
              </Text>
              <View style={styles.inputsRow}>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>Start</Text>
                  <TextInput
                    style={styles.input}
                    value={edit.start}
                    maxLength={5}
                    placeholder="07:00"
                    placeholderTextColor={Colors.textTertiary}
                    onChangeText={(t) => setEdit({ ...edit, start: t })}
                    keyboardType="default"
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>End</Text>
                  <TextInput
                    style={styles.input}
                    value={edit.end}
                    maxLength={5}
                    placeholder="09:00"
                    placeholderTextColor={Colors.textTertiary}
                    onChangeText={(t) => setEdit({ ...edit, end: t })}
                    keyboardType="default"
                  />
                </View>
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Pressable style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
    marginBottom: 14,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.bg3,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  chipsLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primary,
  },
  dayCard: {
    backgroundColor: Colors.bg3,
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    minHeight: 48,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  rowsWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  rowIcon: {
    fontSize: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  rowTime: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.bg2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  inputsRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputWrap: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bg4,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    fontSize: 15,
    color: Colors.text,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 8,
  },
  saveBtn: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textOnAccent,
  },
});
