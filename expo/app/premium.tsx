import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  X,
  Crown,
  Check,
  Star,
  Gift,
} from "lucide-react-native";
import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FREE_FEATURES = [
  "1 meal plan per week",
  "Basic hydration tracker",
  "Ingredient substitutes",
  "Performance tips",
  "Shopping list with price comparison",
];

const PRO_FEATURES = [
  "Unlimited AI meal plan generation",
  "Match Day Timeline with personalized fuel schedule",
  "Season Planner (auto-adjusts nutrition by phase)",
  "AI Performance Coach (unlimited messages)",
  "Cooking tutorials for every meal",
  "Unlimited saved meal plans",
  "PDF export for coaches & parents",
  "Advanced hydration protocols",
];

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const isAnnual = billingCycle === "annual";
  const proPrice = isAnnual ? "€34.99" : "€4.99";
  const proBilledLabel = isAnnual ? "Billed annually" : "Billed monthly";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#134A2D", "#1B5E3A", "#2D8B56"]}
        style={[styles.headerBg, { paddingTop: insets.top + 8 }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
        >
          <X size={22} color="rgba(255,255,255,0.8)" />
        </Pressable>

        <Animated.View
          style={[styles.headerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.crownBadge}>
            <Crown size={28} color="#D4A44C" />
          </View>
          <Text style={styles.headerTitle}>FuelUp Pro</Text>
          <Text style={styles.headerSubtitle}>
            Fuel like a pro footballer.{"\n"}Match-day ready, every week.
          </Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toggleContainer}>
          <Pressable
            onPress={() => setBillingCycle("monthly")}
            style={[
              styles.toggleOption,
              billingCycle === "monthly" && styles.toggleOptionActive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                billingCycle === "monthly" && styles.toggleTextActive,
              ]}
            >
              Monthly
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setBillingCycle("annual")}
            style={[
              styles.toggleOption,
              billingCycle === "annual" && styles.toggleOptionActive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                billingCycle === "annual" && styles.toggleTextActive,
              ]}
            >
              Annual
            </Text>
            <View style={styles.savePill}>
              <Text style={styles.savePillText}>Save 42%</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.freeCard}>
            <Text style={styles.freePrice}>€0</Text>
            <Text style={styles.freeSubtext}>Enough for trying out FuelUp</Text>

            <View style={styles.featuresList}>
              {FREE_FEATURES.map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <Check size={15} color={Colors.textSecondary} />
                  <Text style={styles.freeFeatureText}>{f}</Text>
                </View>
              ))}
            </View>

            <View style={styles.currentPlanBtn}>
              <Text style={styles.currentPlanText}>Current Plan</Text>
            </View>
          </View>

          <View style={styles.proCardWrapper}>
            <LinearGradient
              colors={["#2D8B56", "#1B9C4F", "#3ACEA0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.proCardBorder}
            >
              <View style={styles.proCard}>
                <View style={styles.mostPopularBadge}>
                  <Text style={styles.mostPopularText}>MOST POPULAR</Text>
                </View>

                <View style={styles.trialBadge}>
                  <Gift size={13} color="#D4A44C" />
                  <Text style={styles.trialBadgeText}>10-day free trial</Text>
                </View>

                <Text style={styles.proBilledLabel}>{proBilledLabel}</Text>
                <Text style={styles.proPrice}>{proPrice}</Text>
                {isAnnual && (
                  <View style={styles.annualBreakdownRow}>
                    <Text style={styles.annualStrikethrough}>€4.99/month</Text>
                    <Text style={styles.annualPerMonth}>€2.92/month</Text>
                    <View style={styles.annualSaveBadge}>
                      <Text style={styles.annualSaveBadgeText}>Save 42%</Text>
                    </View>
                  </View>
                )}
                <Text style={styles.proSubtext}>Unlock your full performance potential</Text>

                <View style={styles.divider} />

                <View style={styles.highlightFeature}>
                  <Check size={16} color={Colors.primary} />
                  <Text style={styles.highlightFeatureText}>AI Performance Coach</Text>
                  <View style={styles.starBadge}>
                    <Star size={10} color="#D4A44C" fill="#D4A44C" />
                    <Text style={styles.starBadgeText}>#1</Text>
                  </View>
                </View>

                <View style={styles.proFeaturesList}>
                  {PRO_FEATURES.map((f, i) => (
                    <View key={i} style={styles.proFeatureItem}>
                      <Check size={14} color={Colors.primary} />
                      <Text style={styles.proFeatureText}>{f}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={() => router.push({ pathname: "/checkout", params: { plan: billingCycle } })}
                  style={({ pressed }) => [
                    styles.startTrialBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <LinearGradient
                    colors={["#1B9C4F", "#3ACEA0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startTrialGradient}
                  >
                    <Text style={styles.startTrialText}>Start Free Trial</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </View>

        <Text style={styles.legalText}>
          Payment will be charged to your account after the trial period. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
        </Text>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBg: {
    paddingBottom: 26,
    paddingHorizontal: 20,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  headerContent: {
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  crownBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(212,164,76,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(212,164,76,0.3)",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center" as const,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  toggleContainer: {
    flexDirection: "row" as const,
    backgroundColor: "#E8EAED",
    borderRadius: 30,
    padding: 4,
    alignSelf: "center" as const,
    marginBottom: 20,
  },
  toggleOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 26,
  },
  toggleOptionActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.text,
  },
  savePill: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  savePillText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#fff",
  },
  cardsRow: {
    flexDirection: "row" as const,
    gap: 10,
    marginBottom: 20,
  },
  freeCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    minWidth: CARD_WIDTH,
  },
  freePrice: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  freeSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 18,
  },
  featuresList: {
    gap: 12,
    marginBottom: 18,
  },
  featureItem: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 8,
  },
  freeFeatureText: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    lineHeight: 18,
  },
  currentPlanBtn: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center" as const,
    marginTop: "auto" as const,
  },
  currentPlanText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  proCardWrapper: {
    flex: 1,
    minWidth: CARD_WIDTH,
    overflow: "hidden" as const,
  },
  proCardBorder: {
    borderRadius: 16,
    padding: 2,
    overflow: "hidden" as const,
  },
  proCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    overflow: "hidden" as const,
  },
  mostPopularBadge: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    backgroundColor: "#2D8B56",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomLeftRadius: 10,
  },
  mostPopularText: {
    fontSize: 9,
    fontWeight: "800" as const,
    color: "#fff",
    letterSpacing: 0.5,
  },
  trialBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "#F5EDFF",
    alignSelf: "flex-start" as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 10,
  },
  trialBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#7C3AED",
  },
  proBilledLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  proPrice: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  annualBreakdownRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flexWrap: "wrap" as const,
    gap: 4,
    marginBottom: 4,
  },
  annualStrikethrough: {
    fontSize: 12,
    color: Colors.primary,
    textDecorationLine: "line-through" as const,
    opacity: 0.7,
  },
  annualPerMonth: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  annualSaveBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  annualSaveBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#fff",
  },
  proSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  highlightFeature: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexWrap: "wrap" as const,
    gap: 4,
    backgroundColor: "#F5EDFF",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8D9FE",
    marginBottom: 12,
  },
  highlightFeatureText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center" as const,
    flexShrink: 1,
  },
  starBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 2,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  starBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#D4A44C",
  },
  proFeaturesList: {
    gap: 10,
    marginBottom: 16,
  },
  proFeatureItem: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 7,
  },
  proFeatureText: {
    fontSize: 12,
    color: Colors.text,
    flex: 1,
    lineHeight: 17,
  },
  startTrialBtn: {
    borderRadius: 12,
    overflow: "hidden" as const,
  },
  startTrialGradient: {
    paddingVertical: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 12,
  },
  startTrialText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#fff",
  },
  legalText: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: "center" as const,
    lineHeight: 14,
    paddingHorizontal: 10,
  },
});
