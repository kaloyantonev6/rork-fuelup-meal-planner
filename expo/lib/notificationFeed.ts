/**
 * In-app notification feed storage (AsyncStorage, `@fuelify_notifications`).
 *
 * Distinct from the push-notification scheduling in NotificationProvider —
 * this is the persisted feed shown on the Notifications screen and badged on
 * the home bell.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_KEY = "@fuelify_notifications";
const MAX_NOTIFICATIONS = 100;

export type NotificationTab = "reminders" | "system";

export type NotificationType =
  | "meal_reminder"
  | "hydration_reminder"
  | "meal_plan_ready"
  | "streak_alert"
  | "premium_upgrade"
  | "app_update"
  | "weekly_summary";

export interface AppNotification {
  id: string;
  type: NotificationType;
  tab: NotificationTab;
  title: string;
  message: string;
  timestamp: string; // ISO date string
  read: boolean;
}

export interface NewNotification {
  type: NotificationType;
  tab: NotificationTab;
  title: string;
  message: string;
  timestamp?: string;
  read?: boolean;
}

/** Local-calendar date key (YYYY-MM-DD) used for per-day dedupe and grouping. */
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function readAll(): Promise<AppNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.log("[NotificationFeed] read error:", e);
    return [];
  }
}

async function writeAll(list: AppNotification[]): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.log("[NotificationFeed] write error:", e);
  }
}

/** Notifications for a tab (or all when omitted), newest first. */
export async function getNotifications(tab?: string): Promise<AppNotification[]> {
  const all = await readAll();
  return all
    .filter((n) => (tab ? n.tab === tab : true))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/** Marks a single notification as read. Returns the updated list. */
export async function markAsRead(id: string): Promise<AppNotification[]> {
  const all = await readAll();
  const next = all.map((n) => (n.id === id ? { ...n, read: true } : n));
  await writeAll(next);
  return next;
}

/** Marks every notification as read. Returns the updated list. */
export async function markAllAsRead(): Promise<AppNotification[]> {
  const all = await readAll();
  const next = all.map((n) => ({ ...n, read: true }));
  await writeAll(next);
  return next;
}

/** Removes a notification from the feed. Returns the updated list. */
export async function dismissNotification(id: string): Promise<AppNotification[]> {
  const all = await readAll();
  const next = all.filter((n) => n.id !== id);
  await writeAll(next);
  return next;
}

/**
 * Adds a notification (newest first, capped). With `dedupePerDay`, an
 * identical-type notification on the same local date is skipped — returns
 * null when deduped so callers don't update state.
 */
export async function addNotification(
  notification: NewNotification,
  opts?: { dedupePerDay?: boolean },
): Promise<AppNotification | null> {
  const all = await readAll();

  if (opts?.dedupePerDay) {
    const todayKey = toLocalDateKey(new Date());
    const exists = all.some(
      (n) =>
        n.type === notification.type &&
        n.message === notification.message &&
        toLocalDateKey(new Date(n.timestamp)) === todayKey,
    );
    if (exists) return null;
  }

  const created: AppNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: notification.type,
    tab: notification.tab,
    title: notification.title,
    message: notification.message,
    timestamp: notification.timestamp ?? new Date().toISOString(),
    read: notification.read ?? false,
  };

  const next = [created, ...all].slice(0, MAX_NOTIFICATIONS);
  await writeAll(next);
  return created;
}

/** Total unread count across both tabs (for the home bell badge). */
export async function getUnreadCount(): Promise<number> {
  const all = await readAll();
  return all.filter((n) => !n.read).length;
}
