import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Animated,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Wallet,
  Plus,
  Trash2,
  Pencil,
  TrendingDown,
  Clock,
  ChevronDown,
  ChevronUp,
  Lock,
  Crown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useBudget, WeeklyBudgetSummary } from "@/providers/BudgetProvider";

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useMealPlan();
  const {
    weeklyBudget,
    updateBudget,
    purchases,
    addPurchase,
    deletePurchase,
    weeklyHistory,
    totalSpent,
    remaining,
    spentPercentage,
    progressColor,
    dailyAverage,
    projectedTotal,
    costPerMeal,
    daysElapsed,
    currentWeekRange,
  } = useBudget();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const [newStoreName, setNewStoreName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editBudgetValue, setEditBudgetValue] = useState("");

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isPremium = profile.isPremium;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: Math.min(spentPercentage, 100) / 100,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, [spentPercentage, fadeAnim, progressAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.min(spentPercentage, 100) / 100,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [spentPercentage, progressAnim]);

  const handleAddPurchase = useCallback(() => {
    const amount = parseFloat(newAmount);
    if (!newStoreName.trim() || isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Input", "Please enter a store name and valid amount.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addPurchase({
      storeName: newStoreName.trim(),
      amount,
      date: new Date().toISOString().split("T")[0],
      note: newNote.trim() || undefined,
    });
    setNewStoreName("");
    setNewAmount("");
    setNewNote("");
    setShowAddModal(false);

    const newSpentPercentage = ((totalSpent + amount) / weeklyBudget) * 100;
    if (newSpentPercentage >= 75 && spentPercentage < 75) {
      setTimeout(() => {
        Alert.alert(
          "Budget Warning",
          "Heads up! You've used 75% of your weekly budget.",
          [{ text: "Got it" }]
        );
      }, 500);
    } else if (newSpentPercentage >= 100 && spentPercentage < 100) {
      setTimeout(() => {
        Alert.alert(
          "Over Budget",
          "You've gone over your weekly budget this week.",
          [{ text: "OK" }]
        );
      }, 500);
    }
  }, [newStoreName, newAmount, newNote, addPurchase, totalSpent, weeklyBudget, spentPercentage]);

  const handleSaveBudget = useCallback(() => {
    const val = parseFloat(editBudgetValue);
    if (isNaN(val) || val <= 0) {
      Alert.alert("Invalid", "Please enter a valid budget amount.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateBudget(val);
    setShowEditBudget(false);
  }, [editBudgetValue, updateBudget]);

  const handleDeletePurchase = useCallback(
    (id: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      deletePurchase(id);
    },
    [deletePurchase]
  );

  const toggleWeek = useCallback((weekStart: string) => {
    setExpandedWeeks((prev) => ({ ...prev, [weekStart]: !prev[weekStart] }));
  }, []);

  const getStatusInfo = useCallback((summary: WeeklyBudgetSummary) => {
    const pct = summary.budget > 0 ? (summary.totalSpent / summary.budget) * 100 : 0;
    if (pct > 100) return { label: "Over budget", color: "#EF4444" };
    if (pct > 85) return { label: "On budget", color: "#F59E0B" };
    return { label: "Under budget", color: "#2dd4a8" };
  }, []);

  if (!isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Wallet size={22} color={Colors.primary} />
            <Text style={styles.headerTitle}>Budget</Text>
          </View>
        </View>
        <View style={styles.lockedContainer}>
          <View style={styles.lockedIconWrap}>
            <Lock size={40} color={Colors.textTertiary} />
          </View>
          <Text style={styles.lockedTitle}>Premium Feature</Text>
          <Text style={styles.lockedMessage}>
            Track your weekly grocery spending and stay on budget with the Budget Tracker. Set limits, log purchases, and see exactly where your money goes.
          </Text>
          <Pressable
            onPress={() => router.push("/premium")}
            style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
          >
            <LinearGradient
              colors={["#1B9C4F", "#3ACEA0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeBtnGradient}
            >
              <Crown size={16} color="#fff" />
              <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.maybeLaterBtn}>
            <Text style={styles.maybeLaterText}>Maybe Later</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Wallet size={22} color={Colors.primary} />
            <Text style={styles.headerTitle}>Budget</Text>
          </View>
          <Pressable
            onPress={() => {
              setEditBudgetValue(weeklyBudget.toString());
              setShowEditBudget(true);
            }}
            style={({ pressed }) => [styles.editBudgetBtn, pressed && { opacity: 0.7 }]}
          >
            <Pencil size={14} color={Colors.primary} />
            <Text style={styles.editBudgetText}>Edit</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.budgetCard}>
            <View style={styles.budgetCardHeader}>
              <Text style={styles.budgetPeriod}>{currentWeekRange}</Text>
              <View style={[styles.statusPill, { backgroundColor: progressColor + "20" }]}>
                <Text style={[styles.statusPillText, { color: progressColor }]}>
                  {spentPercentage > 100
                    ? "Over Budget"
                    : spentPercentage > 85
                    ? "Almost Full"
                    : spentPercentage > 60
                    ? "Getting Close"
                    : "On Track"}
                </Text>
              </View>
            </View>

            <View style={styles.budgetAmountRow}>
              <Text style={styles.budgetSpent}>€{totalSpent.toFixed(2)}</Text>
              <Text style={styles.budgetDivider}>/</Text>
              <Text style={styles.budgetTotal}>€{weeklyBudget.toFixed(2)}</Text>
            </View>

            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth,
                    backgroundColor: progressColor,
                  },
                ]}
              />
            </View>

            <Text style={[styles.remainingText, { color: progressColor }]}>
              {remaining >= 0
                ? `€${remaining.toFixed(2)} left this week`
                : `€${Math.abs(remaining).toFixed(2)} over budget`}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Clock size={16} color={Colors.primary} />
              <Text style={styles.summaryValue}>€{dailyAverage.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Daily Avg</Text>
              <Text style={styles.summaryMeta}>Based on {daysElapsed} day{daysElapsed !== 1 ? "s" : ""}</Text>
            </View>

            <View style={styles.summaryCard}>
              {projectedTotal > weeklyBudget ? (
                <AlertTriangle size={16} color="#EF4444" />
              ) : (
                <CheckCircle size={16} color="#2dd4a8" />
              )}
              <Text style={styles.summaryValue}>€{projectedTotal.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Projected</Text>
              <Text
                style={[
                  styles.summaryMeta,
                  { color: projectedTotal > weeklyBudget ? "#EF4444" : "#2dd4a8" },
                ]}
              >
                {projectedTotal > weeklyBudget ? "⚠️ May exceed" : "✅ On track"}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <TrendingDown size={16} color={Colors.accent} />
              <Text style={styles.summaryValue}>€{costPerMeal.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Per Meal</Text>
              <Text style={styles.summaryMeta}>This week</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Purchases</Text>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddModal(true);
              }}
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>

          {purchases.length === 0 ? (
            <View style={styles.emptyState}>
              <Wallet size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No purchases yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap "Add" to log your first grocery purchase this week.
              </Text>
            </View>
          ) : (
            purchases.map((p) => {
              const dayColors = ["#2dd4a8", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#f97316", "#ec4899"];
              const dayOfWeek = new Date(p.date + "T00:00:00").getDay();
              const borderColor = dayColors[dayOfWeek] ?? "#2dd4a8";

              return (
                <View key={p.id} style={[styles.purchaseCard, { borderLeftColor: borderColor }]}>
                  <View style={styles.purchaseMain}>
                    <View style={styles.purchaseInfo}>
                      <Text style={styles.purchaseStore}>{p.storeName}</Text>
                      <View style={styles.purchaseMeta}>
                        <Text style={styles.purchaseDate}>
                          {new Date(p.date + "T00:00:00").toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                        {p.note ? (
                          <Text style={styles.purchaseNote} numberOfLines={1}>
                            • {p.note}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.purchaseRight}>
                      <Text style={styles.purchaseAmount}>€{p.amount.toFixed(2)}</Text>
                      <Pressable
                        onPress={() => handleDeletePurchase(p.id)}
                        hitSlop={8}
                        style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                      >
                        <Trash2 size={14} color={Colors.textTertiary} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {weeklyHistory.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Past Weeks</Text>
              </View>

              {weeklyHistory.map((week) => {
                const status = getStatusInfo(week);
                const pct =
                  week.budget > 0
                    ? Math.min((week.totalSpent / week.budget) * 100, 100)
                    : 0;
                const isExpanded = expandedWeeks[week.weekStart] ?? false;

                const startDate = new Date(week.weekStart + "T00:00:00");
                const endDate = new Date(week.weekEnd + "T00:00:00");
                const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
                const rangeLabel = `${startDate.toLocaleDateString("en-US", opts)} – ${endDate.toLocaleDateString("en-US", opts)}`;

                return (
                  <Pressable
                    key={week.weekStart}
                    onPress={() => toggleWeek(week.weekStart)}
                    style={styles.historyCard}
                  >
                    <View style={styles.historyRow}>
                      <View style={styles.historyLeft}>
                        <Text style={styles.historyRange}>{rangeLabel}</Text>
                        <View style={styles.historyStats}>
                          <Text style={styles.historySpent}>
                            €{week.totalSpent.toFixed(2)} / €{week.budget.toFixed(2)}
                          </Text>
                          <View style={[styles.historyStatusPill, { backgroundColor: status.color + "20" }]}>
                            <Text style={[styles.historyStatusText, { color: status.color }]}>
                              {status.label}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={16} color={Colors.textTertiary} />
                      ) : (
                        <ChevronDown size={16} color={Colors.textTertiary} />
                      )}
                    </View>

                    <View style={styles.historyProgressTrack}>
                      <View
                        style={[
                          styles.historyProgressFill,
                          { width: `${pct}%`, backgroundColor: status.color },
                        ]}
                      />
                    </View>

                    {isExpanded && (
                      <View style={styles.historyDetail}>
                        <Text style={styles.historyDetailText}>
                          {week.purchaseCount} purchase{week.purchaseCount !== 1 ? "s" : ""} •
                          Avg €{(week.totalSpent / Math.max(week.purchaseCount, 1)).toFixed(2)}/purchase
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      <Modal visible={showAddModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Purchase</Text>

            <Text style={styles.inputLabel}>Store Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Lidl, Aldi, Rewe..."
              placeholderTextColor={Colors.textTertiary}
              value={newStoreName}
              onChangeText={setNewStoreName}
              autoFocus
            />

            <Text style={styles.inputLabel}>Amount (€)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.00"
              placeholderTextColor={Colors.textTertiary}
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>Note (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. weekly shop, snacks..."
              placeholderTextColor={Colors.textTertiary}
              value={newNote}
              onChangeText={setNewNote}
              maxLength={50}
            />

            <Pressable
              onPress={handleAddPurchase}
              style={({ pressed }) => [styles.modalAddBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            >
              <Text style={styles.modalAddBtnText}>Add Purchase</Text>
            </Pressable>

            <Pressable onPress={() => setShowAddModal(false)} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showEditBudget} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditBudget(false)}>
          <Pressable style={styles.editBudgetSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Set Weekly Budget</Text>
            <View style={styles.budgetInputRow}>
              <Text style={styles.eurSign}>€</Text>
              <TextInput
                style={styles.budgetInput}
                placeholder="50"
                placeholderTextColor={Colors.textTertiary}
                value={editBudgetValue}
                onChangeText={setEditBudgetValue}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <Pressable
              onPress={handleSaveBudget}
              style={({ pressed }) => [styles.modalAddBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.modalAddBtnText}>Save</Text>
            </Pressable>
            <Pressable onPress={() => setShowEditBudget(false)} style={styles.modalCancelBtn}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  editBudgetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
  },
  editBudgetText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  budgetCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  budgetPeriod: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  budgetAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 14,
  },
  budgetSpent: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -1,
  },
  budgetDivider: {
    fontSize: 24,
    color: Colors.textTertiary,
    fontWeight: "300" as const,
  },
  budgetTotal: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.borderLight,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  remainingText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  summaryMeta: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    maxWidth: 240,
  },
  purchaseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 4,
  },
  purchaseMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  purchaseInfo: {
    flex: 1,
    gap: 4,
  },
  purchaseStore: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  purchaseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  purchaseDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  purchaseNote: {
    fontSize: 12,
    color: Colors.textTertiary,
    flex: 1,
  },
  purchaseRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  purchaseAmount: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyLeft: {
    flex: 1,
    gap: 4,
  },
  historyRange: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  historyStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historySpent: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  historyStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: "700" as const,
  },
  historyProgressTrack: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: "hidden",
  },
  historyProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  historyDetail: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  historyDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  lockedIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  lockedMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 21,
  },
  upgradeBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
    width: "100%",
  },
  upgradeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  upgradeBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#fff",
  },
  maybeLaterBtn: {
    paddingVertical: 10,
  },
  maybeLaterText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  textInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalAddBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  modalAddBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#fff",
  },
  modalCancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.textTertiary,
  },
  editBudgetSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginTop: "auto",
    marginBottom: "auto",
  },
  budgetInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  eurSign: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  budgetInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
