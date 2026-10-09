import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { kvGet, kvSet } from "@/lib/database";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Bell, Bot, ChevronDown, ChevronUp, Crown, ShoppingCart, Trophy, User, Zap } from "lucide-react-native";

import Colors from "@/constants/colors";
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
import { getSleepTarget, loadSleepLog, weeklyAverage, type SleepLog } from "@/lib/sleepEngine";
import TomorrowOverview from "@/components/TomorrowOverview";
import Toast from "@/components/ui/Toast";

interface ActionBoxProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  buttonLabel: string;
  onPress: () => void;
  highlight?: boolean;
}

/** Bottom action card with a pill push button — spring press scale for tactile feedback. */
function ActionBox({ icon, title, subtitle, buttonLabel, onPress, highlight = false }: ActionBoxProps) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      style={[styles.actionBox, highlight && styles.actionBoxHighlight]}
      onPress={onPress}
      onPressIn={() => {
        Animated.spring(scale, {
          toValue: 0.96,
          useNativeDriver: true,
          speed: 50,
          bounciness: 0,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 4,
        }).start();
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          flex: 1,
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <View style={styles.actionBoxTop}>
          {icon}
          <Text style={styles.actionBoxTitle}>{title}</Text>
          <Text style={styles.actionBoxSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.actionBoxButton}>
          <Text style={styles.actionBoxButtonText}>{buttonLabel}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface FuelProgressRingProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  children?: React.ReactNode;
}

/** Circular SVG progress ring — sweeps up from 0 on app open, springs to new values on meal logs. */
function FuelProgressRing({ percentage, size, strokeWidth, children }: FuelProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const progress = useRef(new Animated.Value(0)).current;
  // First pass = app open (cinematic 0→value sweep); later passes = meal logged (spring)
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      Animated.timing(progress, {
        toValue: clampedPct,
        delay: 200, // let the hero card fade-in land first
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // strokeDashoffset is an SVG prop — not native-drivable
      }).start();
    } else {
      Animated.spring(progress, {
        toValue: clampedPct,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }).start();
    }
  }, [clampedPct, progress]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        {/* Track ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(45,212,168,0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center content (label, value, goal line) */}
      <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
        {children}
      </View>
    </View>
  );
}

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
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [sleepLogData, setSleepLogData] = useState<SleepLog>({});
  useFocusEffect(
    useCallback(() => {
      void loadTodayHydration().then(setHydrationMl);
      void (async () => {
        const log = await loadSleepLog();
        setSleepLogData(log);
        const d = new Date();
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const today = typeof log[key] === "number" ? log[key] : null;
        const avg = weeklyAverage(log);
        setSleepHours(today ?? avg);
      })();
    }, [refreshCount]),
  );

  const hydrationTargetMl = Math.round((todayData?.hydrationTarget ?? 3) * 1000);
  const sleepTarget = getSleepTarget(age);

  // ── Today's Fuel hero card data (from the meal-tracking store) ──
  const calorieTarget = todayData?.calorieTarget ?? 0;
  const fuelPct =
    calorieTarget > 0 ? Math.min(Math.round((stats.caloriesConsumed / calorieTarget) * 100), 100) : 0;

  // Dial sized to the screen — thick ring like a hero gauge
  const { width: screenWidth } = useWindowDimensions();
  const ringSize = Math.min(screenWidth - 72, 300);

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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER — compact, one line */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Fuel Your Game, {firstName} ⚽</Text>
            <Text style={styles.subGreeting}>
              {todayData?.dayName ?? "Today"} · {meta.label} {meta.icon}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {!profile.isPremium && (
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/premium");
                }}
                style={({ pressed }) => [styles.proBadge, pressed && { opacity: 0.8 }]}
              >
                <Crown size={13} color={Colors.premiumGold} />
                <Text style={styles.proBadgeText}>PRO</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/notifications");
              }}
              style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.7 }]}
            >
              <View>
                <Bell size={24} color={Colors.textSecondary} />
                {feedUnread > 0 ? <View style={styles.bellDot} /> : null}
              </View>
            </Pressable>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/profile" as never);
              }}
              style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.7 }]}
            >
              <User size={26} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* HERO DIAL — full-width fuel ring, taps through to the Plan tab */}
        <Animated.View
          style={{
            opacity: heroEntry,
            transform: [
              {
                translateY: heroEntry.interpolate({
                  inputRange: [0, 1],
                  outputRange: [15, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/plan" as never);
            }}
            style={styles.heroTouch}
          >
            <FuelProgressRing percentage={fuelPct} size={ringSize} strokeWidth={20}>
              <Text style={styles.heroLabel}>⚽ Fuel today</Text>
              <Text style={styles.heroValue}>{stats.caloriesConsumed}</Text>
              <Text style={styles.heroUnit}>kcal consumed</Text>
              <Text style={styles.heroSub}>
                {stats.completedCount > 0 && stats.completedCount >= stats.totalMeals
                  ? "All meals done — great job!"
                  : fuelPct >= 100
                    ? "Goal achieved"
                    : `Goal: ${calorieTarget} kcal`}
              </Text>
              <Text style={styles.heroMeals}>
                {stats.completedCount}/{stats.totalMeals} meals logged
              </Text>
            </FuelProgressRing>
            {/* Floating boost chip — anchored at the bottom of the dial */}
            <View style={styles.heroBoostRow} pointerEvents="none">
              <View style={styles.heroBoost}>
                <Zap size={22} color={Colors.primary} fill={Colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* DAY STRIP — real dates for the week, colour-coded by day type */}
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/profile" as never);
          }}
          style={({ pressed }) => [styles.dayStripCard, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.dayStripMonth}>{weekMonthLabel}</Text>
          <View style={styles.dayStripRow}>
            {weeklySchedule.map((type, i) => {
              const dayMeta = DAY_TYPE_META[type] ?? DAY_TYPE_META.rest;
              const isToday = i === todayIndex;
              const date = weekDates[i];
              return (
                <View key={`day-${i}`} style={styles.dayStripItem}>
                  <Text style={styles.dayStripLabel}>{DAY_ABBREVIATIONS[i]}</Text>
                  <View
                    style={[
                      styles.dayStripBubble,
                      { backgroundColor: isToday ? dayMeta.color : dayMeta.bgColor },
                      isToday && styles.dayStripBubbleActive,
                    ]}
                  >
                    <Text style={[styles.dayStripDate, isToday && styles.dayStripDateActive]}>
                      {date.getDate()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Pressable>

        {/* ROW 2 — Hydration + Sleep side by side */}
        <View style={styles.dualRow}>
          <Pressable
            style={({ pressed }) => [styles.halfCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/hydration" as never);
            }}
          >
            <View style={styles.halfCardHeader}>
              <Text style={styles.halfCardIcon}>💧</Text>
              <Text style={styles.halfCardValue}>
                {(hydrationMl / 1000).toFixed(1)}/{(hydrationTargetMl / 1000).toFixed(0)}L
              </Text>
            </View>
            <View style={styles.miniTrack}>
              <View
                style={[
                  styles.miniFill,
                  {
                    width: `${Math.min((hydrationMl / Math.max(hydrationTargetMl, 1)) * 100, 100)}%`,
                    backgroundColor: "#60A5FA",
                  },
                ]}
              />
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.halfCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/sleep" as never);
            }}
          >
            <View style={styles.halfCardHeader}>
              <Text style={styles.halfCardIcon}>😴</Text>
              <Text style={styles.halfCardValue}>
                {sleepHours !== null ? `${sleepHours}h` : "–"}
              </Text>
            </View>
            <View style={styles.miniTrack}>
              <View
                style={[
                  styles.miniFill,
                  {
                    width: `${Math.min(((sleepHours ?? 0) / sleepTarget.max) * 100, 100)}%`,
                    backgroundColor: "#A78BFA",
                  },
                ]}
              />
            </View>
          </Pressable>
        </View>

        {/* ROW 3 — Education tip (tap to expand inline) */}
        {tip || nutrientCard ? (
          <View style={styles.tipCard}>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTipExpanded((p) => !p);
              }}
              style={styles.tipHeader}
            >
              <Text style={styles.tipIcon}>📚</Text>
              <Text style={styles.tipTitle} numberOfLines={1}>
                {nutrientCard
                  ? `${nutrientCard.icon} ${nutrientCard.nutrient} Watch`
                  : tip?.title ?? ""}
              </Text>
              {tipExpanded ? (
                <ChevronUp size={16} color={Colors.textTertiary} />
              ) : (
                <ChevronDown size={16} color={Colors.textTertiary} />
              )}
            </Pressable>
            {tipExpanded ? (
              <View style={styles.tipBody}>
                <Text style={styles.tipText}>
                  {nutrientCard ? nutrientCard.why : tip?.body ?? ""}
                </Text>
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
                    📚 {nutrientCard ? nutrientCard.source : tip?.source ?? ""}
                  </Text>
                  {tip ? (
                    <Pressable onPress={handleDismissTip} hitSlop={8}>
                      <Text style={styles.tipDismiss}>Got it</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ACTION BOXES — Shop List, Match Day, AI Coach with pill push buttons */}
        <View style={styles.actionRow}>
          <ActionBox
            icon={<ShoppingCart size={22} color={Colors.primary} />}
            title="Shop List"
            subtitle="This week's groceries, sorted"
            buttonLabel="Open"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/shop" as never);
            }}
          />
          <ActionBox
            icon={<Trophy size={22} color={dayType === "match" ? Colors.match : Colors.text} />}
            title="Match Day"
            subtitle={
              dayType === "match" ? "It's match day — fuel up right" : `Your ${meta.label.toLowerCase()} schedule`
            }
            buttonLabel="View"
            highlight={dayType === "match"}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/match" as never);
            }}
          />
          <ActionBox
            icon={<Bot size={22} color={Colors.primary} />}
            title="AI Coach"
            subtitle="Nutrition answers, anytime"
            buttonLabel="Ask"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/coach" as never);
            }}
          />
        </View>

        {/* Tomorrow overview — planned meals + bedtime wind-down */}
        <TomorrowOverview sleepLog={sleepLogData} />

        {/* ROW 2 — Hydration + Sleep side by side */}
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

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  subGreeting: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(212,164,76,0.12)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,164,76,0.35)",
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.premiumGoldLight,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Day strip
  dayStripCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  dayStripMonth: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
  },
  dayStripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayStripItem: {
    alignItems: "center",
    gap: 6,
  },
  dayStripLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  dayStripBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayStripBubbleActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  dayStripDate: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  dayStripDateActive: {
    color: Colors.textInverse,
  },

  // Hero dial
  heroTouch: {
    alignSelf: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 52,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -1.5,
  },
  heroUnit: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginTop: -2,
  },
  heroSub: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 10,
  },
  heroMeals: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  heroBoostRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 2,
    alignItems: "center",
  },
  heroBoost: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // Dual row
  dualRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  halfCard: {
    flex: 1,
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  halfCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  halfCardIcon: {
    fontSize: 18,
  },
  halfCardValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  miniTrack: {
    height: 4,
    backgroundColor: Colors.bg4,
    borderRadius: 2,
    overflow: "hidden",
  },
  miniFill: {
    height: 4,
    borderRadius: 2,
  },

  // Tip card
  tipCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginBottom: 10,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tipIcon: {
    fontSize: 14,
  },
  tipTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  tipBody: {
    marginTop: 10,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tipFoods: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tipFoodPill: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tipFoodText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  tipFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  tipSource: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontStyle: "italic",
    flex: 1,
  },
  tipDismiss: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
  },

  // Action boxes
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  actionBox: {
    flex: 1,
    backgroundColor: Colors.bg2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 150,
    padding: 14,
  },
  actionBoxHighlight: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.accentLight,
  },
  actionBoxTop: {
    gap: 6,
  },
  actionBoxTitle: {
    fontSize: 15,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  actionBoxSubtitle: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  actionBoxButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: 12,
  },
  actionBoxButtonText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.bg0,
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
    backgroundColor: Colors.bg1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    width: "100%",
    maxHeight: "80%",
  },
  modalClose: {
    backgroundColor: Colors.bg3,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
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
