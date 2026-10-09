import React, { useCallback } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ShoppingBag } from "lucide-react-native";

import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useSavedPlans } from "@/providers/SavedPlansProvider";
import SmartShoppingList from "@/components/SmartShoppingList";
import EmptyState from "@/components/ui/EmptyState";

/** Shopping essentials grouped by aisle, from the latest saved meal plan. */
export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useMealPlan();
  const { savedPlans } = useSavedPlans();
  const latestPlan = savedPlans[0] ?? null;

  const handleExport = useCallback(() => {
    if (!latestPlan) return;
    const lines = latestPlan.plans.flatMap((p) => p.meals.map((m) => `• ${m.name}`)).join("\n");
    void Share.share({ message: `Fuelify — ${latestPlan.title}\n\n${lines}` }).catch(() => undefined);
  }, [latestPlan]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <View style={styles.headingText}>
            <Text style={styles.eyebrow}>YOUR WEEK, SORTED</Text>
            <Text style={styles.headerTitle}>Shop essentials</Text>
            <Text style={styles.subtitle}>Less scrolling. More time for your game.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open meal plan" onPress={() => router.push("/(tabs)/plan" as never)} style={styles.bag}>
            <ShoppingBag size={24} color={Colors.primary} />
          </Pressable>
        </View>
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
              icon={<ShoppingBag size={48} color={Colors.primary} />}
              title="No shopping list yet"
              subtitle="Generate a meal plan to see your ingredients organised by category, with local price estimates."
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
  container: { flex: 1, backgroundColor: Colors.bg0 },
  content: { paddingHorizontal: 16 },
  heading: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 22 },
  headingText: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.8, color: Colors.primary, marginBottom: 7 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: Colors.text, letterSpacing: -0.8 },
  subtitle: { fontSize: 13, lineHeight: 19, color: Colors.textSecondary, marginTop: 5 },
  bag: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
  emptyWrap: { paddingTop: 40 },
});
