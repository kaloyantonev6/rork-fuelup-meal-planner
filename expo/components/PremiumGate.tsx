import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { CheckCircle2, Lock, XCircle } from "lucide-react-native";

import Colors from "@/constants/colors";

/**
 * Full-screen premium gate shown when a free user has used all 3 meal plan
 * generations. Replaces the generation screen content in place (no modal)
 * and routes into the existing checkout flow.
 */

type ComparisonValue = string | boolean;

/** `string` values render as text; booleans render as check/cross icons. */
const COMPARISON_ROWS: { label: string; free: ComparisonValue; premium: ComparisonValue }[] = [
  { label: "Meal plan generations", free: "3 total", premium: "Unlimited" },
  { label: "AI Coach chat", free: "Limited", premium: "Unlimited" },
  { label: "Weekly budget tracker", free: false, premium: true },
  { label: "Cooking tutorials", free: false, premium: true },
  { label: "Meal images", free: false, premium: true },
  { label: "Advanced macros & science notes", free: false, premium: true },
];

function ValueCell({ value }: { value: ComparisonValue }) {
  if (typeof value === "string") {
    return <Text style={styles.rowValue}>{value}</Text>;
  }
  return value ? (
    <CheckCircle2 size={18} color={Colors.primary} />
  ) : (
    <XCircle size={18} color={Colors.textTertiary} />
  );
}

export default function PremiumGate() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const enterAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [enterAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.enterWrap,
            {
              opacity: enterAnim,
              transform: [
                {
                  translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
                },
              ],
            },
          ]}
        >
          {/* Lock */}
          <View style={styles.lockSection}>
            <View style={styles.lockCircle}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Lock size={48} color={Colors.primary} />
              </Animated.View>
            </View>
          </View>

          <Text style={styles.title}>You&apos;ve used all 3 free meal plans</Text>
          <Text style={styles.subtitle}>
            Upgrade to Fuelify Premium to unlock unlimited AI-powered meal plans
          </Text>

          {/* Feature comparison */}
          <View style={styles.compareCard}>
            <View style={styles.compareHeaderRow}>
              <Text style={styles.compareHeaderSpacer} />
              <Text style={styles.compareHeaderFree}>Free</Text>
              <Text style={styles.compareHeaderPremium}>Premium</Text>
            </View>
            {COMPARISON_ROWS.map((row, i) => (
              <View
                key={row.label}
                style={[styles.compareRow, i < COMPARISON_ROWS.length - 1 && styles.compareDivider]}
              >
                <Text style={styles.rowLabel}>{row.label}</Text>
                <View style={styles.rowCell}>
                  <ValueCell value={row.free} />
                </View>
                <View style={styles.rowCell}>
                  <ValueCell value={row.premium} />
                </View>
              </View>
            ))}
          </View>

          {/* Upgrade buttons */}
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/checkout", params: { plan: "monthly" } });
            }}
            style={({ pressed }) => [styles.monthlyBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.monthlyLabel}>Monthly</Text>
            <Text style={styles.monthlyPrice}>€4.99/mo</Text>
          </Pressable>

          <View style={styles.annualWrap}>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({ pathname: "/checkout", params: { plan: "annual" } });
              }}
              style={({ pressed }) => [styles.annualBtn, pressed && { opacity: 0.92 }]}
            >
              <Text style={styles.annualLabel}>Annual</Text>
              <Text style={styles.annualPrice}>€34.99/yr</Text>
            </Pressable>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save 42%</Text>
            </View>
          </View>

          {/* Quiet exit */}
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/home");
            }}
            style={styles.maybeLaterBtn}
          >
            <Text style={styles.maybeLaterText}>Maybe later</Text>
          </Pressable>
        </Animated.View>
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
  enterWrap: {
    flex: 1,
  },

  lockSection: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  lockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(45,212,168,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
    marginTop: 8,
    alignSelf: "center",
    lineHeight: 20,
  },

  compareCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    padding: 20,
    marginVertical: 24,
  },
  compareHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
  },
  compareHeaderSpacer: {
    flex: 1,
  },
  compareHeaderFree: {
    width: 78,
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  compareHeaderPremium: {
    width: 78,
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
    textAlign: "center",
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  compareDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg4,
  },
  rowLabel: {
    flex: 1,
    fontSize: 13,
    color: "#B8C0CC",
    lineHeight: 17,
    paddingRight: 8,
  },
  rowCell: {
    width: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  rowValue: {
    fontSize: 12,
    color: "#B8C0CC",
    textAlign: "center",
  },

  monthlyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.bg4,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 14,
    marginTop: 8,
  },
  monthlyLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  monthlyPrice: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },

  annualWrap: {
    position: "relative",
    marginTop: 8,
  },
  annualBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
  },
  annualLabel: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textOnAccent,
  },
  annualPrice: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textOnAccent,
  },
  savingsBadge: {
    position: "absolute",
    top: -8,
    right: 14,
    backgroundColor: Colors.warning,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.textOnAccent,
  },

  maybeLaterBtn: {
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 44,
    justifyContent: "center",
    marginTop: 8,
  },
  maybeLaterText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
});
