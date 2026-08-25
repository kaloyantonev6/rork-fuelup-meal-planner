import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Heart,
  Flame,
  ShoppingCart,
  Clock,
  ChevronRight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { GeneratedPlan, GeneratedMeal, compileShoppingList, ShoppingIngredient } from "@/utils/mealGenerator";
import { useSavedPlans } from "@/providers/SavedPlansProvider";
import { useMealPlan } from "@/providers/MealPlanProvider";
import SmartShoppingList from "@/components/SmartShoppingList";

type TabKey = "meals" | "shopping";

export default function SavedPlanDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { savedPlans, toggleFavorite: toggleFavProvider, isFavorite } = useSavedPlans();
  const { profile } = useMealPlan();

  const plan = useMemo(() => savedPlans.find((p) => p.id === planId), [savedPlans, planId]);

  const [activeTab, setActiveTab] = useState<TabKey>("meals");
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const _shoppingList = useMemo<ShoppingIngredient[]>(() => {
    if (!plan) return [];
    return compileShoppingList(plan.plans);
  }, [plan]);

  const activeDayPlan = useMemo<GeneratedPlan | null>(() => {
    if (!plan) return null;
    return plan.plans[expandedDay] ?? plan.plans[0] ?? null;
  }, [plan, expandedDay]);

  const handleToggleFavorite = useCallback((meal: GeneratedMeal) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavProvider(meal);
  }, [toggleFavProvider]);

  const handleOpenMealDetail = useCallback((meal: GeneratedMeal) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/meal-detail",
      params: {
        meal: JSON.stringify(meal),
        isPremium: profile.isPremium ? "true" : "false",
      },
    });
  }, [router, profile.isPremium]);

  const getMealTypeColor = useCallback((type: string) => {
    switch (type) {
      case "breakfast": return "#F59E0B";
      case "lunch": return "#3B82F6";
      case "dinner": return "#8B5CF6";
      case "snack": return "#10B981";
      default: return Colors.primary;
    }
  }, []);

  const getMealTypeLabel = useCallback((type: string) => {
    switch (type) {
      case "breakfast": return "Breakfast";
      case "lunch": return "Lunch";
      case "dinner": return "Dinner";
      case "snack": return "Snack";
      default: return type;
    }
  }, []);

  if (!plan || !activeDayPlan) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.topBarTitle}>Plan Not Found</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Plan not found</Text>
          <Text style={styles.emptySubtitle}>This saved plan may have been removed.</Text>
        </View>
      </View>
    );
  }

  const calPct = Math.min((activeDayPlan.totalCalories / activeDayPlan.targetCalories) * 100, 100);
  const protPct = Math.min((activeDayPlan.totalProtein / activeDayPlan.targetProtein) * 100, 100);
  const carbsPct = Math.min((activeDayPlan.totalCarbs / activeDayPlan.targetCarbs) * 100, 100);
  const fatPct = Math.min((activeDayPlan.totalFat / activeDayPlan.targetFat) * 100, 100);

  const planType = plan.duration === "7-Day" ? "weekly" : "daily";

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.topBarTitleWrap}>
          <Text style={styles.topBarTitle} numberOfLines={1}>{plan.title}</Text>
          <Text style={styles.topBarSubtitle}>
            {plan.duration} · {plan.mealsPerDay} meals/day
          </Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.macroCard}>
        <View style={styles.macroHeader}>
          <Text style={styles.macroTitle}>Nutrition Summary</Text>
          <View style={styles.calorieBadge}>
            <Flame size={14} color="#FF6B35" />
            <Text style={styles.calorieText}>
              {activeDayPlan.totalCalories} / {activeDayPlan.targetCalories} kcal
            </Text>
          </View>
        </View>
        <View style={styles.macroRows}>
          <MacroBar label="Calories" current={activeDayPlan.totalCalories} target={activeDayPlan.targetCalories} pct={calPct} color="#FF6B35" unit="kcal" />
          <MacroBar label="Protein" current={activeDayPlan.totalProtein} target={activeDayPlan.targetProtein} pct={protPct} color="#E8734A" unit="g" />
          <MacroBar label="Carbs" current={activeDayPlan.totalCarbs} target={activeDayPlan.targetCarbs} pct={carbsPct} color="#4A90D9" unit="g" />
          <MacroBar label="Fat" current={activeDayPlan.totalFat} target={activeDayPlan.targetFat} pct={fatPct} color="#D4A44C" unit="g" />
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setActiveTab("meals")}
          style={[styles.tab, activeTab === "meals" && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === "meals" && styles.tabTextActive]}>
            Meals
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("shopping")}
          style={[styles.tab, activeTab === "shopping" && styles.tabActive]}
        >
          <ShoppingCart size={14} color={activeTab === "shopping" ? Colors.primary : Colors.textTertiary} />
          <Text style={[styles.tabText, activeTab === "shopping" && styles.tabTextActive]}>
            Shopping List
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "meals" ? (
          <>
            {planType === "weekly" && (
              <View style={styles.daySelector}>
                {plan.plans.map((dayPlan, idx) => (
                  <Pressable
                    key={dayPlan.id}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setExpandedDay(idx);
                    }}
                    style={[styles.dayChip, expandedDay === idx && styles.dayChipActive]}
                  >
                    <Text style={[styles.dayChipText, expandedDay === idx && styles.dayChipTextActive]}>
                      {dayPlan.date.split(" - ")[0]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {activeDayPlan.meals.map((meal, idx) => {
              const typeColor = getMealTypeColor(meal.mealType);
              const isFav = isFavorite(meal.id);
              return (
                <Pressable
                  key={`${meal.id}_${meal.mealType}_${idx}`}
                  onPress={() => handleOpenMealDetail(meal)}
                  style={({ pressed }) => [styles.mealCard, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
                >
                  <Image source={{ uri: meal.image }} style={styles.mealImage} contentFit="cover" />
                  <View style={styles.mealBadge}>
                    <View style={[styles.mealTypeBadge, { backgroundColor: typeColor }]}>
                      <Text style={styles.mealTypeText}>{getMealTypeLabel(meal.mealType)}</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleToggleFavorite(meal);
                    }}
                    style={styles.favBtn}
                    hitSlop={8}
                  >
                    <Heart
                      size={20}
                      color={isFav ? "#EF4444" : "rgba(255,255,255,0.8)"}
                      fill={isFav ? "#EF4444" : "transparent"}
                    />
                  </Pressable>
                  <View style={styles.mealContent}>
                    <View style={styles.mealNameRow}>
                      <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                      <ChevronRight size={18} color={Colors.textTertiary} />
                    </View>
                    <View style={styles.mealMeta}>
                      <View style={styles.mealMetaChip}>
                        <Flame size={12} color="#FF6B35" />
                        <Text style={styles.mealMetaText}>{meal.calories} kcal</Text>
                      </View>
                      <View style={styles.mealMetaChip}>
                        <Text style={styles.mealMetaText}>{meal.protein}g protein</Text>
                      </View>
                      {meal.prepTime > 0 && (
                        <View style={styles.mealMetaChip}>
                          <Clock size={12} color={Colors.textTertiary} />
                          <Text style={styles.mealMetaText}>{meal.prepTime} min</Text>
                        </View>
                      )}
                      {meal.ingredients.length <= 5 && (
                        <View style={[styles.mealMetaChip, { backgroundColor: Colors.primaryLight }]}>
                          <Text style={[styles.mealMetaText, { color: Colors.primaryDark }]}>5 ingredients</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </>
        ) : (
          <SmartShoppingList
            plans={plan.plans}
            country={profile.country}
            isPremium={profile.isPremium}
            onUpgrade={() => router.push("/premium")}
            onExport={() => {}}
            isExporting={false}
          />
        )}
      </ScrollView>
    </Animated.View>
  );
}

function MacroBar({
  label,
  current,
  target,
  pct,
  color,
  unit,
}: {
  label: string;
  current: number;
  target: number;
  pct: number;
  color: string;
  unit: string;
}) {
  return (
    <View style={styles.macroBarWrap}>
      <View style={styles.macroBarLabel}>
        <Text style={styles.macroBarName}>{label}</Text>
        <Text style={styles.macroBarValue}>
          {current}{unit} / {target}{unit}
        </Text>
      </View>
      <View style={styles.macroBarTrack}>
        <View style={[styles.macroBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitleWrap: {
    flex: 1,
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  topBarSubtitle: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  macroCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  macroTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  calorieBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  calorieText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#FF6B35",
  },
  macroRows: {
    gap: 10,
  },
  macroBarWrap: {
    gap: 4,
  },
  macroBarLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  macroBarName: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  macroBarValue: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  macroBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    overflow: "hidden",
  },
  macroBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  tabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  daySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  dayChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  dayChipTextActive: {
    color: Colors.primaryDark,
  },
  mealCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  mealImage: {
    width: "100%",
    height: 160,
  },
  mealBadge: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  mealTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  mealTypeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#fff",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  favBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  mealContent: {
    padding: 14,
    gap: 8,
  },
  mealNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mealName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
  },
  mealMeta: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  mealMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mealMetaText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center" as const,
  },
});
