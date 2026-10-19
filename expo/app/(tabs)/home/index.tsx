import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { kvGet, kvSet } from "@/lib/database";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Bell, Bot, Check, ChevronRight, Crown, ShoppingCart, Trophy, User } from "lucide-react-native";

import Colors from "@/constants/colors";
import { fonts } from "@/constants/design";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useToday } from "@/providers/TodayProvider";
import { useMealTracking } from "@/providers/MealTrackingProvider";
import { useNotifications } from "@/providers/NotificationProvider";
import { useNotificationFeed } from "@/providers/NotificationFeedProvider";
import {
  DAY_ABBREVIATIONS,
  DAY_TYPE_META,
  DEFAULT_WEEKLY_SCHEDULE,
  getMondayIndex,
} from "@/constants/dayTypes";
import type { DayType } from "@/types";
import {
  dismissEducationCard,
  getTodayEducationCard,
  type EducationCard as EducationCardData,
} from "@/data/educationCards";
import {
  getMonthlyNutrientCard,
  isTeenNutrientAudience,
  shouldShowHealthCheck,
} from "@/lib/youthSafety";
import HealthCheckCard from "@/components/HealthCheckCard";
import NotificationPermissionModal from "@/components/NotificationPermissionModal";
import {
  NOTIFICATION_PERMISSION_DEFERRED_AT_KEY,
  NOTIFICATION_PERMISSION_KEY,
} from "@/constants/mealTimes";
import { loadTodayHydration } from "@/lib/hydrationStore";
import { loadSleepLog, type SleepLog } from "@/lib/sleepEngine";
import { sleepPerformance } from "@/lib/sleepPerformance";
import TomorrowOverview from "@/components/TomorrowOverview";
import Toast from "@/components/ui/Toast";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { InsightCard, MetricDial, MonitorTile, SectionHeader, TopPill } from "@/components/ui/Dashboard";

const tap = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, hasOnboarded } = useMealPlan();
  const { todayData, refreshCount, bootedWithReset } = useToday();
  const { tracking, stats } = useMealTracking();
  const { requestPermissions, deferPermissions } = useNotifications();

  const age = profile.age || 20;
  const dayType: DayType = todayData?.dayType ?? "training";
  const meta = DAY_TYPE_META[dayType];
  const firstName = profile.name?.split(" ")[0] || "there";

  // ── Reminder permission flow (first run, or 3 days after "Maybe Later") ──
  const [showPermPrompt, setShowPermPrompt] = useState(false);
  useEffect(() => {
    if (!hasOnboarded) return;
    let cancelled = false;
    const check = async () => {
      try {
        const status = await kvGet<string>(NOTIFICATION_PERMISSION_KEY);
        if (cancelled) return;
        if (!status) {
          setShowPermPrompt(true);
        } else if (status === "deferred") {
          const at = await kvGet<string>(NOTIFICATION_PERMISSION_DEFERRED_AT_KEY);
          if (at && Date.now() - new Date(at).getTime() > 3 * 24 * 60 * 60 * 1000) {
            setShowPermPrompt(true);
          }
        }
      } catch {
        // storage read failed — skip the prompt this session
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [hasOnboarded]);

  // ── Youth safeguard (under-18): one-time popup — Fuelify fuels growth, never restricts ──
  const [showYouthNotice, setShowYouthNotice] = useState(false);
  useEffect(() => {
    if (!profile.age || profile.age >= 18) return;
    let cancelled = false;
    (async () => {
      try {
        const shown = await kvGet<boolean>("youthSafeguardNoticeShown");
        if (!cancelled && !shown) setShowYouthNotice(true);
      } catch {
        // storage read failed — skip the notice this session
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.age]);

  const dismissYouthNotice = useCallback(() => {
    setShowYouthNotice(false);
    void kvSet("youthSafeguardNoticeShown", true).catch(() => undefined);
  }, []);

  // ── Hydration + sleep mini-card data ──
  const [hydrationMl, setHydrationMl] = useState(0);
  const [sleepLogData, setSleepLogData] = useState<SleepLog>({});
  useFocusEffect(
    useCallback(() => {
      void loadTodayHydration().then(setHydrationMl);
      void (async () => {
        const log = await loadSleepLog();
        setSleepLogData(log);
      })();
    }, [refreshCount]),
  );

  const hydrationTargetMl = Math.round((todayData?.hydrationTarget ?? 3) * 1000);

  // ── Today's Fuel hero card data (from the meal-tracking store) ──
  const calorieTarget = todayData?.calorieTarget ?? 0;
  const fuelPct =
    calorieTarget > 0 ? Math.min(Math.round((stats.caloriesConsumed / calorieTarget) * 100), 100) : 0;

  // Three dials share the row — sized to the screen width
  const { width: screenWidth } = useWindowDimensions();
  const dialSize = Math.min(Math.floor((screenWidth - 32 - 36) / 3), 104);

  // Hero card entry animation — opacity 0→1, translateY 15→0
  const heroEntry = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(heroEntry, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [heroEntry]);

  // ── Day-change toast ──
  const [dayToast, setDayToast] = useState<{ message: string; color: string; icon: string } | null>(null);
  const prevDayTypeRef = useRef<DayType | null>(null);
  useEffect(() => {
    const prev = prevDayTypeRef.current;
    prevDayTypeRef.current = dayType;
    const message = `Good morning! Today is a ${meta.label} day. Target: ${calorieTarget} kcal`;
    if (prev === null) {
      if (bootedWithReset) setDayToast({ message, color: meta.color, icon: meta.icon });
      return;
    }
    if (prev !== dayType) setDayToast({ message, color: meta.color, icon: meta.icon });
  }, [dayType, meta, calorieTarget, bootedWithReset]);

  // ── Education tip: rotating source-attributed card (teen nutrient card takes the slot monthly) ──
  const [tip, setTip] = useState<EducationCardData | null>(null);
  const [tipExpanded, setTipExpanded] = useState(false);
  const nutrientCard = isTeenNutrientAudience(age) ? getMonthlyNutrientCard() : null;
  useEffect(() => {
    let cancelled = false;
    void getTodayEducationCard(dayType).then((card) => {
      if (!cancelled) setTip(card);
    });
    return () => {
      cancelled = true;
    };
  }, [dayType, refreshCount]);

  const handleDismissTip = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void dismissEducationCard();
    setTip(null);
    setTipExpanded(false);
  }, []);

  // ── RED-S health check: monthly popup modal (adults) / fortnightly (under-18) ──
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void shouldShowHealthCheck(age).then((due) => {
      if (!cancelled && due) setShowHealthCheck(true);
    });
    return () => {
      cancelled = true;
    };
  }, [age]);

  const weeklySchedule: DayType[] =
    profile.weeklySchedule && profile.weeklySchedule.length === 7
      ? profile.weeklySchedule
      : DEFAULT_WEEKLY_SCHEDULE;
  const todayIndex = getMondayIndex();

  // ── Day strip — real calendar dates for the current Mon–Sun week ──
  const weekDates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - todayIndex + i);
      return d;
    });
  }, [todayIndex]);
  const weekMonthLabel = useMemo(
    () => weekDates[0].toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [weekDates],
  );

  const { unreadCount: feedUnread } = useNotificationFeed();

  // ── Dial values (all computed from logged data — never estimated) ──
  const sleepPerf = useMemo(() => sleepPerformance(sleepLogData, age), [sleepLogData, age]);
  const hydrationPct =
    hydrationTargetMl > 0 ? Math.min(Math.round((hydrationMl / hydrationTargetMl) * 100), 100) : 0;
  const allMealsDone = stats.totalMeals > 0 && stats.completedCount >= stats.totalMeals;
  const mealsLeft = Math.max(stats.totalMeals - stats.completedCount, 0);

  let nextMatchIn: number | null = null;
  for (let k = 0; k < 7; k++) {
    if (weeklySchedule[(todayIndex + k) % 7] === "match") {
      nextMatchIn = k;
      break;
    }
  }

  const insightTitle = dayType === "match" ? "Match Day Fuel" : `${meta.label} Day Fuel`;
  const insightBody =
    calorieTarget <= 0
      ? "Generate your meal plan to set today's fuel target."
      : allMealsDone
        ? `Every meal logged — ${stats.caloriesConsumed.toLocaleString()} kcal against your ${calorieTarget.toLocaleString()} kcal target. Your body has what it needs today.`
        : stats.completedCount === 0
          ? `Your ${calorieTarget.toLocaleString()} kcal target is set for today's ${dayType === "match" ? "match" : meta.label.toLowerCase()} load. Log your first meal to start filling the Fuel dial.`
          : `${stats.caloriesConsumed.toLocaleString()} of ${calorieTarget.toLocaleString()} kcal fueled. ${mealsLeft} meal${mealsLeft === 1 ? "" : "s"} left to hit today's target.`;

  const tipTitle = nutrientCard ? `${nutrientCard.nutrient} Watch` : tip?.title ?? "";
  const tipBody = nutrientCard ? nutrientCard.why : tip?.body ?? "";

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP BAR — profile, today pill, alerts */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <Pressable
              onPress={() => {
                tap();
                router.push("/(tabs)/profile" as never);
              }}
              style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Profile"
            >
              {profile.profileImage ? (
                <Image source={{ uri: profile.profileImage }} style={styles.avatarImage} />
              ) : (
                <User size={18} color={Colors.text} />
              )}
            </Pressable>
            {!profile.isPremium && (
              <Pressable
                onPress={() => {
                  tap();
                  router.push("/premium");
                }}
                style={({ pressed }) => [styles.proBadge, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel="Upgrade to Pro"
              >
                <Crown size={12} color={Colors.premiumGold} />
                <Text style={styles.proBadgeText}>PRO</Text>
              </Pressable>
            )}
          </View>

          <TopPill style={styles.todayPill}>
            <View style={[styles.todayDot, { backgroundColor: meta.color }]} />
            <Text style={styles.todayText}>TODAY</Text>
          </TopPill>

          <View style={styles.topRight}>
            <Pressable
              onPress={() => {
                tap();
                router.push("/notifications");
              }}
              style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={feedUnread > 0 ? `Notifications, ${feedUnread} unread` : "Notifications"}
            >
              <Bell size={21} color={Colors.text} />
              {feedUnread > 0 ? <View style={styles.bellDot} /> : null}
            </Pressable>
          </View>
        </View>

        {/* WORDMARK + greeting */}
        <Text style={styles.wordmark}>FUELIFY</Text>
        <Text style={styles.greeting}>
          {todayData?.dayName ?? "Today"} · {meta.label} · {firstName}
        </Text>

        {/* THREE DIALS — Sleep · Fuel · Hydration */}
        <Animated.View
          style={[
            styles.dialRow,
            {
              opacity: heroEntry,
              transform: [
                {
                  translateY: heroEntry.interpolate({
                    inputRange: [0, 1],
                    outputRange: [15, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <MetricDial
            label="SLEEP"
            percent={sleepPerf.performance}
            color={Colors.metricSleep}
            size={dialSize}
            onPress={() => router.push("/sleep" as never)}
          />
          <MetricDial
            label="FUEL"
            percent={calorieTarget > 0 ? fuelPct : null}
            color={Colors.metricFuel}
            size={dialSize}
            onPress={() => router.push("/(tabs)/plan" as never)}
          />
          <MetricDial
            label="HYDRATION"
            percent={hydrationPct}
            color={Colors.metricHydration}
            size={dialSize}
            onPress={() => router.push("/hydration" as never)}
          />
        </Animated.View>

        {/* TODAY'S FUEL INSIGHT — headline + numbers, taps through to the plan */}
        <InsightCard
          gradient={false}
          title={insightTitle}
          body={insightBody}
          onPress={() => router.push("/(tabs)/plan" as never)}
          badge={
            <View style={[styles.checkBadge, allMealsDone && styles.checkBadgeDone]}>
              <Check size={14} color={allMealsDone ? Colors.textInverse : Colors.text} strokeWidth={3} />
              <Text style={[styles.checkBadgeText, allMealsDone && { color: Colors.textInverse }]}>
                {stats.completedCount}
              </Text>
            </View>
          }
          actionLabel="VIEW TODAY'S PLAN"
        >
          <View style={styles.statRow}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{stats.caloriesConsumed.toLocaleString()}</Text>
              <Text style={styles.statLabel}>KCAL IN</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{calorieTarget > 0 ? calorieTarget.toLocaleString() : "–"}</Text>
              <Text style={styles.statLabel}>TARGET</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>
                {stats.completedCount}
                <Text style={styles.statValueMuted}>/{stats.totalMeals}</Text>
              </Text>
              <Text style={styles.statLabel}>MEALS</Text>
            </View>
          </View>
        </InsightCard>

        {/* MONITOR TILES — Match Day + Shop List */}
        <View style={styles.tileRow}>
          <MonitorTile
            title="MATCH DAY"
            icon={<Trophy size={15} color={nextMatchIn === 0 ? Colors.match : Colors.primary} strokeWidth={2.4} />}
            status={
              nextMatchIn === 0
                ? "TODAY"
                : nextMatchIn === null
                  ? "NONE SET"
                  : nextMatchIn === 1
                    ? "TOMORROW"
                    : `IN ${nextMatchIn} DAYS`
            }
            statusColor={nextMatchIn === 0 ? Colors.match : Colors.primary}
            detail={nextMatchIn === 0 ? "Fuel up right" : "Match prep plan"}
            onPress={() => router.push("/(tabs)/match" as never)}
          />
          <MonitorTile
            title="SHOP LIST"
            icon={<ShoppingCart size={15} color={Colors.metricHydration} strokeWidth={2.4} />}
            status="THIS WEEK"
            statusColor={Colors.metricHydration}
            detail="Groceries, sorted"
            onPress={() => router.push("/(tabs)/shop" as never)}
          />
        </View>

        {/* MY DAY */}
        <SectionHeader title="My Day" />

        {/* AI Coach — outlook-style row */}
        <Pressable
          onPress={() => {
            tap();
            router.push("/coach" as never);
          }}
          style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
          accessibilityRole="button"
          accessibilityLabel="Ask your AI Coach"
        >
          <LinearGradient
            colors={["#2C3943", "#1C2328"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.outlookRow}
          >
            <View style={styles.outlookIcon}>
              <Bot size={17} color={Colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.outlookTitle}>AI Coach</Text>
              <Text style={styles.outlookSub}>Nutrition answers, anytime</Text>
            </View>
            <ChevronRight size={18} color={Colors.text} />
          </LinearGradient>
        </Pressable>

        {/* Education tip — gradient insight card, expands inline */}
        {tip || nutrientCard ? (
          <View style={{ marginTop: 10 }}>
            <InsightCard
              title={tipTitle}
              body={tipBody}
              bodyLines={tipExpanded ? undefined : 2}
              onPress={() => setTipExpanded((p) => !p)}
              actionLabel={tipExpanded ? "SHOW LESS" : "READ MORE"}
            >
              {tipExpanded ? (
                <View style={{ gap: 10 }}>
                  {nutrientCard ? (
                    <View style={styles.tipFoods}>
                      {nutrientCard.foods.slice(0, 3).map((f) => (
                        <View key={f} style={styles.tipFoodPill}>
                          <Text style={styles.tipFoodText}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <View style={styles.tipFooter}>
                    <Text style={styles.tipSource}>
                      Source: {nutrientCard ? nutrientCard.source : tip?.source ?? ""}
                    </Text>
                    {tip && !nutrientCard ? (
                      <Pressable onPress={handleDismissTip} hitSlop={8}>
                        <Text style={styles.tipDismiss}>GOT IT</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </InsightCard>
          </View>
        ) : null}

        {/* MY WEEK — real dates, colour-coded by day type */}
        <SectionHeader
          title="My Week"
          action={<Text style={styles.sectionMeta}>{weekMonthLabel.toUpperCase()}</Text>}
        />
        <Pressable
          onPress={() => {
            tap();
            router.push("/(tabs)/profile" as never);
          }}
          style={({ pressed }) => [styles.dayStripCard, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel="Edit weekly schedule"
        >
          <View style={styles.dayStripRow}>
            {weeklySchedule.map((type, i) => {
              const dayMeta = DAY_TYPE_META[type] ?? DAY_TYPE_META.rest;
              const isToday = i === todayIndex;
              const date = weekDates[i];
              return (
                <View key={`day-${i}`} style={styles.dayStripItem}>
                  <Text style={[styles.dayStripLabel, isToday && { color: Colors.text }]}>
                    {DAY_ABBREVIATIONS[i].toUpperCase()}
                  </Text>
                  <View
                    style={[
                      styles.dayStripBubble,
                      isToday ? { backgroundColor: Colors.text } : { borderColor: dayMeta.color },
                    ]}
                  >
                    <Text style={[styles.dayStripDate, isToday && styles.dayStripDateActive]}>
                      {date.getDate()}
                    </Text>
                  </View>
                  <View style={[styles.dayStripDot, { backgroundColor: dayMeta.color }]} />
                </View>
              );
            })}
          </View>
        </Pressable>

        {/* TOMORROW — planned meals + bedtime wind-down */}
        <SectionHeader title="Tomorrow" />
        <TomorrowOverview sleepLog={sleepLogData} />
      </ScrollView>

      {/* RED-S health check — periodic popup modal */}
      <Modal visible={showHealthCheck} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <HealthCheckCard age={age} />
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowHealthCheck(false);
                }}
                style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Youth safeguard — one-time popup modal */}
      <Modal visible={showYouthNotice} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.youthTitle}>Fueling Your Growth 🌱</Text>
            <Text style={styles.youthText}>
              Fuelify is designed to fuel your growth and performance — not restrict your eating.
              Young athletes need adequate energy to develop. If you have concerns about your
              weight, speak to a doctor or qualified sports dietitian.
            </Text>
            <Pressable
              onPress={dismissYouthNotice}
              style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.modalCloseText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <NotificationPermissionModal
        visible={showPermPrompt}
        onEnable={() => {
          setShowPermPrompt(false);
          void requestPermissions();
        }}
        onLater={() => {
          setShowPermPrompt(false);
          void deferPermissions();
        }}
      />

      <Toast
        visible={dayToast !== null}
        message={dayToast?.message ?? ""}
        icon={dayToast?.icon}
        accentColor={dayToast?.color}
        onHide={() => setDayToast(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
  },
  topLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
  },
  proBadgeText: {
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: 1.2,
    color: Colors.premiumGoldLight,
  },
  todayPill: {
    paddingHorizontal: 16,
  },
  todayDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  todayText: {
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: 1.6,
    color: Colors.text,
  },
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.canvasTop,
  },

  // Wordmark
  wordmark: {
    fontFamily: fonts.medium,
    fontSize: 15,
    letterSpacing: 7,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    marginTop: 18,
  },
  greeting: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
  },

  // Dials
  dialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginTop: 22,
    marginBottom: 24,
  },

  // Insight card
  checkBadge: {
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 6,
    minWidth: 30,
  },
  checkBadgeDone: {
    backgroundColor: Colors.primary,
  },
  checkBadgeText: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: Colors.text,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 10,
    paddingVertical: 10,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: Colors.text,
    fontVariant: ["tabular-nums"],
  },
  statValueMuted: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  statLabel: {
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 1.4,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Tiles
  tileRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  // Section meta
  sectionMeta: {
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Colors.textSecondary,
  },

  // Outlook row (AI Coach)
  outlookRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  outlookIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  outlookTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  outlookSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // Tip extras
  tipFoods: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tipFoodPill: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tipFoodText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  tipFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  tipSource: {
    fontSize: 11,
    color: Colors.textTertiary,
    flex: 1,
  },
  tipDismiss: {
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: 1.4,
    color: Colors.primary,
  },

  // Day strip
  dayStripCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  dayStripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayStripItem: {
    alignItems: "center",
    gap: 7,
  },
  dayStripLabel: {
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.textTertiary,
  },
  dayStripBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  dayStripDate: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: Colors.text,
    fontVariant: ["tabular-nums"],
  },
  dayStripDateActive: {
    color: Colors.textInverse,
  },
  dayStripDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalScroll: {
    flexGrow: 0,
    width: "100%",
  },
  modalContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 16,
    width: "100%",
    maxHeight: "80%",
  },
  modalClose: {
    backgroundColor: Colors.text,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 8,
  },
  modalCloseText: {
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 1.4,
    color: Colors.textInverse,
    textTransform: "uppercase",
  },
  youthTitle: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  youthText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
});
