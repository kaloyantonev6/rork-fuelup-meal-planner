import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { kvGet, kvSet } from "@/lib/database";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Bot, ChevronDown, ChevronUp, Crown, ShoppingCart, Trophy, User } from "lucide-react-native";

import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useToday } from "@/providers/TodayProvider";
import { useMealTracking } from "@/providers/MealTrackingProvider";
import { useNotifications } from "@/providers/NotificationProvider";
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
import { getSleepTarget, loadSleepLog, weeklyAverage } from "@/lib/sleepEngine";
import Toast from "@/components/ui/Toast";

interface MacroChipProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

/** Compact macro chip — coloured dot + current/target grams. */
function MacroChip({ label, current, target, color }: MacroChipProps) {
  return (
    <View style={styles.macroChip}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {Math.round(current)}/{target}g
      </Text>
    </View>
  );
}

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  highlight?: boolean;
}

/** Square quick-action button with a spring press scale. */
function QuickActionButton({ icon, label, onPress, highlight = false }: QuickActionButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      style={[
        styles.quickAction,
        highlight && styles.quickActionHighlight,
      ]}
      onPress={onPress}
      onPressIn={() => {
        Animated.spring(scale, {
          toValue: 0.95,
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
      <Animated.View style={{ transform: [{ scale }], alignItems: "center", gap: 4 }}>
        {icon}
        <Text style={styles.quickActionLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
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
  useFocusEffect(
    useCallback(() => {
      void loadTodayHydration().then(setHydrationMl);
      void (async () => {
        const log = await loadSleepLog();
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

  // ── Today's Fuel main card data (from the meal-tracking store) ──
  const consumedMacros = useMemo(() => {
    let protein = 0;
    let carbs = 0;
    let fats = 0;
    for (const m of tracking?.meals ?? []) {
      if (!m.completedAt) continue;
      protein += m.protein;
      carbs += m.carbs;
      fats += m.fats;
    }
    return { protein, carbs, fats };
  }, [tracking]);

  const calorieTarget = todayData?.calorieTarget ?? 0;
  const caloriesConsumed = stats.caloriesConsumed;
  const fuelPct = calorieTarget > 0 ? Math.min(Math.round((caloriesConsumed / calorieTarget) * 100), 100) : 0;

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
                router.push("/(tabs)/profile" as never);
              }}
              style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.7 }]}
            >
              <User size={26} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>

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

        {/* MAIN CARD — Today's Fuel → Plan tab */}
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/plan" as never);
          }}
          style={({ pressed }) => [
            styles.mainCard,
            { borderLeftColor: meta.color },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <View style={styles.mainCardHeader}>
            <Text style={styles.mainCardTitle}>Today&apos;s Fuel</Text>
            <Text style={styles.mainCardCalories}>
              {calorieTarget.toLocaleString()} kcal
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${fuelPct}%` }]} />
          </View>

          {/* Macro chips */}
          <View style={styles.macroRow}>
            <MacroChip label="P" current={consumedMacros.protein} target={todayData?.proteinGrams ?? 0} color="#60A5FA" />
            <MacroChip label="C" current={consumedMacros.carbs} target={todayData?.carbsGrams ?? 0} color="#FBBF24" />
            <MacroChip label="F" current={consumedMacros.fats} target={todayData?.fatsGrams ?? 0} color="#F87171" />
          </View>

          {/* Footer — meal count + arrow */}
          <View style={styles.mainCardFooter}>
            <Text style={styles.mealCount}>
              {stats.completedCount}/{stats.totalMeals} meals ✓
            </Text>
            <Text style={[styles.mainCardCta, { color: meta.color }]}>Open plan →</Text>
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

        {/* ROW 4 — Quick actions */}
        <View style={styles.quickActions}>
          <QuickActionButton
            icon={<ShoppingCart size={22} color={Colors.text} />}
            label="Shop List"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/shop" as never);
            }}
          />
          <QuickActionButton
            icon={<Trophy size={22} color={dayType === "match" ? Colors.match : Colors.text} />}
            label="Match Day"
            highlight={dayType === "match"}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/match" as never);
            }}
          />
          <QuickActionButton
            icon={<Bot size={22} color={Colors.primary} />}
            label="AI Coach"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/coach" as never);
            }}
          />
        </View>
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

  // Main card
  mainCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  mainCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  mainCardTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  mainCardCalories: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.bg4,
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  macroRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  macroChip: {
    flex: 1,
    backgroundColor: Colors.bg3,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  macroValue: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  mainCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealCount: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  mainCardCta: {
    fontSize: 12,
    fontWeight: "700" as const,
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

  // Quick actions
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionHighlight: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.accentLight,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginTop: 2,
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
