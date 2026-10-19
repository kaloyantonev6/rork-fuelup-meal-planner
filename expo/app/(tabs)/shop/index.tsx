import React, { useCallback } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ShoppingBag } from "lucide-react-native";

import Colors from "@/constants/colors";
import { ScreenHeader, HeaderIconButton } from "@/components/ui/Dashboard";
import ScreenBackground from "@/components/ui/ScreenBackground";
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
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Shop"
          subtitle={latestPlan ? latestPlan.title : "Essentials"}
          onBack={null}
          right={
            <HeaderIconButton label="Open meal plan" onPress={() => router.push("/(tabs)/plan" as never)}>
              <ShoppingBag size={18} color={Colors.text} />
            </HeaderIconButton>
          }
        />
        <Text style={styles.subtitle}>Your week, sorted. Less scrolling, more time for your game.</Text>
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
  subtitle: { fontSize: 13, lineHeight: 19, color: Colors.textSecondary, textAlign: "center", marginTop: 4, marginBottom: 18 },
  emptyWrap: { paddingTop: 40 },
});
