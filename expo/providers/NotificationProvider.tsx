import { useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { useMealPlan } from "@/providers/MealPlanProvider";
import { getDayTypeFromSchedule } from "@/utils/mealGenerator";
import {
  TIMELINE_TEMPLATES,
  generateTimeline,
  entryTimeToDate,
} from "@/utils/timeline";

const REMINDER_LEAD_MINUTES = 15; // notify 15 min before each meal
const CHANNEL_ID = "meal-reminders";
const CHANNEL_NAME = "Meal Reminders";
const NOTIF_ID_PREFIX = "fuelup_meal_";
const REMINDERS_DISABLED_KEY = "fuelup_reminders_disabled_v1";

// Configure how notifications are presented when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  try {
    const existing = await Notifications.getNotificationChannelsAsync();
    const has = existing?.some((c) => c.id === CHANNEL_ID);
    if (!has) {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: CHANNEL_NAME,
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2dd4a8",
      });
    }
  } catch (e) {
    console.log("[Notifications] channel setup error:", e);
  }
}

async function ensurePermissions(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });
    return req.granted;
  } catch (e) {
    console.log("[Notifications] permission error:", e);
    return false;
  }
}

function formatLead(entryLabel: string): string {
  return `${entryLabel} starts in ${REMINDER_LEAD_MINUTES} minutes`;
}

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const { profile, updateProfile } = useMealPlan();
  const lastScheduledKey = useRef<string>("");

  const enabled =
    profile.mealRemindersEnabled !== false && // default true
    profile.mealRemindersEnabled !== undefined;

  const scheduleForToday = useCallback(async () => {
    // Cancel anything previously scheduled by us
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.log("[Notifications] cancel error:", e);
    }
    lastScheduledKey.current = "";

    if (!enabled) {
      await AsyncStorage.setItem(REMINDERS_DISABLED_KEY, "true");
      return;
    }
    await AsyncStorage.removeItem(REMINDERS_DISABLED_KEY);

    const granted = await ensurePermissions();
    if (!granted) {
      console.log("[Notifications] permission not granted — skipping scheduling");
      return;
    }
    await ensureAndroidChannel();

    const now = new Date();
    const dayType = getDayTypeFromSchedule(now, profile);
    const template = TIMELINE_TEMPLATES[dayType];
    const sessionTime =
      dayType === "match"
        ? profile.defaultKickoffTime ?? "15:00"
        : dayType === "training"
        ? profile.defaultTrainingTime ?? "18:00"
        : "12:00";

    const timeline = generateTimeline(sessionTime, 0, template);

    const todayKey = `${dayType}_${sessionTime}_${now.toISOString().split("T")[0]}`;
    if (lastScheduledKey.current === todayKey) return;
    lastScheduledKey.current = todayKey;

    let scheduled = 0;
    timeline.forEach((entry, idx) => {
      const mealDate = entryTimeToDate(entry, sessionTime, template, idx);
      if (!mealDate) return;
      // Skip non-meal slots (hydration, training session, half-time)
      if (entry.caloriePct <= 0) return;

      const triggerDate = new Date(mealDate.getTime() - REMINDER_LEAD_MINUTES * 60 * 1000);
      // If the reminder time has already passed today, skip it.
      if (triggerDate.getTime() <= Date.now()) return;

      void Notifications.scheduleNotificationAsync({
        content: {
          title: "⚽ FuelUp — Meal Reminder",
          body: formatLead(entry.label),
          data: { mealSlot: entry.mealSlot, label: entry.label },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: Platform.OS === "android" ? CHANNEL_ID : undefined,
        },
      })
        .then((id) => {
          void AsyncStorage.setItem(`${NOTIF_ID_PREFIX}${idx}_${dayType}`, id ?? "");
        })
        .catch((e) => console.log("[Notifications] schedule error:", e));
      scheduled++;
    });

    console.log(`[Notifications] scheduled ${scheduled} meal reminders for ${dayType} day`);
  }, [enabled, profile]);

  // Re-schedule whenever the profile changes (day type, times, toggle)
  useEffect(() => {
    void scheduleForToday();
  }, [scheduleForToday]);

  // Re-schedule at midnight to pick up the new day's schedule
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 5, 0, 0); // 00:05 next day
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const timeout = setTimeout(() => {
      void scheduleForToday();
    }, msUntilMidnight);
    return () => clearTimeout(timeout);
  }, [scheduleForToday]);

  const setMealRemindersEnabled = useCallback(
    (value: boolean) => {
      updateProfile({ mealRemindersEnabled: value });
      // The scheduling effect will fire from the profile change.
    },
    [updateProfile],
  );

  return {
    mealRemindersEnabled: enabled,
    setMealRemindersEnabled,
    reschedule: scheduleForToday,
  };
});
