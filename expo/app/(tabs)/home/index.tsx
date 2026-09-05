import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Zap,
  Calendar,
  Crown,
  Pencil,
  ChevronRight,
  Heart,
  ClipboardList,
  ChefHat,
  Sparkles,
  Droplet,
  Trophy,
  Dumbbell,
  Moon,
  Footprints,
  Check,
} from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import Svg, { Circle } from "react-native-svg";
import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useSavedPlans } from "@/providers/SavedPlansProvider";
import {
  DIET_TYPES,
  FOOTBALL_POSITIONS,
  COOK_TIME_OPTIONS,
} from "@/constants/onboarding";
import type { CookTimeFilter } from "@/constants/onboarding";
import type { DayType } from "@/types";
import {
  generateDailyPlan,
  generateWeeklyPlan,
  compileShoppingList,
  getDayTypeFromSchedule,
  GeneratedPlan,
  ShoppingIngredient,
} from "@/utils/mealGenerator";
import { calculateWaterTarget, calculateDayTargets } from "@/utils/dailyTargets";
import { TIMELINE_TEMPLATES } from "@/utils/timeline";
import MealResults from "@/components/MealResults";
import DailyTargetsCard from "@/components/DailyTargetsCard";

const FREE_DAILY_GEN_KEY = "nutriplan_free_daily_gen";
const FREE_DAILY_LIMIT = 1;
const HYDRATION_KEY = "fuelup_hydration";
const TIP_INDEX_KEY = "fuelup_tip_index";
const COMPLETED_SESSIONS_PREFIX = "fuelup_completed_sessions_";

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCompletedKey(): string {
  return `${COMPLETED_SESSIONS_PREFIX}${getTodayKey()}`;
}

/**
 * Animated circular progress ring for daily fuel completion.
 * Fills clockwise with a spring-like ease as the percentage changes.
 */
function FuelProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  trackColor,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(progress, 1));

  const animatedOffset = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    const target = circumference * (1 - clamped);
    Animated.timing(animatedOffset, {
      toValue: target,
      duration: 650,
      useNativeDriver: false,
    }).start();
  }, [clamped, circumference, animatedOffset]);

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={animatedOffset as unknown as number}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

/**
 * Animated SVG Circle wrapper that accepts an Animated number for strokeDashoffset.
 */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PERFORMANCE_TIPS = [
  "Carb-load 24–48h before match day, not just the night before.",
  "Caffeine 30–60 min before kickoff can improve sprint performance.",
  "Post-match: eat within 30 minutes. A 3:1 carb-to-protein ratio speeds recovery.",
  "Dehydration of just 2% body weight can reduce sprint speed by up to 10%.",
  "Iron deficiency is common in young players — eat red meat, spinach, or fortified cereals.",
  "Tart cherry juice can reduce muscle soreness by up to 50% after matches.",
  "Avoid high-fiber and high-fat meals within 3 hours of kickoff — they slow digestion.",
  "Creatine (3–5g/day) is one of the most studied supplements for repeated sprint performance.",
  "Sleep 8–10 hours on nights before matches. Poor sleep impairs reaction time more than alcohol.",
  "Your muscles store ~500g of glycogen. It takes 24–48h of carb-rich eating to fully reload.",
  "Protein needs for footballers: 1.4–1.7g per kg body weight per day.",
  "Dark-colored urine before training? You're already dehydrated. Drink 500ml in the next hour.",
  "Beetroot juice 2–3 hours before exercise may improve endurance by boosting nitric oxide.",
  "Omega-3 from fish (salmon, mackerel) reduces inflammation and speeds recovery between matches.",
];

const DAY_TYPE_CONFIG: Record<DayType, { label: string; icon: string; color: string; subtitle: string }> = {
  training: { label: "Training Day", icon: "🟢", color: Colors.training, subtitle: "Eat to perform." },
  match: { label: "Match Day", icon: "🔴", color: Colors.match, subtitle: "Fuel for the pitch!" },
  rest: { label: "Rest Day", icon: "⚪", color: Colors.rest, subtitle: "Recover & refuel." },
  recovery: { label: "Recovery Day", icon: "🟡", color: Colors.recovery, subtitle: "Repair & rebuild." },
};

interface DayFuelPlanCardProps {
  dayType: DayType;
  onPress: () => void;
}

function DayFuelPlanCard({ dayType, onPress }: DayFuelPlanCardProps) {
  const config: Record<DayType, { icon: React.ReactNode; emoji: string; title: string; subtitle: string; color: string; gradient: readonly [string, string] }> = {
    training: {
      icon: <Dumbbell size={22} color={Colors.training} />,
      emoji: "⚽",
      title: "Training Day Fuel Plan",
      subtitle: "Timeline your eating around today's session",
      color: Colors.training,
      gradient: ["#0f2f1a", "#0f3d2a"] as const,
    },
    match: {
      icon: <Trophy size={22} color={Colors.match} />,
      emoji: "⚽",
      title: "Match Day Fuel Plan",
      subtitle: "Timeline your eating around kickoff",
      color: Colors.match,
      gradient: ["#3a1a1a", "#2a1212"] as const,
    },
    rest: {
      icon: <Moon size={22} color={Colors.rest} />,
      emoji: "⚪",
      title: "Rest Day Fuel Plan",
      subtitle: "Lighter day, steady recovery",
      color: Colors.rest,
      gradient: ["#1f2229", "#1a1d23"] as const,
    },
    recovery: {
      icon: <Heart size={22} color={Colors.recovery} />,
      emoji: "🟡",
      title: "Recovery Day Fuel Plan",
      subtitle: "Repair & rebuild with anti-inflammatory foods",
      color: Colors.recovery,
      gradient: ["#2a1d0f", "#1f1a12"] as const,
    },
  };

  const day = config[dayType];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.dayFuelCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
    >
      <LinearGradient
        colors={day.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.dayFuelGradient, { borderColor: day.color + "40" }]}
      >
        <View style={styles.dayFuelLeft}>
          <View style={[styles.dayFuelIconWrap, { backgroundColor: day.color + "20" }]}>
            {day.icon}
          </View>
          <View style={styles.dayFuelText}>
            <Text style={styles.dayFuelTitle}>{day.emoji} {day.title}</Text>
            <Text style={styles.dayFuelSubtitle}>{day.subtitle}</Text>
          </View>
        </View>
        <ChevronRight size={20} color={Colors.textSecondary} />
      </LinearGradient>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useMealPlan();
  const { savedPlans, favorites } = useSavedPlans();

  const [mealsPerDay, setMealsPerDay] = useState<number>(4);
  const [showCookingPrefs, setShowCookingPrefs] = useState(false);
  const [localMaxCookTime, setLocalMaxCookTime] = useState<CookTimeFilter>(
    (profile.maxCookTime as CookTimeFilter) ?? "any"
  );
  const [localNoCookOnly, setLocalNoCookOnly] = useState(profile.noCookOnly ?? false);
  const [localMaxFiveIngredients, setLocalMaxFiveIngredients] = useState(
    profile.maxFiveIngredients ?? false
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState<GeneratedPlan[] | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingIngredient[]>([]);
  const [planType, setPlanType] = useState<"daily" | "weekly">("daily");
  const [currentTip, setCurrentTip] = useState(PERFORMANCE_TIPS[0] ?? "");
  const [hydrationMl, setHydrationMl] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [totalMealsToday, setTotalMealsToday] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 12, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (isGenerating) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      );
      pulse.start();
      Animated.timing(loadingAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      return () => pulse.stop();
    } else {
      Animated.timing(loadingAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [isGenerating, loadingAnim, pulseAnim]);

  // Load hydration data and tip index
  // Refresh completed-meal progress whenever the dashboard gains focus
  // (e.g. returning from the Day Fuel Plan screen where meals are checked off).
  useFocusEffect(
    useCallback(() => {
      const loadCompleted = async () => {
        try {
          const stored = await AsyncStorage.getItem(getCompletedKey());
          if (stored) {
            const parsed = JSON.parse(stored) as number[];
            setCompletedIndices(Array.isArray(parsed) ? parsed.filter((i) => typeof i === "number") : []);
          } else {
            setCompletedIndices([]);
          }
        } catch (e) {
          console.log("[HomeScreen] Error loading completed sessions:", e);
        }
      };
      void loadCompleted();
    }, []),
  );

  useEffect(() => {
    const loadHydration = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const stored = await AsyncStorage.getItem(HYDRATION_KEY);
        if (stored) {
          const data = JSON.parse(stored) as { date: string; intakeMl: number };
          if (data.date === today) {
            setHydrationMl(data.intakeMl);
          } else {
            setHydrationMl(0);
            await AsyncStorage.setItem(HYDRATION_KEY, JSON.stringify({ date: today, intakeMl: 0 }));
          }
        }
      } catch (e) {
        console.log("[HomeScreen] Error loading hydration:", e);
      }
    };
    void loadHydration();

    // Load tip index (rotates daily)
    const loadTip = async () => {
      try {
        const tipIdxStr = await AsyncStorage.getItem(TIP_INDEX_KEY);
        const today = new Date().toISOString().split("T")[0];
        if (tipIdxStr) {
          const { date, index } = JSON.parse(tipIdxStr) as { date: string; index: number };
          if (date === today) {
            setCurrentTip(PERFORMANCE_TIPS[index % PERFORMANCE_TIPS.length] ?? PERFORMANCE_TIPS[0]!);
          } else {
            const newIndex = (index + 1) % PERFORMANCE_TIPS.length;
            setCurrentTip(PERFORMANCE_TIPS[newIndex] ?? PERFORMANCE_TIPS[0]!);
            await AsyncStorage.setItem(TIP_INDEX_KEY, JSON.stringify({ date: today, index: newIndex }));
          }
        } else {
          const randomIdx = Math.floor(Math.random() * PERFORMANCE_TIPS.length);
          setCurrentTip(PERFORMANCE_TIPS[randomIdx] ?? PERFORMANCE_TIPS[0]!);
          await AsyncStorage.setItem(TIP_INDEX_KEY, JSON.stringify({ date: today, index: randomIdx }));
        }
      } catch (e) {
        console.log("[HomeScreen] Error loading tip:", e);
      }
    };
    void loadTip();
  }, []);

  const firstName = profile.name?.split(" ")[0] || "there";

  const todayDayType = useCallback((): DayType => {
    return getDayTypeFromSchedule(new Date(), profile);
  }, [profile]);

  // Total fuel sessions for today based on the active day-type timeline template.
  useEffect(() => {
    setTotalMealsToday(TIMELINE_TEMPLATES[todayDayType()].entries.length);
  }, [todayDayType]);

  const completedCount = completedIndices.length;
  const fuelProgress = totalMealsToday > 0 ? completedCount / totalMealsToday : 0;
  const fuelPct = Math.round(fuelProgress * 100);

  const dayConfig = DAY_TYPE_CONFIG[todayDayType()];
  const todayTemplate = TIMELINE_TEMPLATES[todayDayType()];
  const dayCalorieTarget = useMemo(
    () => calculateDayTargets(profile, todayDayType()).calories,
    [profile, todayDayType]
  );

  // Toggle a fuel session directly from the dashboard. Persists to the same
  // storage key the Day Fuel Plan screen reads, so both stay in sync — and
  // because the ring derives from this state, it updates immediately.
  const toggleSession = useCallback((idx: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCompletedIndices((prev) => {
      const next = prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx];
      void AsyncStorage.setItem(getCompletedKey(), JSON.stringify(next)).catch((e) =>
        console.log("[HomeScreen] Error saving completed sessions:", e),
      );
      return next;
    });
  }, []);

  const dietLabel = DIET_TYPES.find((d) => d.id === profile.dietType)?.label ?? "Balanced";
  const dietIcon = DIET_TYPES.find((d) => d.id === profile.dietType)?.icon ?? "🍽️";
  const positionLabel = FOOTBALL_POSITIONS.find((p) => p.id === profile.position)?.label ?? "Player";
  const positionIcon = FOOTBALL_POSITIONS.find((p) => p.id === profile.position)?.icon ?? "⚽";

  const waterTargetL = calculateWaterTarget(profile.weight || 70, todayDayType());
  const waterTargetMl = Math.round(waterTargetL * 1000);
  const waterProgress = waterTargetMl > 0 ? Math.min(hydrationMl / waterTargetMl, 1) : 0;
  const waterGlasses = Math.floor(hydrationMl / 250);

  const addHydration = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMl = hydrationMl + 250;
    setHydrationMl(newMl);
    try {
      const today = new Date().toISOString().split("T")[0];
      await AsyncStorage.setItem(HYDRATION_KEY, JSON.stringify({ date: today, intakeMl: newMl }));
    } catch (e) {
      console.log("[HomeScreen] Error saving hydration:", e);
    }
  }, [hydrationMl]);

  const checkFreeGenerationLimit = useCallback(async (): Promise<boolean> => {
    if (profile.isPremium) return true;
    try {
      const stored = await AsyncStorage.getItem(FREE_DAILY_GEN_KEY);
      if (stored) {
        const data = JSON.parse(stored) as { date: string; count: number };
        const today = new Date().toISOString().split("T")[0];
        if (data.date === today && data.count >= FREE_DAILY_LIMIT) {
          return false;
        }
      }
      return true;
    } catch {
      return true;
    }
  }, [profile.isPremium]);

  const incrementGenerationCount = useCallback(async () => {
    if (profile.isPremium) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const stored = await AsyncStorage.getItem(FREE_DAILY_GEN_KEY);
      let count = 1;
      if (stored) {
        const data = JSON.parse(stored) as { date: string; count: number };
        if (data.date === today) {
          count = data.count + 1;
        }
      }
      await AsyncStorage.setItem(FREE_DAILY_GEN_KEY, JSON.stringify({ date: today, count }));
    } catch (e) {
      console.log("[HomeScreen] Error incrementing generation count:", e);
    }
  }, [profile.isPremium]);

  const handleGenerate = useCallback(async (type: "daily" | "weekly") => {
    if (!profile.isPremium && type === "weekly") {
      router.push("/premium");
      return;
    }

    if (!profile.isPremium) {
      const canGenerate = await checkFreeGenerationLimit();
      if (!canGenerate) {
        Alert.alert(
          "Daily Limit Reached",
          "Free users can generate 1 meal plan per day. Upgrade to Premium for unlimited generations!",
          [
            { text: "Maybe Later", style: "cancel" },
            { text: "Upgrade to Premium", onPress: () => router.push("/premium") },
          ]
        );
        return;
      }
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlanType(type);
    setIsGenerating(true);

    await new Promise((r) => setTimeout(r, 1800));

    const adjustedProfile = {
      ...profile,
      maxCookTime: localMaxCookTime,
      noCookOnly: localNoCookOnly,
      maxFiveIngredients: localMaxFiveIngredients,
    };

    if (type === "daily") {
      const plan = await generateDailyPlan(adjustedProfile, mealsPerDay, null);
      setGeneratedPlans([plan]);
      setShoppingList(compileShoppingList([plan]));
    } else {
      const plans = await generateWeeklyPlan(adjustedProfile, mealsPerDay, null);
      setGeneratedPlans(plans);
      setShoppingList(compileShoppingList(plans));
    }

    setIsGenerating(false);
    await incrementGenerationCount();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [profile, mealsPerDay, router, checkFreeGenerationLimit, incrementGenerationCount, localMaxCookTime, localNoCookOnly, localMaxFiveIngredients]);

  const handleBack = useCallback(() => {
    setGeneratedPlans(null);
    setShoppingList([]);
  }, []);

  if (generatedPlans) {
    return (
      <MealResults
        plans={generatedPlans}
        shoppingList={shoppingList}
        planType={planType}
        isPremium={profile.isPremium}
        country={profile.country}
        onBack={handleBack}
        onUpgrade={() => router.push("/premium")}
      />
    );
  }

  // Circle progress for hydration ring
  const ringRadius = 42;
  const circumference = 2 * Math.PI * ringRadius;
  const ringFill = circumference * waterProgress;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D2B1F", "#0F3D2A", "#156042"]}
        locations={[0, 0.5, 1]}
        style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.greetingRow}>
            <View style={styles.greetingTextWrap}>
              <Text style={styles.greetingText}>
                Fuel Your Game, {firstName} ⚽
              </Text>
              <View style={styles.dayTypeBadgeRow}>
                <View style={[styles.dayTypeBadge, { backgroundColor: dayConfig.color + "20", borderColor: dayConfig.color + "60" }]}>
                  <Text style={styles.dayTypeBadgeIcon}>{dayConfig.icon}</Text>
                  <Text style={[styles.dayTypeBadgeText, { color: dayConfig.color }]}>
                    {dayConfig.label}
                  </Text>
                </View>
                {!profile.isPremium && (
                  <Pressable
                    onPress={() => router.push("/premium")}
                    style={({ pressed }) => [styles.proBadge, pressed && { opacity: 0.8 }]}
                  >
                    <Crown size={13} color="#D4A44C" />
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </Pressable>
                )}
              </View>
              <Text style={styles.subtitleText}>{dayConfig.subtitle}</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Fuel Progress ring + tappable fuel sessions */}
        <View style={styles.fuelProgressCard}>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/match-day" as never);
            }}
            style={({ pressed }) => [styles.fuelProgressTop, pressed && { opacity: 0.92 }]}
          >
            <FuelProgressRing
              progress={fuelProgress}
              size={92}
              strokeWidth={9}
              color={dayConfig.color}
              trackColor={Colors.surfaceElevated}
            />
            <View style={styles.fuelProgressCenter} pointerEvents="none">
              <Text style={[styles.fuelProgressPct, { color: dayConfig.color }]}>{fuelPct}%</Text>
              <Text style={styles.fuelProgressSub}>{completedCount}/{totalMealsToday} meals</Text>
            </View>
            <View style={styles.fuelProgressRight}>
              <View style={styles.fuelProgressTitleRow}>
                <Text style={styles.fuelProgressTitle}>Today's Fuel</Text>
                <View style={[styles.fuelProgressBadge, { backgroundColor: dayConfig.color + "20", borderColor: dayConfig.color + "60" }]}>
                  <Text style={[styles.fuelProgressBadgeText, { color: dayConfig.color }]}>{dayConfig.icon} {dayConfig.label}</Text>
                </View>
              </View>
              <Text style={styles.fuelProgressSubtitle}>
                {completedCount >= totalMealsToday && totalMealsToday > 0
                  ? "All fuel sessions complete. Recovery on point! 💪"
                  : completedCount > 0
                    ? `${totalMealsToday - completedCount} more fuel session${totalMealsToday - completedCount !== 1 ? "s" : ""} to go today.`
                    : "Mark off meals as you fuel up throughout the day."}
              </Text>
              <View style={styles.fuelProgressCtaRow}>
                <Text style={[styles.fuelProgressCta, { color: dayConfig.color }]}>Open day fuel plan</Text>
                <ChevronRight size={14} color={dayConfig.color} />
              </View>
            </View>
          </Pressable>

          <View style={styles.fuelSessionsDivider} />

          <View>
            {todayTemplate.entries.map((entry, idx) => {
              const isDone = completedIndices.includes(idx);
              const sessionKcal = Math.round(dayCalorieTarget * entry.caloriePct);
              return (
                <Pressable
                  key={`${entry.mealSlot}-${idx}`}
                  onPress={() => toggleSession(idx)}
                  style={({ pressed }) => [styles.fuelSessionRow, pressed && { opacity: 0.65 }]}
                >
                  <View
                    style={[
                      styles.fuelSessionCheck,
                      isDone && { backgroundColor: dayConfig.color, borderColor: dayConfig.color },
                    ]}
                  >
                    {isDone && <Check size={11} color={Colors.background} />}
                  </View>
                  <Text
                    style={[styles.fuelSessionName, isDone && styles.fuelSessionNameDone]}
                    numberOfLines={1}
                  >
                    {entry.label}
                  </Text>
                  <Text style={styles.fuelSessionMeta}>
                    {entry.offsetLabel}
                    {sessionKcal > 0 ? ` · ~${sessionKcal} kcal` : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Fuel Profile pills */}
        <View style={styles.prefsCard}>
          <View style={styles.prefsHeader}>
            <Text style={styles.prefsTitle}>Your Fuel Profile</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/profile")}
              style={({ pressed }) => [styles.editLink, pressed && { opacity: 0.6 }]}
            >
              <Pencil size={13} color={Colors.primary} />
              <Text style={styles.editLinkText}>Edit</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
            <View style={styles.pillsRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{positionIcon} {positionLabel}</Text>
              </View>
              <View style={styles.pillDot} />
              <View style={styles.pill}>
                <Text style={styles.pillText}>{dietIcon} {dietLabel}</Text>
              </View>
              <View style={styles.pillDot} />
              <View style={styles.pill}>
                <Text style={styles.pillText}>💰 €{profile.weeklyBudget ?? 35}/wk</Text>
              </View>
              {profile.country ? (
                <>
                  <View style={styles.pillDot} />
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>📍 {profile.country}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </ScrollView>
        </View>

        <DailyTargetsCard profile={profile} dayType={todayDayType()} />

        {/* Day Fuel Plan button — adapts to today's day type */}
        <DayFuelPlanCard dayType={todayDayType()} onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/match-day" as never);
        }} />

        {/* Hydration Card */}
        <View style={styles.hydrationCard}>
          <View style={styles.hydrationHeader}>
            <View style={styles.hydrationTitleRow}>
              <Droplet size={18} color={Colors.primary} />
              <Text style={styles.hydrationTitle}>Hydration</Text>
            </View>
            <Pressable
              onPress={addHydration}
              style={({ pressed }) => [styles.addWaterBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
            >
              <Text style={styles.addWaterBtnText}>+ 250ml</Text>
            </Pressable>
          </View>

          <View style={styles.hydrationBody}>
            {/* Circular progress ring */}
            <View style={styles.ringContainer}>
              <View style={styles.ringOuter}>
                {/* SVG-free circular progress using borderRadius */}
                <View style={styles.ringBg} />
                <View
                  style={[
                    styles.ringFillView,
                    {
                      borderTopLeftRadius: ringRadius,
                      borderTopRightRadius: ringRadius,
                      borderBottomLeftRadius: ringRadius,
                      borderBottomRightRadius: ringRadius,
                      width: ringRadius * 2 * waterProgress,
                    },
                  ]}
                />
              </View>
              <View style={styles.ringCenter}>
                <Text style={styles.ringValue}>
                  {(hydrationMl / 1000).toFixed(1)}
                </Text>
                <Text style={styles.ringUnit}>/ {waterTargetL.toFixed(1)} L</Text>
              </View>
            </View>

            <View style={styles.hydrationRight}>
              {/* Water glass icons */}
              <View style={styles.glassesRow}>
                {Array.from({ length: Math.min(Math.max(waterGlasses + 1, 1), 12) }).map((_, i) => (
                  <Pressable
                    key={i}
                    onPress={addHydration}
                    style={({ pressed }) => [styles.glassIcon, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={[styles.glassEmoji, i < waterGlasses && styles.glassEmojiFilled]}>
                      {i < waterGlasses ? "💧" : "🥤"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {todayDayType() === "match" && (
                <Text style={styles.hydrationNote}>
                  Start hydrating 24h before kickoff. Aim for clear/light yellow urine.
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Performance Tip of the Day */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Sparkles size={16} color={Colors.premiumGold} />
            <Text style={styles.tipLabel}>Performance Tip</Text>
          </View>
          <Text style={styles.tipText}>{currentTip}</Text>
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccessRow}>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/home/favorites" as never);
            }}
            style={({ pressed }) => [styles.quickAccessCard, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          >
            <View style={styles.quickAccessIconWrap}>
              <Heart size={18} color="#EF4444" fill="#EF4444" />
            </View>
            <View style={styles.quickAccessTextWrap}>
              <Text style={styles.quickAccessLabel}>Favorites</Text>
              <Text style={styles.quickAccessCount}>{favorites.length} meal{favorites.length !== 1 ? "s" : ""}</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/home/saved-plans" as never);
            }}
            style={({ pressed }) => [styles.quickAccessCard, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          >
            <View style={styles.quickAccessIconWrap}>
              <ClipboardList size={18} color={Colors.primary} />
            </View>
            <View style={styles.quickAccessTextWrap}>
              <Text style={styles.quickAccessLabel}>Saved Plans</Text>
              <Text style={styles.quickAccessCount}>{savedPlans.length} plan{savedPlans.length !== 1 ? "s" : ""}</Text>
            </View>
          </Pressable>
        </View>

        {/* Meals per day */}
        <View style={styles.optionsSection}>
          <Text style={styles.optionLabel}>Meals per day</Text>
          <Text style={styles.optionHint}>Training & match days include a post-session snack</Text>
          <View style={styles.optionRow}>
            {[3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMealsPerDay(n);
                }}
                style={[
                  styles.optionBtn,
                  mealsPerDay === n && styles.optionBtnActive,
                ]}
              >
                <Text style={[styles.optionBtnText, mealsPerDay === n && styles.optionBtnTextActive]}>
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Cooking Preferences */}
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowCookingPrefs((p) => !p);
          }}
          style={({ pressed }) => [styles.cookingToggleCard, pressed && { opacity: 0.8 }]}
        >
          <View style={styles.cookingToggleLeft}>
            <ChefHat size={18} color={Colors.primary} />
            <Text style={styles.cookingToggleLabel}>Cooking Preferences</Text>
          </View>
          <View style={styles.cookingToggleRight}>
            {localMaxCookTime !== "any" && (
              <View style={styles.cookingActiveChip}>
                <Text style={styles.cookingActiveChipText}>
                  {COOK_TIME_OPTIONS.find((o) => o.id === localMaxCookTime)?.label ?? localMaxCookTime}
                </Text>
              </View>
            )}
            {localNoCookOnly && (
              <View style={styles.cookingActiveChip}>
                <Text style={styles.cookingActiveChipText}>No-Cook</Text>
              </View>
            )}
            {localMaxFiveIngredients && (
              <View style={styles.cookingActiveChip}>
                <Text style={styles.cookingActiveChipText}>5 Ing.</Text>
              </View>
            )}
            <Text style={styles.cookingToggleArrow}>{showCookingPrefs ? "▲" : "▼"}</Text>
          </View>
        </Pressable>

        {showCookingPrefs && (
          <View style={styles.cookingPrefsPanel}>
            <View style={styles.cookingSection}>
              <Text style={styles.cookingSectionLabel}>Max Cook Time</Text>
              <View style={styles.cookingChipRow}>
                {COOK_TIME_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLocalMaxCookTime(opt.id);
                    }}
                    style={[
                      styles.cookingChip,
                      localMaxCookTime === opt.id && styles.cookingChipActive,
                    ]}
                  >
                    <Text style={styles.cookingChipIcon}>{opt.icon}</Text>
                    <Text
                      style={[
                        styles.cookingChipText,
                        localMaxCookTime === opt.id && styles.cookingChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.cookingToggleRow}>
              <View style={styles.cookingToggleTextWrap}>
                <Text style={styles.cookingToggleRowLabel}>No-Cook Only</Text>
                <Text style={styles.cookingToggleRowSubtitle}>Assembly-only meals</Text>
              </View>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLocalNoCookOnly((p) => !p);
                }}
                style={[
                  styles.toggleSwitch,
                  localNoCookOnly && styles.toggleSwitchOn,
                ]}
              >
                <View style={[styles.toggleThumb, localNoCookOnly && styles.toggleThumbOn]} />
              </Pressable>
            </View>

            <View style={styles.cookingToggleRow}>
              <View style={styles.cookingToggleTextWrap}>
                <View style={styles.cookingToggleLabelRow}>
                  <Text style={styles.cookingToggleRowLabel}>Simple meals only</Text>
                  <Sparkles size={14} color={Colors.premiumGold} />
                </View>
                <Text style={styles.cookingToggleRowSubtitle}>Max 5 ingredients — less shopping</Text>
              </View>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLocalMaxFiveIngredients((p) => !p);
                }}
                style={[
                  styles.toggleSwitch,
                  localMaxFiveIngredients && styles.toggleSwitchOn,
                ]}
              >
                <View style={[styles.toggleThumb, localMaxFiveIngredients && styles.toggleThumbOn]} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Generate buttons */}
        <View style={styles.generateSection}>
          <Pressable
            onPress={() => void handleGenerate("daily")}
            style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <LinearGradient
              colors={["#2dd4a8", "#22c997"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.generateCard}
            >
              <View style={styles.generateCardInner}>
                <View style={styles.generateIconWrap}>
                  <Zap size={24} color="#0F1115" />
                </View>
                <View style={styles.generateTextWrap}>
                  <View style={styles.generateTitleRow}>
                    <Text style={styles.generateTitle}>Generate Today's Fuel</Text>
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>FREE</Text>
                    </View>
                  </View>
                  <Text style={styles.generateSubtitle}>Match-day aware daily meal plan</Text>
                </View>
                <ChevronRight size={20} color="rgba(15,17,21,0.5)" />
              </View>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => void handleGenerate("weekly")}
            style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <LinearGradient
              colors={["#0f766e", "#115e59"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.generateCard}
            >
              <View style={styles.generateCardInner}>
                <View style={[styles.generateIconWrap, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                  <Calendar size={24} color="#fff" />
                </View>
                <View style={styles.generateTextWrap}>
                  <View style={styles.generateTitleRow}>
                    <Text style={styles.generateTitle}>Generate Weekly Plan</Text>
                    <View style={styles.proBadgeSmall}>
                      <Crown size={10} color="#D4A44C" />
                      <Text style={styles.proBadgeSmallText}>PRO</Text>
                    </View>
                  </View>
                  <Text style={styles.generateSubtitle}>7-day plan by training schedule</Text>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={isGenerating} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <Animated.View
            style={[
              styles.loadingCard,
              { opacity: loadingAnim, transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.loadingIconCircle}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
            <Text style={styles.loadingTitle}>Building your fuel plan...</Text>
            <Text style={styles.loadingSubtitle}>
              {currentTip}
            </Text>
            <View style={styles.loadingDots}>
              {[0, 1, 2].map((i) => (
                <LoadingDot key={i} delay={i * 200} />
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function LoadingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  return <Animated.View style={[styles.dot, { opacity: anim }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greetingTextWrap: {
    flex: 1,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: "#fff",
    letterSpacing: -0.3,
  },
  dayTypeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  dayTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  dayTypeBadgeIcon: {
    fontSize: 14,
  },
  dayTypeBadgeText: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  subtitleText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    marginTop: 6,
    fontWeight: "500" as const,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,164,76,0.35)",
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#F0D68A",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  fuelProgressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  fuelProgressTop: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
  },
  fuelProgressCenter: {
    position: "absolute" as const,
    left: 0,
    top: 0,
    width: 92,
    height: 92,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  fuelProgressPct: {
    fontSize: 20,
    fontWeight: "800" as const,
  },
  fuelProgressSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
    marginTop: 2,
  },
  fuelProgressRight: {
    flex: 1,
    marginLeft: 92,
    gap: 6,
  },
  fuelProgressTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  fuelProgressTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  fuelProgressBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.2,
  },
  fuelProgressBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  fuelProgressSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontWeight: "500" as const,
  },
  fuelProgressCtaRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 3,
    marginTop: 2,
  },
  fuelProgressCta: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  fuelSessionsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 14,
    marginBottom: 4,
  },
  fuelSessionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingVertical: 9,
  },
  fuelSessionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  fuelSessionName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  fuelSessionNameDone: {
    color: Colors.textTertiary,
    textDecorationLine: "line-through" as const,
  },
  fuelSessionMeta: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  prefsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  prefsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  prefsTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  editLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editLinkText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  pillsScroll: {
    marginHorizontal: -4,
  },
  pillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  pill: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  pillDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textTertiary,
  },
  dayFuelCard: {
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden" as const,
  },
  dayFuelGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  dayFuelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  dayFuelIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  dayFuelText: {
    flex: 1,
    gap: 2,
  },
  dayFuelTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  dayFuelSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  hydrationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  hydrationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  hydrationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hydrationTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  addWaterBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addWaterBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#0F1115",
  },
  hydrationBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ringContainer: {
    width: 96,
    height: 96,
    justifyContent: "center",
    alignItems: "center",
  },
  ringOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.surfaceElevated,
    overflow: "hidden" as const,
    justifyContent: "center",
    alignItems: "center",
  },
  ringBg: {
    position: "absolute" as const,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 8,
    borderColor: Colors.surfaceElevated,
  },
  ringFillView: {
    height: 84,
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },
  ringCenter: {
    position: "absolute" as const,
    alignItems: "center",
  },
  ringValue: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  ringUnit: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  hydrationRight: {
    flex: 1,
    gap: 8,
  },
  glassesRow: {
    flexDirection: "row",
    flexWrap: "wrap" as const,
    gap: 4,
  },
  glassIcon: {
    padding: 2,
  },
  glassEmoji: {
    fontSize: 22,
    opacity: 0.4,
  },
  glassEmojiFilled: {
    opacity: 1,
  },
  hydrationNote: {
    fontSize: 12,
    color: Colors.warning,
    fontStyle: "italic" as const,
    lineHeight: 16,
  },
  tipCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.premiumGold,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: "500" as const,
  },
  quickAccessRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  quickAccessCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAccessIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  quickAccessTextWrap: {
    flex: 1,
    gap: 1,
  },
  quickAccessLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  quickAccessCount: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  optionsSection: {
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  optionHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
  },
  optionBtnTextActive: {
    color: Colors.primary,
  },
  cookingToggleCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  cookingToggleLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  cookingToggleLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  cookingToggleRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  cookingActiveChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cookingActiveChipText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  cookingToggleArrow: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginLeft: 2,
  },
  cookingPrefsPanel: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    gap: 14,
  },
  cookingSection: {
    gap: 8,
  },
  cookingSectionLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  cookingChipRow: {
    flexDirection: "row" as const,
    gap: 6,
    flexWrap: "wrap" as const,
  },
  cookingChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cookingChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  cookingChipIcon: {
    fontSize: 14,
  },
  cookingChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  cookingChipTextActive: {
    color: Colors.primary,
  },
  cookingToggleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 4,
  },
  cookingToggleTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  cookingToggleLabelRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  cookingToggleRowLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  cookingToggleRowSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: "center" as const,
    paddingHorizontal: 3,
  },
  toggleSwitchOn: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  toggleThumbOn: {
    alignSelf: "flex-end" as const,
  },
  generateSection: {
    gap: 12,
    marginTop: 4,
  },
  generateCard: {
    borderRadius: 18,
    padding: 18,
  },
  generateCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  generateIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  generateTextWrap: {
    flex: 1,
    gap: 3,
  },
  generateTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  generateTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  generateSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500" as const,
  },
  freeBadge: {
    backgroundColor: "rgba(15,17,21,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: "800" as const,
    color: "#0F1115",
  },
  proBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(212,164,76,0.2)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212,164,76,0.3)",
  },
  proBadgeSmallText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#D4A44C",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 36,
    alignItems: "center",
    gap: 14,
    width: "100%",
  },
  loadingIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center" as const,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 20,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
