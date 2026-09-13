import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import SleepCard from "@/components/SleepCard";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useToday } from "@/providers/TodayProvider";
import { SLEEP_MATCH_EVE_TEXT } from "@/lib/sleepEngine";

/**
 * Sleep detail screen — the full sleep log lives here; the home dashboard shows
 * only a compact mini card that pushes into this screen.
 */
export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useMealPlan();
  const { todayData } = useToday();

  const isMatchEve = todayData?.tomorrow.dayType === "match";

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Sleep</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <SleepCard age={profile.age || 20} />

        {isMatchEve ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>⚽ {SLEEP_MATCH_EVE_TEXT}</Text>
          </View>
        ) : null}

        <Text style={styles.sourceTag}>
          📚 Source: Walsh et al. 2021 — sleep targets 9–11h (&lt;14y), 8–10h (&lt;18y), 7–9h (adults)
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  noteCard: {
    backgroundColor: Colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
    marginTop: 12,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text,
  },
  sourceTag: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontStyle: "italic",
    marginTop: 12,
    textAlign: "center",
  },
});
