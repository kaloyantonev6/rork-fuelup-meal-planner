import { useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { useMealPlan } from "@/providers/MealPlanProvider";
import { useMealTracking } from "@/providers/MealTrackingProvider";
import {
  getMealWindows,
  getFollowUpBody,
  getFollowUpTitle,
  getMealReminderBody,
  getMealReminderTitle,
  timeToDate,
} from "@/constants/mealTimes";
import { NOTIFICATION_PERMISSION_KEY, NOTIFICATION_PERMISSION_DEFERRED_AT_KEY } from "@/constants/mealTimes";

const FOLLOW_UP_OFFSET_MIN = 30; // second nudge 30 min after the first reminder
const CHANNEL_ID = "meal-reminders";
const CHANNEL_NAME = "Meal Reminders";

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

/** True when permission was previously granted. Never triggers the system prompt. */
async function checkPermissionsGranted(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    return current.granted;
  } catch {
    return false;
  }
}

/**
 * Schedules "meal overdue" reminders from each meal's eating window: first nudge
 * at window end + user-chosen delay (default 30 min), a follow-up 30 min later,
 * and nothing past 23:00. Completed/skipped meals are skipped automatically since
 * tracking changes trigger a full re-schedule. Tapping a reminder highlights the
 * corresponding meal card on the home tab.
 */
export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const { profile, updateProfile } = useMealPlan();
  const { tracking, customTimes, reminderSettings, setHighlightMealId } = useMealTracking();
  const lastScheduleKey = useRef<string>("");

  // Master switch — the profile toggle (default true)
  const enabled = profile.mealRemindersEnabled !== false;

  const scheduleForToday = useCallback(async () => {
    // Cancel anything previously scheduled by us, then rebuild from current tracking
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.log("[Notifications] cancel error:", e);
    }

    if (!enabled || !reminderSettings.enabled || !tracking || tracking.meals.length === 0) return;

    // Only schedule when permission was already granted — the custom modal
    // on Home is responsible for the first explicit request.
    const granted = await checkPermissionsGranted();
    if (!granted) return;
    await ensureAndroidChannel();

    const windows = getMealWindows(customTimes, tracking.dayType);
    const now = Date.now();

    for (const meal of tracking.meals) {
      if (meal.completedAt || meal.skipped) continue;
      const w = windows[meal.category];
      if (!w) continue;

      const reminderAt = timeToDate(w.end, reminderSettings.delayMinutes);
      if (!reminderAt || reminderAt.getTime() <= now) continue;

      void Notifications.scheduleNotificationAsync({
        content: {
          title: getMealReminderTitle(meal.category, tracking.dayType),
          body: getMealReminderBody(meal.category, meal.mealTitle),
          data: { mealId: meal.mealId, category: meal.category, kind: "meal_reminder" },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderAt,
          channelId: Platform.OS === "android" ? CHANNEL_ID : undefined,
        },
      }).catch((e) => console.log("[Notifications] schedule error:", e));

      const followUpAt = new Date(reminderAt.getTime() + FOLLOW_UP_OFFSET_MIN * 60 * 1000);
      if (followUpAt.getHours() < 23) {
        void Notifications.scheduleNotificationAsync({
          content: {
            title: getFollowUpTitle(meal.category),
            body: getFollowUpBody(meal.category, tracking.dayType),
            data: { mealId: meal.mealId, category: meal.category, kind: "meal_follow_up" },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: followUpAt,
            channelId: Platform.OS === "android" ? CHANNEL_ID : undefined,
          },
        }).catch((e) => console.log("[Notifications] follow-up schedule error:", e));
      }
    }

    const key = `${tracking.date}_${tracking.meals.map((m) => `${m.mealId}:${m.completedAt ?? "-"}${m.skipped ? "s" : ""}`).join(",")}`;
    lastScheduleKey.current = key;
  }, [enabled, reminderSettings.enabled, reminderSettings.delayMinutes, tracking, customTimes]);

  // Re-schedule whenever the tracking state, settings or profile toggle change.
  // (Check-off, skip and undo all mutate tracking, so reminders stay in sync.)
  useEffect(() => {
    void scheduleForToday();
  }, [scheduleForToday]);

  // Re-schedule at midnight to pick up the new day's meals and windows
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 5, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const timeout = setTimeout(() => {
      void scheduleForToday();
    }, msUntilMidnight);
    return () => clearTimeout(timeout);
  }, [scheduleForToday]);

  // Tap on a reminder → highlight the meal card on the home tab
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { mealId?: string };
      if (data?.mealId) setHighlightMealId(data.mealId);
    });
    return () => sub.remove();
  }, [setHighlightMealId]);

  const setMealRemindersEnabled = useCallback(
    (value: boolean) => {
      updateProfile({ mealRemindersEnabled: value });
      // The scheduling effect fires from the profile change.
    },
    [updateProfile],
  );

  /** Explicit permission request from the first-run modal. Persists the outcome. */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const req = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      });
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, req.granted ? "granted" : "denied");
      return req.granted;
    } catch (e) {
      console.log("[Notifications] permission request error:", e);
      return false;
    }
  }, []);

  /** "Maybe Later" — defer the permission ask by 3 days. */
  const deferPermissions = useCallback(async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, "deferred");
      await AsyncStorage.setItem(
        NOTIFICATION_PERMISSION_DEFERRED_AT_KEY,
        new Date().toISOString(),
      );
    } catch (e) {
      console.log("[Notifications] defer error:", e);
    }
  }, []);

  return {
    mealRemindersEnabled: enabled,
    setMealRemindersEnabled,
    reschedule: scheduleForToday,
    requestPermissions,
    deferPermissions,
  };
});
