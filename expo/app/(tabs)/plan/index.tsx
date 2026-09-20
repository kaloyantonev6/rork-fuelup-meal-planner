import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { canGenerate, FREE_TIER_LIMIT, incrementGenerationCount } from "@/lib/generationLimit";
import PremiumGate from "@/components/PremiumGate";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  AlertTriangle,
  Bookmark,
  Calendar,
  Check,
  ChevronRight,
  Crown,
  Heart,
  RefreshCw,
  Zap,
} from "lucide-react-native";

import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useToday } from "@/providers/TodayProvider";
import { useNotificationFeed } from "@/providers/NotificationFeedProvider";
import { useMealTracking } from "@/providers/MealTrackingProvider";
import { useSavedPlans } from "@/providers/SavedPlansProvider";
import type { DayType } from "@/types";
import {
  compileShoppingList,
  generateDailyPlan,
  generateWeeklyPlan,
  type GeneratedPlan,
  type ShoppingIngredient,
} from "@/utils/mealGenerator";
import { prefetchMealPlanImages } from "@/lib/pexelsApi";
import { DAY_LETTERS, DAY_TYPE_META, DEFAULT_WEEKLY_SCHEDULE, getMondayIndex } from "@/constants/dayTypes";
import { getMealWindows, MEAL_CATEGORY_META } from "@/constants/mealTimes";
import type { MealCategory } from "@/constants/mealTimes";
import type { GeneratedMeal } from "@/utils/mealGenerator";
import MealResults from "@/components/MealResults";
import WeeklyHistoryStrip from "@/components/WeeklyHistoryStrip";
import Skeleton from "@/components/ui/Skeleton";

/** Filter chips shown above the meal list — "All" plus one per meal category. */
const MEAL_FILTERS: { id: "all" | MealCategory; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "✨" },
  { id: "breakfast", label: "Breakfast", icon: MEAL_CATEGORY_META.breakfast.icon },
  { id: "lunch", label: "Lunch", icon: MEAL_CATEGORY_META.lunch.icon },
  { id: "dinner", label: "Dinner", icon: MEAL_CATEGORY_META.dinner.icon },
  { id: "snack", label: "Snack", icon: MEAL_CATEGORY_META.snack.icon },
];

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
];

interface SwipeableMealRowProps {
  mealTitle: string;
  category: string;
  scheduledTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  isCompleted: boolean;
  isSkipped: boolean;
  onAte: () => void;
  onSkip: () => void;
  onUndo: () => void;
  onOpen: () => void;
}

/**
 * Compact meal row: tap the check circle to mark eaten (tap again to undo),
 * tap the row to open the recipe, swipe right for "Ate it", swipe left for
 * "Skip". Keeps the plan screen compact — no per-meal action buttons.
 */
function SwipeableMealRow({
  mealTitle,
  category,
  scheduledTime,
  calories,
  protein,
  carbs,
  fats,
  isCompleted,
  isSkipped,
  onAte,
  onSkip,
  onUndo,
  onOpen,
}: SwipeableMealRowProps) {
  const meta = MEAL_CATEGORY_META[category as keyof typeof MEAL_CATEGORY_META] ?? {
    icon: "🍽️",
    label: category,
    short: category,
  };
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(0); // -80 (skip open), 0, 80 (ate open)
  const swipeThreshold = 50;

  const close = useCallback(() => {
    openRef.current = 0;
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
  }, [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 12,
      onPanResponderMove: (_e, g) => {
        const clamped = Math.max(-90, Math.min(90, g.dx));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dx > swipeThreshold) {
          openRef.current = 80;
          Animated.spring(translateX, { toValue: 80, useNativeDriver: true, friction: 7 }).start();
        } else if (g.dx < -swipeThreshold) {
          openRef.current = -80;
          Animated.spring(translateX, { toValue: -80, useNativeDriver: true, friction: 7 }).start();
        } else {
          close();
        }
      },
      onPanResponderTerminate: close,
    }),
  ).current;

  const isDone = isCompleted || isSkipped;

  return (
    <View style={styles.swipeWrap}>
      {/* Reveal layer */}
      <View style={styles.revealLeft} pointerEvents={openRef.current > 0 ? "auto" : "none"}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            close();
            onUndo();
          }}
          style={styles.revealBtn}
        >
          <Text style={[styles.revealBtnText, { color: Colors.primary }]}>
            {isSkipped ? "Undo" : "Ate it"}
          </Text>
        </Pressable>
      </View>
      <View style={styles.revealRight} pointerEvents={openRef.current < 0 ? "auto" : "none"}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            close();
            onSkip();
          }}
          style={styles.revealBtn}
        >
          <Text style={styles.revealBtnSkipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Row */}
      <Animated.View style={[styles.mealRow, { transform: [{ translateX }] }]}>
        <Pressable
          onPress={() => {
            if (openRef.current !== 0) {
              close();
              return;
            }
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (isCompleted) {
              onUndo();
            } else {
              onAte();
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          style={styles.checkCircle}
        >
          {isCompleted ? (
            <View style={styles.checkFilled}>
              <Check size={13} color={Colors.textInverse} />
            </View>
          ) : isSkipped ? (
            <View style={styles.checkSkipped}>
              <Text style={styles.checkSkippedText}>–</Text>
            </View>
          ) : (
            <View style={styles.checkEmpty} />
          )}
        </Pressable>

        <Pressable
          style={styles.mealInfo}
          onPress={() => {
            if (openRef.current !== 0) {
              close();
              return;
            }
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpen();
          }}
          {...panResponder.panHandlers}
        >
          <View style={styles.mealTopRow}>
            <Text style={styles.mealCategory}>
              {meta.icon} {meta.label.toUpperCase()}
            </Text>
            <Text style={styles.mealCalories}>{calories} kcal</Text>
          </View>
          <Text style={[styles.mealTitle, isSkipped && styles.mealTitleSkipped]} numberOfLines={1}>
            {mealTitle}
          </Text>
          <Text style={styles.mealMeta}>
            ⏱ {scheduledTime} · P:{protein}g C:{carbs}g F:{fats}g
          </Text>
        </Pressable>

        <ChevronRight size={16} color={Colors.textTertiary} />
      </Animated.View>
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

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, todayPlan } = useMealPlan();
  const { todayData } = useToday();
  const { add: addNotification } = useNotificationFeed();
  const { tracking, customTimes, history, stats, checkoffMeal, skipMeal, undoMeal } =
    useMealTracking();
  const { favorites } = useSavedPlans();

  const dayType: DayType = todayData?.dayType ?? "training";
  const meta = DAY_TYPE_META[dayType];

  // ── Plan generation state (moved from the old home screen) ──
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState<GeneratedPlan[] | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingIngredient[]>([]);
  const [planType, setPlanType] = useState<"daily" | "weekly">("daily");
  const [mealFilter, setMealFilter] = useState<"all" | MealCategory>("all");
  const [currentTip, setCurrentTip] = useState(PERFORMANCE_TIPS[0] ?? "");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  // ── Free-tier generation limit (3 total; premium unlimited) ──
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);
  const [gateVisible, setGateVisible] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const nudgeAnim = useRef(new Animated.Value(0)).current;
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (profile.isPremium) {
      setGateVisible(false);
      return;
    }
    let cancelled = false;
    void canGenerate(profile.isPremium).then((status) => {
      if (cancelled) return;
      setFreeRemaining(status.remaining);
      if (!status.allowed) setGateVisible(true);
    });
    return () => {
      cancelled = true;
    };
  }, [profile.isPremium]);

  useEffect(() => {
    return () => {
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    };
  }, []);

  /** Soft nudge after the 2nd generation — slides down, auto-dismisses after 4s. */
  const triggerNudge = useCallback(() => {
    setShowNudge(true);
    Animated.timing(nudgeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => {
      Animated.timing(nudgeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setShowNudge(false);
      });
    }, 4000);
  }, [nudgeAnim]);

  const handleGenerate = useCallback(
    async (type: "daily" | "weekly") => {
      if (!profile.isPremium && type === "weekly") {
        router.push("/premium");
        return;
      }
      if (!profile.isPremium) {
        const status = await canGenerate(profile.isPremium);
        if (!status.allowed) {
          // Limit reached — replace the screen with the premium gate.
          setGateVisible(true);
          return;
        }
      }

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPlanType(type);
      setIsGenerating(true);

      await new Promise((r) => setTimeout(r, 1800));

      try {
        if (type === "daily") {
          const plan = await generateDailyPlan(profile, 4, null);
          setGeneratedPlans([plan]);
          setShoppingList(compileShoppingList([plan]));
          void prefetchMealPlanImages(
            plan.meals.map((m) => ({ title: m.name, category: m.mealType })),
          ).catch(() => undefined);
        } else {
          const plans = await generateWeeklyPlan(profile, 4, null);
          setGeneratedPlans(plans);
          setShoppingList(compileShoppingList(plans));
          void prefetchMealPlanImages(
            plans.flatMap((p) => p.meals.map((m) => ({ title: m.name, category: m.mealType }))),
          ).catch(() => undefined);
        }
      } catch (e) {
        console.log("[Plan] Generation failed:", e);
        setIsGenerating(false);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
        Alert.alert("Something went wrong", "We couldn't build your plan. Please try again.");
        return;
      }

      setIsGenerating(false);
      // Count only successful generations — failures return above.
      if (!profile.isPremium) {
        const newCount = await incrementGenerationCount();
        setFreeRemaining(Math.max(0, FREE_TIER_LIMIT - newCount));
        if (newCount === FREE_TIER_LIMIT - 1) triggerNudge();
      }
      // Auto-notification: plan is ready (once per day)
      void addNotification(
        {
          type: "meal_plan_ready",
          tab: "reminders",
          title: "Your meal plan is ready",
          message: `Today's ${dayType} meals have been generated.`,
        },
        { dedupePerDay: true },
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    },
    [profile, router, triggerNudge, addNotification, dayType],
  );

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

  // Limit reached — the gate replaces the whole generation screen (no modal).
  if (gateVisible && !profile.isPremium) {
    return <PremiumGate />;
  }

  const windows = tracking ? getMealWindows(customTimes, tracking.dayType) : null;
  const filteredMeals =
    tracking?.meals.filter((m) => mealFilter === "all" || m.category === mealFilter) ?? [];
  const filterEmptyLabel = mealFilter === "all" ? "meal" : MEAL_CATEGORY_META[mealFilter].label.toLowerCase();
  const weeklySchedule: DayType[] =
    profile.weeklySchedule && profile.weeklySchedule.length === 7
      ? profile.weeklySchedule
      : DEFAULT_WEEKLY_SCHEDULE;
  const todayIndex = getMondayIndex();

  /** Maps today's Recipe into the GeneratedMeal shape meal-detail expects. */
  const openMeal = useCallback(
    (category: string) => {
      const recipe = todayPlan.meals[category as keyof typeof todayPlan.meals];
      if (!recipe) return;
      const difficulty =
        recipe.difficulty === "easy" ? "beginner" : recipe.difficulty === "medium" ? "intermediate" : "advanced";
      const meal: GeneratedMeal = {
        id: recipe.id,
        name: recipe.title,
        calories: recipe.nutrition.calories,
        protein: recipe.nutrition.protein,
        carbs: recipe.nutrition.carbs,
        fat: recipe.nutrition.fat,
        ingredients: recipe.ingredients.map((i) => i.name),
        ingredientQuantities: recipe.ingredients.map((i) => `${i.amount}${i.unit}`),
        instructions: recipe.steps,
        nutritionTip: "",
        fuelReason: "",
        prepTime: recipe.duration,
        fiber: recipe.nutrition.fiber,
        dayType,
        difficulty,
        mealType: recipe.mealType,
        image: recipe.image,
        isFavorite: false,
      };
      router.push({
        pathname: "/meal-detail",
        params: { meal: JSON.stringify(meal), isPremium: profile.isPremium ? "true" : "false" },
      });
    },
    [todayPlan, dayType, profile.isPremium, router],
  );

  return (
    <View style={styles.container}>
      {/* Soft nudge — 1 free plan left (slides down from the top) */}
      {showNudge && !profile.isPremium ? (
        <Animated.View
          style={[
            styles.nudgeBanner,
            {
              top: insets.top + 8,
              transform: [
                {
                  translateY: nudgeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-60, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/premium");
            }}
            style={styles.nudgeContent}
          >
            <Crown size={16} color={Colors.primary} />
            <Text style={styles.nudgeText}>1 free plan left — go Premium for unlimited</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Today&apos;s Plan</Text>
            <Text style={styles.headerSubtitle}>
              {todayData?.calorieTarget.toLocaleString() ?? "–"} kcal · P:
              {todayData?.proteinGrams ?? 0}g C:{todayData?.carbsGrams ?? 0}g F:
              {todayData?.fatsGrams ?? 0}g
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/home/favorites" as never);
              }}
              style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
            >
              <Heart size={18} color="#EF4444" />
              {favorites.length > 0 ? <View style={styles.headerDot} /> : null}
            </Pressable>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/home/saved-plans" as never);
              }}
              style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
            >
              <Bookmark size={18} color={Colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => void handleGenerate("daily")}
              style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
            >
              <RefreshCw size={18} color={Colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Day strip */}
        <View style={styles.dayStrip}>
          {weeklySchedule.map((type, i) => {
            const dayMeta = DAY_TYPE_META[type] ?? DAY_TYPE_META.rest;
            const isToday = i === todayIndex;
            return (
              <View key={`strip-${i}`} style={styles.dayStripDay}>
                <View
                  style={[
                    styles.dayStripDot,
                    {
                      backgroundColor: dayMeta.color,
                      width: isToday ? 14 : 10,
                      height: isToday ? 14 : 10,
                      borderRadius: isToday ? 7 : 5,
                      borderWidth: isToday ? 2 : 0,
                      borderColor: Colors.text,
                    },
                  ]}
                />
                <Text style={[styles.dayStripLabel, isToday && styles.dayStripLabelActive]}>
                  {DAY_LETTERS[i]}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Meal-type filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {MEAL_FILTERS.map((f) => {
            const isActive = mealFilter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  if (isActive) return;
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMealFilter(f.id);
                }}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={styles.filterChipIcon}>{f.icon}</Text>
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Meals — compact swipeable rows */}
        {tracking && windows ? (
          <View style={styles.mealsWrap}>
            {filteredMeals.length === 0 ? (
              <View style={styles.filterEmpty}>
                <Text style={styles.filterEmptyText}>
                  No {filterEmptyLabel} meals planned today
                </Text>
              </View>
            ) : (
              filteredMeals.map((meal) => (
              <SwipeableMealRow
                key={meal.mealId}
                mealTitle={meal.mealTitle}
                category={meal.category}
                scheduledTime={meal.scheduledTime}
                calories={meal.calories}
                protein={meal.protein}
                carbs={meal.carbs}
                fats={meal.fats}
                isCompleted={!!meal.completedAt}
                isSkipped={meal.skipped}
                onAte={() => checkoffMeal(meal.mealId)}
                onSkip={() => skipMeal(meal.mealId)}
                onUndo={() => undoMeal(meal.mealId)}
                onOpen={() => openMeal(meal.category)}
              />
              ))
            )}
          </View>
        ) : (
          <View style={styles.skeletonWrap}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <Skeleton width={24} height={24} radius={12} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="60%" height={12} radius={6} />
                  <Skeleton width="85%" height={14} radius={7} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Weekly history */}
        {tracking ? <WeeklyHistoryStrip history={history} today={tracking} /> : null}

        {/* Free-tier warning — one generation left before the limit */}
        {!profile.isPremium && freeRemaining === 1 ? (
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/premium");
            }}
            style={({ pressed }) => [styles.limitWarningBanner, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.limitWarningIconWrap}>
              <AlertTriangle size={16} color={Colors.warning} />
            </View>
            <View style={styles.limitWarningTextWrap}>
              <Text style={styles.limitWarningTitle}>Last free plan</Text>
              <Text style={styles.limitWarningSubtitle}>
                You have 1 meal plan generation left — upgrade for unlimited
              </Text>
            </View>
            <ChevronRight size={16} color={Colors.warning} />
          </Pressable>
        ) : null}

        {/* Generate buttons */}
        <View style={styles.generateSection}>
          <Pressable
            onPress={() => void handleGenerate("daily")}
            style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <View style={styles.generateCard}>
              <View style={styles.generateIconWrap}>
                <Zap size={22} color={Colors.textInverse} />
              </View>
              <View style={styles.generateTextWrap}>
                <Text style={styles.generateTitle}>Generate Today&apos;s Fuel</Text>
                <Text style={styles.generateSubtitle}>Match-day aware daily meal plan</Text>
              </View>
              <ChevronRight size={18} color={Colors.textTertiary} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => void handleGenerate("weekly")}
            style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <View style={[styles.generateCard, styles.generateCardAlt]}>
              <View style={[styles.generateIconWrap, styles.generateIconWrapAlt]}>
                <Calendar size={22} color="#fff" />
              </View>
              <View style={styles.generateTextWrap}>
                <View style={styles.generateTitleRow}>
                  <Text style={styles.generateTitle}>Generate Weekly Plan</Text>
                  {!profile.isPremium ? (
                    <View style={styles.proBadgeSmall}>
                      <Crown size={10} color={Colors.premiumGold} />
                      <Text style={styles.proBadgeSmallText}>PRO</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.generateSubtitle}>7-day plan by training schedule</Text>
              </View>
              <ChevronRight size={18} color={Colors.textTertiary} />
            </View>
          </Pressable>
        </View>

        {/* Free-tier counter — remaining generations at a glance */}
        {!profile.isPremium && freeRemaining !== null ? (
          <View style={styles.counterBar}>
            <View style={styles.counterDots}>
              {Array.from({ length: FREE_TIER_LIMIT }, (_, i) => {
                const used = i < FREE_TIER_LIMIT - freeRemaining;
                return (
                  <View
                    key={`gen-dot-${i}`}
                    style={[
                      styles.counterDot,
                      used ? styles.counterDotUsed : styles.counterDotRemaining,
                    ]}
                  />
                );
              })}
            </View>
            <Text style={[styles.counterText, freeRemaining === 1 && styles.counterTextWarning]}>
              {freeRemaining === 1
                ? "Last free plan — make it count!"
                : `${freeRemaining} of ${FREE_TIER_LIMIT} free plans remaining`}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Generating overlay */}
      <Modal visible={isGenerating} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <Animated.View
            style={[
              styles.loadingCard,
              { opacity: loadingAnim, transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.loadingIconCircle}>
              <Skeleton width={56} height={56} radius={28} />
            </View>
            <Text style={styles.loadingTitle}>Building your fuel plan...</Text>
            <Text style={styles.loadingSubtitle}>{currentTip}</Text>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },

  dayStrip: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  dayStripDay: {
    alignItems: "center",
    gap: 4,
  },
  dayStripDot: {},
  dayStripLabel: {
    fontSize: 10,
    fontWeight: "500" as const,
    color: Colors.textTertiary,
  },
  dayStripLabelActive: {
    color: Colors.text,
    fontWeight: "700" as const,
  },

  filterRow: {
    flexDirection: "row" as const,
    gap: 8,
    paddingBottom: 2,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.accentLight,
  },
  filterChipIcon: {
    fontSize: 13,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  filterEmpty: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 28,
  },
  filterEmptyText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },

  mealsWrap: {
    gap: 8,
    marginBottom: 14,
  },
  swipeWrap: {
    position: "relative",
    justifyContent: "center",
  },
  revealLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: Colors.primaryLight,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 14,
  },
  revealRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: Colors.bg4,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 14,
  },
  revealBtn: {
    paddingVertical: 8,
  },
  revealBtnText: {
    fontSize: 12,
    fontWeight: "800" as const,
  },
  revealBtnSkipText: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: Colors.textSecondary,
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  checkCircle: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  checkEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  checkFilled: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkSkipped: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkSkippedText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textTertiary,
    marginTop: -2,
  },
  mealInfo: {
    flex: 1,
  },
  mealTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  mealCategory: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  mealCalories: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  mealTitleSkipped: {
    textDecorationLine: "line-through" as const,
    color: Colors.textTertiary,
  },
  mealMeta: {
    fontSize: 11,
    color: Colors.textTertiary,
  },

  skeletonWrap: {
    gap: 8,
    marginBottom: 14,
  },
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },

  generateSection: {
    gap: 10,
    marginTop: 4,
  },
  generateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.accentLight,
    borderRadius: 16,
    padding: 14,
  },
  generateCardAlt: {
    backgroundColor: Colors.bg2,
    borderColor: Colors.border,
  },
  generateIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  generateIconWrapAlt: {
    backgroundColor: "#0f766e",
  },
  generateTextWrap: {
    flex: 1,
  },
  generateTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  generateTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  generateSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  proBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(212,164,76,0.12)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(212,164,76,0.35)",
  },
  proBadgeSmallText: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: Colors.premiumGold,
  },

  counterBar: {
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: Colors.bg4,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 5,
  },
  counterDots: {
    flexDirection: "row",
    gap: 6,
  },
  counterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  counterDotUsed: {
    backgroundColor: Colors.primary,
  },
  counterDotRemaining: {
    borderWidth: 1,
    borderColor: Colors.textTertiary,
    backgroundColor: "transparent",
  },
  counterText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  counterTextWarning: {
    color: Colors.warning,
  },

  limitWarningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  limitWarningIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(245,158,11,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  limitWarningTextWrap: {
    flex: 1,
    gap: 2,
  },
  limitWarningTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.warning,
  },
  limitWarningSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  nudgeBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: "rgba(45,212,168,0.3)",
    borderRadius: 12,
    overflow: "hidden",
  },
  nudgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  nudgeText: {
    flex: 1,
    fontSize: 13,
    color: "#B8C0CC",
    lineHeight: 18,
  },

  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: "center",
    width: "100%",
  },
  loadingIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.bg3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  loadingTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  loadingSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 17,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
