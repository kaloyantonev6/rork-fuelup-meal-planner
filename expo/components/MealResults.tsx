import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Lock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Heart,
  Flame,
  ShoppingCart,
  Check,
  Crown,
  Clock,
  FileText,
  ChevronRight,
  Trophy,
  Activity,
  Battery,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { GeneratedPlan, GeneratedMeal, ShoppingIngredient } from "@/utils/mealGenerator";
import { useSavedPlans } from "@/providers/SavedPlansProvider";
import { exportMealPlanPDF, exportShoppingListPDF } from "@/lib/exportPDF";
import SmartShoppingList from "@/components/SmartShoppingList";

interface MealResultsProps {
  plans: GeneratedPlan[];
  shoppingList: ShoppingIngredient[];
  planType: "daily" | "weekly";
  isPremium: boolean;
  country: string;
  onBack: () => void;
  onUpgrade: () => void;
}

type TabKey = "meals" | "shopping";

export default function MealResults({
  plans,
  shoppingList: _shoppingList,
  planType,
  isPremium,
  country,
  onBack,
  onUpgrade,
}: MealResultsProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savePlan, toggleFavorite: toggleFavProvider, isFavorite } = useSavedPlans();
  const [activeTab, setActiveTab] = useState<TabKey>("meals");
  const [isSaved, setIsSaved] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const saveScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const activePlan = plans[expandedDay] ?? plans[0];
  if (!activePlan) return null;

  const calPct = Math.min((activePlan.totalCalories / activePlan.targetCalories) * 100, 100);
  const protPct = Math.min((activePlan.totalProtein / activePlan.targetProtein) * 100, 100);
  const carbsPct = Math.min((activePlan.totalCarbs / activePlan.targetCarbs) * 100, 100);
  const fatPct = Math.min((activePlan.totalFat / activePlan.targetFat) * 100, 100);

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
        isPremium: isPremium ? "true" : "false",
      },
    });
  }, [router, isPremium]);

  const [showLimitModal, setShowLimitModal] = useState(false);
  const [daysUntilReset, setDaysUntilReset] = useState(0);

  const handleSave = useCallback(async () => {
    if (!isPremium) {
      try {
        const saveCountStr = await AsyncStorage.getItem("weekly_save_count");
        const lastResetStr = await AsyncStorage.getItem("weekly_save_reset");
        const now = new Date();
        let count = 0;

        if (lastResetStr) {
          const lastReset = new Date(lastResetStr);
          const diffMs = now.getTime() - lastReset.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays >= 7) {
            count = 0;
            await AsyncStorage.setItem("weekly_save_reset", now.toISOString());
            await AsyncStorage.setItem("weekly_save_count", "0");
          } else {
            count = saveCountStr ? parseInt(saveCountStr, 10) : 0;
            if (count >= 2) {
              const remaining = Math.ceil(7 - diffDays);
              setDaysUntilReset(remaining);
              setShowLimitModal(true);
              console.log("[SaveLimit] Free user blocked. Saves this week:", count, "Days until reset:", remaining);
              return;
            }
          }
        } else {
          await AsyncStorage.setItem("weekly_save_reset", now.toISOString());
        }

        await AsyncStorage.setItem("weekly_save_count", String(count + 1));
        console.log("[SaveLimit] Free user save allowed, timestamp stored.");
      } catch (e) {
        console.log("[SaveLimit] Error checking save limit:", e);
      }
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.spring(saveScaleAnim, { toValue: 0.9, friction: 5, useNativeDriver: true }),
      Animated.spring(saveScaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
    savePlan(plans, planType);
    setIsSaved(true);
  }, [saveScaleAnim, savePlan, plans, planType, isPremium]);

  const [isExporting, setIsExporting] = useState(false);

  const buildExportPlan = useCallback(() => {
    const allMeals = plans.flatMap(p => p.meals);
    return {
      title: planType === "daily" ? "Today's Meal Plan" : "Weekly Meal Plan",
      meals: allMeals.map(m => ({
        name: m.name,
        mealType: m.mealType,
        type: m.mealType,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        ingredients: m.ingredientQuantities ?? m.ingredients,
        instructions: m.instructions?.join(" ") ?? "",
      })),
    };
  }, [plans, planType]);

  const handleExportMealPlan = useCallback(async () => {
    if (!isPremium) {
      onUpgrade();
      return;
    }
    setIsExporting(true);
    try {
      const exportPlan = buildExportPlan();
      console.log("[PDF] Exporting meal plan...", exportPlan.title);
      await exportMealPlanPDF(exportPlan);
      console.log("[PDF] Meal plan export complete.");
    } catch (e) {
      console.log("[PDF] Export error:", e);
      Alert.alert("Export Error", "Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [isPremium, onUpgrade, buildExportPlan]);

  const handleExportShoppingList = useCallback(async () => {
    if (!isPremium) {
      onUpgrade();
      return;
    }
    setIsExporting(true);
    try {
      const exportPlan = buildExportPlan();
      console.log("[PDF] Exporting shopping list...");
      await exportShoppingListPDF(exportPlan);
      console.log("[PDF] Shopping list export complete.");
    } catch (e) {
      console.log("[PDF] Export error:", e);
      Alert.alert("Export Error", "Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [isPremium, onUpgrade, buildExportPlan]);

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "breakfast": return "#F59E0B";
      case "lunch": return "#3B82F6";
      case "dinner": return "#8B5CF6";
      case "snack": return "#10B981";
      default: return Colors.primary;
    }
  };

  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case "breakfast": return "Breakfast";
      case "lunch": return "Lunch";
      case "dinner": return "Dinner";
      case "snack": return "Snack";
      default: return type;
    }
  };

  const getDayTypeIcon = (dayType: string) => {
    if (dayType === "match") return <Trophy size={14} color="#fff" />;
    if (dayType === "training") return <Activity size={14} color="#fff" />;
    return <Battery size={14} color="#fff" />;
  };

  const getDayTypeColor = (dayType: string) => {
    if (dayType === "match") return "#F59E0B";
    if (dayType === "training") return "#3B82F6";
    return "#10B981";
  };

  const getDayTypeBg = (dayType: string) => {
    if (dayType === "match") return "#F59E0B";
    if (dayType === "training") return "#3B82F6";
    return "#6B7280";
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>
          {planType === "daily" ? "Today's Plan" : "Weekly Plan"}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.macroCard}>
        <View style={styles.macroHeader}>
          <View style={styles.macroTitleWrap}>
            <Text style={styles.macroTitle}>Nutrition Summary</Text>
            {activePlan.dayLabel && (
              <View style={[styles.dayTypeBadge, { backgroundColor: getDayTypeBg(activePlan.dayType) }]}>
                {getDayTypeIcon(activePlan.dayType)}
                <Text style={styles.dayTypeBadgeText}>{activePlan.dayLabel}</Text>
              </View>
            )}
          </View>
          <View style={styles.calorieBadge}>
            <Flame size={14} color="#FF6B35" />
            <Text style={styles.calorieText}>
              {activePlan.totalCalories} / {activePlan.targetCalories} kcal
            </Text>
          </View>
        </View>

        <View style={styles.macroRows}>
          <MacroBar label="Calories" current={activePlan.totalCalories} target={activePlan.targetCalories} pct={calPct} color="#FF6B35" unit="kcal" />
          <MacroBar label="Protein" current={activePlan.totalProtein} target={activePlan.targetProtein} pct={protPct} color="#E8734A" unit="g" />
          <MacroBar label="Carbs" current={activePlan.totalCarbs} target={activePlan.targetCarbs} pct={carbsPct} color="#4A90D9" unit="g" />
          <MacroBar label="Fat" current={activePlan.totalFat} target={activePlan.targetFat} pct={fatPct} color="#D4A44C" unit="g" />
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "meals" ? (
          <>
            {planType === "weekly" && (
              <View style={styles.daySelector}>
                {plans.map((plan, idx) => (
                  <Pressable
                    key={plan.id}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setExpandedDay(idx);
                    }}
                    style={[styles.dayChip, expandedDay === idx && styles.dayChipActive]}
                  >
                    <Text style={[styles.dayChipText, expandedDay === idx && styles.dayChipTextActive]}>
                      {plan.date.split(" - ")[0]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {activePlan.meals.map((meal, idx) => {
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
                    {meal.fuelReason ? (
                      <View style={styles.fuelReasonRow}>
                        <View style={[styles.fuelReasonDot, { backgroundColor: getDayTypeColor(activePlan.dayType) }]} />
                        <Text style={styles.fuelReasonText} numberOfLines={2}>{meal.fuelReason}</Text>
                      </View>
                    ) : null}
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
            plans={plans}
            country={country}
            isPremium={isPremium}
            onUpgrade={onUpgrade}
            onExport={handleExportShoppingList}
            isExporting={isExporting}
          />
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Animated.View style={[styles.saveWrap, { transform: [{ scale: saveScaleAnim }] }]}>
          <Pressable
            onPress={handleSave}
            disabled={isSaved}
            style={({ pressed }) => [
              styles.saveBtn,
              isSaved && styles.saveBtnSaved,
              pressed && !isSaved && { opacity: 0.9 },
            ]}
          >
            {isSaved ? (
              <>
                <Check size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Saved</Text>
              </>
            ) : (
              <Text style={styles.saveBtnText}>Save Plan</Text>
            )}
          </Pressable>
        </Animated.View>

        <Pressable
          onPress={activeTab === "shopping" ? handleExportShoppingList : handleExportMealPlan}
          disabled={isExporting}
          style={({ pressed }) => [styles.exportBtn, pressed && !isExporting && { opacity: 0.7 }, isExporting && { opacity: 0.5 }]}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              {!isPremium && <Crown size={14} color="#D4A44C" />}
              <FileText size={16} color={isPremium ? Colors.primary : "#D4A44C"} />
            </>
          )}
        </Pressable>
      </View>

      <Modal
        visible={showLimitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLimitModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLimitModal(false)}>
          <Pressable style={styles.limitModalCard} onPress={() => {}}>
            <View style={styles.limitIconWrap}>
              <Lock size={28} color={Colors.premiumGold} />
            </View>
            <Text style={styles.limitTitle}>Weekly Save Limit Reached</Text>
            <Text style={styles.limitMessage}>
              Free users can save up to 2 plans per week. Upgrade to Premium for unlimited saves.
            </Text>
            <View style={styles.limitTimerRow}>
              <Clock size={14} color={Colors.textTertiary} />
              <Text style={styles.limitTimerText}>
                Resets in {daysUntilReset} {daysUntilReset === 1 ? "day" : "days"}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setShowLimitModal(false);
                onUpgrade();
              }}
              style={({ pressed }) => [styles.limitUpgradeBtn, pressed && { opacity: 0.9 }]}
            >
              <Crown size={16} color="#fff" />
              <Text style={styles.limitUpgradeBtnText}>Upgrade to Premium</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowLimitModal(false)}
              style={({ pressed }) => [styles.limitLaterBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.limitLaterBtnText}>Maybe Later</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  topBarTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
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
  macroTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    flexWrap: "wrap",
  },
  dayTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dayTypeBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#fff",
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  fuelReasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fuelReasonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  fuelReasonText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
    lineHeight: 17,
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
  shoppingSection: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  shoppingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  shoppingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  shoppingName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  shoppingCount: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 10,
  },
  saveWrap: {
    flex: 1,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnSaved: {
    backgroundColor: "#10B981",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  limitModalCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  limitIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FDF6E3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  limitTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center" as const,
    marginBottom: 8,
  },
  limitMessage: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 20,
    marginBottom: 14,
  },
  limitTimerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 20,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  limitTimerText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  limitUpgradeBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    width: "100%",
    backgroundColor: Colors.premiumGold,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  limitUpgradeBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#fff",
  },
  limitLaterBtn: {
    paddingVertical: 10,
  },
  limitLaterBtnText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: 52,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
