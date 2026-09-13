import React, { useCallback, useMemo } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronRight, Wallet } from "lucide-react-native";

import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useBudget } from "@/providers/BudgetProvider";
import { useSavedPlans } from "@/providers/SavedPlansProvider";
import SmartShoppingList from "@/components/SmartShoppingList";
import EmptyState from "@/components/ui/EmptyState";

/**
 * Shop tab — shopping list from the latest saved plan plus the weekly budget
 * summary (the full budget tracker remains at /budget).
 */
export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useMealPlan();
  const { weeklyBudget, totalSpent, remaining } = useBudget();
  const { savedPlans } = useSavedPlans();

  const latestPlan = savedPlans[0] ?? null;

  const spentPct = weeklyBudget > 0 ? Math.min(Math.round((totalSpent / weeklyBudget) * 100), 100) : 0;

  const handleExport = useCallback(() => {
    if (!latestPlan) return;
    const lines = latestPlan.plans
      .flatMap((p) => p.meals.map((m) => `• ${m.name}`))
      .join("\n");
    void Share.share({ message: `FuelUp — ${latestPlan.title}\n\n${lines}` }).catch(() => undefined);
  }, [latestPlan]);

  const budgetAccent = useMemo(() => {
    if (spentPct >= 90) return Colors.error;
    if (spentPct >= 70) return Colors.warning;
    return Colors.primary;
  }, [spentPct]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Shop</Text>

        {/* Budget summary — full tracker at /budget */}
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/budget" as never);
          }}
          style={({ pressed }) => [styles.budgetCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        >
          <View style={styles.budgetIconWrap}>
            <Wallet size={20} color={budgetAccent} />
          </View>
          <View style={styles.budgetText}>
            <Text style={styles.budgetTitle}>Weekly Budget</Text>
            <Text style={styles.budgetValue}>
              €{remaining.toFixed(0)} left of €{weeklyBudget.toFixed(0)}
            </Text>
            <View style={styles.budgetTrack}>
              <View style={[styles.budgetFill, { width: `${spentPct}%`, backgroundColor: budgetAccent }]} />
            </View>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </Pressable>

        {/* Shopping list */}
        {latestPlan ? (
          <SmartShoppingList
            plans={latestPlan.plans}
            country={profile.country}
            isPremium={profile.isPremium}
            onUpgrade={() => router.push("/premium")}
            onExport={handleExport}
            isExporting={false}
          />
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={<Text style={{ fontSize: 48 }}>🛒</Text>}
              title="No shopping list yet"
              subtitle="Generate a meal plan and your smart shopping list will appear here — with prices for your country."
              actionLabel="Go to Plan"
              onAction={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/plan" as never);
              }}
            />
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  budgetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 14,
  },
  budgetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bg3,
    alignItems: "center",
    justifyContent: "center",
  },
  budgetText: {
    flex: 1,
  },
  budgetTitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  budgetValue: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 2,
    marginBottom: 6,
  },
  budgetTrack: {
    height: 5,
    backgroundColor: Colors.bg4,
    borderRadius: 3,
    overflow: "hidden",
  },
  budgetFill: {
    height: 5,
    borderRadius: 3,
  },
  emptyWrap: {
    paddingTop: 40,
  },
});
