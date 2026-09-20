import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import type { DailyTracking } from "@/constants/mealTimes";
import { MEAL_CATEGORY_META } from "@/constants/mealTimes";
import { loadTodayHydration } from "@/lib/hydrationStore";
import {
  addNotification as persistAdd,
  dismissNotification as persistDismiss,
  getNotifications,
  markAllAsRead as persistMarkAll,
  markAsRead as persistMarkOne,
  type AppNotification,
  type NewNotification,
} from "@/lib/notificationFeed";
import { useMealTracking } from "@/providers/MealTrackingProvider";
import { useToday } from "@/providers/TodayProvider";

const MEAL_REMINDER_GRACE_MIN = 45; // nudge 45 min after the window start
const HYDRATION_CHECK_HOUR = 15; // 3 PM
const STREAK_MIN_DAYS = 3;

/** Local-calendar date key (YYYY-MM-DD). */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * In-app notification feed: persisted via lib/notificationFeed, exposed as
 * context state plus actions. Also auto-generates event notifications —
 * overdue meals, hydration behind target after 3 PM, and logging streaks.
 * Distinct from NotificationProvider, which schedules OS push reminders.
 */
export const [NotificationFeedProvider, useNotificationFeed] = createContextHook(() => {
  const { tracking, history } = useMealTracking();
  const { todayData } = useToday();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    void getNotifications().then(setNotifications);
  }, []);

  const add = useCallback(
    async (n: NewNotification, opts?: { dedupePerDay?: boolean }) => {
      const created = await persistAdd(n, opts);
      if (created) {
        setNotifications((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
      }
      return created;
    },
    [],
  );

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await persistMarkOne(id);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await persistMarkAll();
  }, []);

  const dismiss = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await persistDismiss(id);
  }, []);

  // ── Auto-generated event notifications ──────────────────────────────
  const lastCheckKey = useRef("");
  useEffect(() => {
    if (!tracking || tracking.meals.length === 0) return;
    const key = `${tracking.date}|${tracking.meals
      .map((m) => `${m.mealId}:${m.completedAt ?? "-"}${m.skipped ? "s" : ""}`)
      .join(",")}|${history.length}`;
    if (key === lastCheckKey.current) return;
    lastCheckKey.current = key;

    const run = async () => {
      const now = new Date();

      // Meal reminder — window passed without a check-off
      for (const meal of tracking.meals) {
        if (meal.completedAt || meal.skipped) continue;
        const [h, m] = meal.scheduledTime.split(":").map(Number);
        if (!Number.isFinite(h)) continue;
        const due = new Date(now);
        due.setHours(h, (m || 0) + MEAL_REMINDER_GRACE_MIN, 0, 0);
        if (now < due) continue;
        const label = MEAL_CATEGORY_META[meal.category]?.label ?? meal.category;
        await add(
          {
            type: "meal_reminder",
            tab: "reminders",
            title: `Time to eat — ${label}`,
            message: `Your ${meal.category} is waiting. Don't skip it!`,
          },
          { dedupePerDay: true },
        );
      }

      // Hydration — below 50% of target after 3 PM
      if (now.getHours() >= HYDRATION_CHECK_HOUR && todayData && todayData.hydrationTarget > 0) {
        try {
          const intakeMl = await loadTodayHydration();
          const targetMl = todayData.hydrationTarget * 1000;
          if (intakeMl < targetMl * 0.5) {
            await add(
              {
                type: "hydration_reminder",
                tab: "reminders",
                title: "Stay hydrated",
                message: "You're behind on your water target. Drink up!",
              },
              { dedupePerDay: true },
            );
          }
        } catch (e) {
          console.log("[NotificationFeed] hydration check error:", e);
        }
      }

      // Streak — 3+ consecutive days with at least one logged meal
      const loggedDates = new Set<string>();
      for (const day of history) {
        if (day.meals.some((m) => m.completedAt)) loggedDates.add(day.date);
      }
      if (tracking.meals.some((m) => m.completedAt)) loggedDates.add(tracking.date);

      let streak = 0;
      const cursor = new Date(now);
      if (!loggedDates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
      while (loggedDates.has(localDateKey(cursor))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      if (streak >= STREAK_MIN_DAYS) {
        await add(
          {
            type: "streak_alert",
            tab: "reminders",
            title: "Keep your streak alive!",
            message: `You've logged meals for ${streak} days straight.`,
          },
          { dedupePerDay: true },
        );
      }
    };

    void run();
  }, [tracking, history, todayData, add]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return { notifications, unreadCount, add, markRead, markAllRead, dismiss };
});
