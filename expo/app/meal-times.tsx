import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { ScreenHeader } from "@/components/ui/Dashboard";
import ScreenBackground from "@/components/ui/ScreenBackground";
import MealTimesSettings from "@/components/MealTimesSettings";

/**
 * Meal Times detail screen — per-day-type eating windows, the reminders master
 * toggle and reminder delay live here; the Profile tab shows only a compact
 * summary card that pushes into this screen.
 */
export default function MealTimesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingHorizontal: 16, paddingTop: insets.top + 4 }}>
        <ScreenHeader
          title="Meal Times"
          subtitle="Eating windows"
          onBack={() => router.back()}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <MealTimesSettings />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
  },
  scroll: {
    flex: 1,
  },
});
