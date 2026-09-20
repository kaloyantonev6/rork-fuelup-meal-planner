import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import {
  BarChart3,
  BellOff,
  CheckCircle2,
  ChevronLeft,
  Droplets,
  Flame,
  Rocket,
  Star,
  Trash2,
  Utensils,
} from "lucide-react-native";

import Colors from "@/constants/colors";
import type { AppNotification, NotificationTab } from "@/lib/notificationFeed";
import { useNotificationFeed } from "@/providers/NotificationFeedProvider";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH - 32; // 16px margins each side
const OPEN_OFFSET = -80; // revealed delete-action width
const DISMISS_RATIO = 0.6;

type GroupKey = "Today" | "Yesterday" | "This Week" | "Earlier";

const TABS: { key: NotificationTab; label: string; emptyLabel: string }[] = [
  { key: "reminders", label: "Reminders", emptyLabel: "reminders" },
  { key: "system", label: "System", emptyLabel: "notifications" },
];

const NOTIFICATION_ICONS: Record<string, { Icon: LucideIcon; color: string }> = {
  meal_reminder: { Icon: Utensils, color: Colors.primary },
  hydration_reminder: { Icon: Droplets, color: "#60A5FA" },
  meal_plan_ready: { Icon: CheckCircle2, color: Colors.primary },
  streak_alert: { Icon: Flame, color: Colors.warning },
  premium_upgrade: { Icon: Star, color: Colors.warning },
  app_update: { Icon: Rocket, color: "#60A5FA" },
  weekly_summary: { Icon: BarChart3, color: Colors.primary },
};

/** "10:30 AM" today, "Yesterday", weekday within the week, "Sep 15" older. */
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  if (d >= startOfToday) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (d >= startOfYesterday) return "Yesterday";
  const weekAgo = new Date(startOfToday);
  weekAgo.setDate(weekAgo.getDate() - 6);
  if (d >= weekAgo) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupOf(iso: string, now: Date): GroupKey {
  const d = new Date(iso);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  if (d >= startOfToday) return "Today";
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (d >= startOfYesterday) return "Yesterday";
  const weekAgo = new Date(startOfToday);
  weekAgo.setDate(weekAgo.getDate() - 6);
  if (d >= weekAgo) return "This Week";
  return "Earlier";
}

const GROUP_ORDER: GroupKey[] = ["Today", "Yesterday", "This Week", "Earlier"];

// ── Notification card ────────────────────────────────────────────────────────

interface NotificationCardProps {
  notification: AppNotification;
  entryIndex: number;
  onDismiss: (id: string) => void;
  onPress: (notification: AppNotification) => void;
}

/**
 * Swipeable notification card: staggered entry animation, swipe left to
 * reveal the delete action, full swipe (>60%) dismisses with fade + slide.
 */
function NotificationCard({ notification, entryIndex, onDismiss, onPress }: NotificationCardProps) {
  const { Icon, color } = NOTIFICATION_ICONS[notification.type] ?? NOTIFICATION_ICONS.meal_reminder;

  const entryAnim = useRef(new Animated.Value(0)).current;
  const entered = useRef(false);
  const swipeX = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const openRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (entered.current) return;
    entered.current = true;
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 250,
      delay: entryIndex * 50,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [entryAnim, entryIndex]);

  const runDismiss = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(swipeX, {
        toValue: -(CARD_WIDTH + 60),
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onDismiss(notification.id);
    });
  }, [fade, notification.id, onDismiss, swipeX]);

  const close = useCallback(() => {
    openRef.current = 0;
    setIsOpen(false);
    Animated.spring(swipeX, { toValue: 0, friction: 7, useNativeDriver: true }).start();
  }, [swipeX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 12,
      onPanResponderMove: (_e, g) => {
        const next = Math.max(-CARD_WIDTH, Math.min(0, openRef.current + g.dx));
        swipeX.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        const total = openRef.current + g.dx;
        if (total < -DISMISS_RATIO * CARD_WIDTH) {
          runDismiss();
        } else if (total < -40) {
          openRef.current = OPEN_OFFSET;
          setIsOpen(true);
          Animated.spring(swipeX, { toValue: OPEN_OFFSET, friction: 7, useNativeDriver: true }).start();
        } else {
          close();
        }
      },
      onPanResponderTerminate: close,
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          opacity: entryAnim,
          transform: [
            { translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
          ],
        },
      ]}
    >
      {/* Delete background — revealed as the card slides left */}
      <Pressable onPress={runDismiss} style={styles.deleteBg}>
        <Trash2 size={22} color="#FFFFFF" />
      </Pressable>

      <Animated.View style={{ opacity: fade, transform: [{ translateX: swipeX }] }}>
        <Pressable
          onPress={() => (isOpen ? close() : onPress(notification))}
          style={styles.card}
          {...panResponder.panHandlers}
        >
          <View style={styles.iconBox}>
            <Icon size={24} color={color} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.cardMessage} numberOfLines={2}>
              {notification.message}
            </Text>
          </View>
          <Text style={[styles.cardTime, !notification.read && styles.cardTimeUnread]}>
            {formatTimestamp(notification.timestamp)}
          </Text>
          {!notification.read ? <View style={styles.unreadDot} /> : null}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotificationFeed();

  const [activeTab, setActiveTab] = useState<NotificationTab>("reminders");
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;

  const halfWidth = (containerWidth - 6) / 2; // 3px padding each side

  useEffect(() => {
    if (halfWidth <= 0) return;
    Animated.timing(indicatorX, {
      toValue: activeTab === "system" ? halfWidth : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [activeTab, halfWidth, indicatorX]);

  const handleTabPress = useCallback(
    (tab: NotificationTab) => {
      if (tab === activeTab) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveTab(tab);
    },
    [activeTab],
  );

  const handlePress = useCallback(
    (n: AppNotification) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!n.read) void markRead(n.id);
    },
    [markRead],
  );

  const groups = useMemo(() => {
    const now = new Date();
    const filtered = notifications.filter((n) => n.tab === activeTab);
    const byGroup = new Map<GroupKey, AppNotification[]>();
    for (const n of filtered) {
      const key = groupOf(n.timestamp, now);
      const list = byGroup.get(key) ?? [];
      list.push(n);
      byGroup.set(key, list);
    }
    return GROUP_ORDER.filter((k) => (byGroup.get(k)?.length ?? 0) > 0).map((key) => ({
      key,
      items: byGroup.get(key) ?? [],
    }));
  }, [notifications, activeTab]);

  const activeTabMeta = TABS.find((t) => t.key === activeTab) ?? TABS[0];
  const isEmpty = groups.length === 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        >
          <ChevronLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              void markAllRead();
            }}
            style={({ pressed }) => [styles.markAllBtn, pressed && { opacity: 0.7 }]}
            hitSlop={8}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Tab switcher */}
      <View
        style={styles.tabContainer}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {halfWidth > 0 ? (
          <Animated.View
            style={[
              styles.tabIndicator,
              { width: halfWidth, transform: [{ translateX: indicatorX }] },
            ]}
          />
        ) : null}
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(tab.key)}
              style={styles.tabButton}
            >
              <Text style={active ? styles.tabTextActive : styles.tabTextInactive}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isEmpty && styles.scrollContentEmpty,
          { paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyWrap}>
            <BellOff size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No {activeTabMeta.emptyLabel} yet</Text>
            <Text style={styles.emptySubtitle}>
              We&apos;ll notify you when something important happens
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.key}>
              <Text style={styles.groupHeader}>{group.key}</Text>
              {group.items.map((n, i) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  entryIndex={i}
                  onDismiss={(id) => void dismiss(id)}
                  onPress={handlePress}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

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
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    pointerEvents: "none",
  },
  markAllBtn: {
    minHeight: 44,
    justifyContent: "center",
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  headerSpacer: {
    width: 40,
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.bg3,
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginTop: 8,
    height: 40,
  },
  tabIndicator: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textOnAccent,
  },
  tabTextInactive: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "rgba(241,245,249,0.5)",
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
  },
  scrollContentEmpty: {
    flexGrow: 1,
  },

  groupHeader: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.text,
    margin: 16,
    marginTop: 20,
    marginBottom: 10,
  },

  cardWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  deleteBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 29,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    padding: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.bg0,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  cardMessage: {
    fontSize: 12,
    fontWeight: "400" as const,
    color: "rgba(241,245,249,0.38)",
    marginTop: 3,
    lineHeight: 16,
  },
  cardTime: {
    fontSize: 11,
    fontWeight: "400" as const,
    color: "rgba(241,245,249,0.38)",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  cardTimeUnread: {
    marginRight: 14,
  },
  unreadDot: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.textTertiary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "rgba(80,90,106,0.6)",
    marginTop: 4,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 18,
  },
});
