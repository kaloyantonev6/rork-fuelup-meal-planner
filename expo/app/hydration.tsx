import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import ProgressRing from "@/components/ui/ProgressRing";
import SweatTestCard from "@/components/SweatTestCard";
import { useToday } from "@/providers/TodayProvider";
import {
  addWater,
  loadTodayHydration,
  loadTodayHydrationLog,
  type HydrationLogEntry,
} from "@/lib/hydrationStore";
import { getHydrationWarnings } from "@/lib/hydrationEngine";

/**
 * Hydration detail screen — circular ring, quick-add buttons, timestamped log,
 * NATA 2017 warnings and the sweat test. The home dashboard shows only a
 * compact mini card that pushes into this screen.
 */
export default function HydrationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { todayData } = useToday();

  const [hydrationMl, setHydrationMl] = useState(0);
  const [log, setLog] = useState<HydrationLogEntry[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customMl, setCustomMl] = useState("");

  const targetMl = Math.round((todayData?.hydrationTarget ?? 3) * 1000);

  const reload = useCallback(async () => {
    setHydrationMl(await loadTodayHydration());
    setLog(await loadTodayHydrationLog());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const handleAdd = useCallback(
    (ml: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void addWater(ml).then((next) => {
        setHydrationMl(next);
        void loadTodayHydrationLog().then(setLog);
      });
    },
    [],
  );

  const handleCustom = useCallback(() => {
    const ml = parseInt(customMl, 10);
    if (!ml || ml <= 0 || ml > 3000) {
      Alert.alert("Invalid amount", "Enter an amount between 1 and 3000 ml.");
      return;
    }
    setShowCustom(false);
    setCustomMl("");
    handleAdd(ml);
  }, [customMl, handleAdd]);

  const progress = targetMl > 0 ? Math.min(hydrationMl / targetMl, 1) : 0;
  const warnings = getHydrationWarnings(hydrationMl / 1000, todayData?.dayType ?? "training");

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
        <Text style={styles.headerTitle}>Hydration</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Ring */}
        <View style={styles.ringWrap}>
          <ProgressRing
            progress={progress}
            size={170}
            strokeWidth={10}
            color={Colors.primary}
            trackColor={Colors.bg4}
          >
            <View style={styles.ringCenter}>
              <Text style={styles.ringValue}>{(hydrationMl / 1000).toFixed(2)}L</Text>
              <Text style={styles.ringUnit}>/ {(targetMl / 1000).toFixed(1)}L</Text>
            </View>
          </ProgressRing>
          <Text style={styles.ringHint}>
            {progress >= 1 ? "Target hit — nicely done 💧" : `${Math.round(progress * 100)}% of today's target`}
          </Text>
        </View>

        {/* Quick add */}
        <View style={styles.quickRow}>
          <Pressable
            onPress={() => handleAdd(250)}
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
          >
            <Text style={styles.quickBtnText}>+250ml</Text>
          </Pressable>
          <Pressable
            onPress={() => handleAdd(500)}
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
          >
            <Text style={styles.quickBtnText}>+500ml</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCustom(true);
            }}
            style={({ pressed }) => [styles.quickBtnGhost, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.quickBtnGhostText}>Custom</Text>
          </Pressable>
        </View>

        {/* Warnings (NATA 2017) */}
        {warnings.map((w, i) => (
          <View
            key={i}
            style={[styles.warningCard, w.level === "amber" && styles.warningAmber]}
          >
            <Text style={styles.warningText}>{w.text}</Text>
          </View>
        ))}

        {/* Today's log */}
        <View style={styles.logCard}>
          <Text style={styles.logTitle}>Today&apos;s log</Text>
          {log.length === 0 ? (
            <Text style={styles.logEmpty}>No drinks logged yet — tap +250ml to start.</Text>
          ) : (
            [...log].reverse().map((entry, i) => (
              <View key={`${entry.time}-${i}`} style={styles.logRow}>
                <Text style={styles.logTime}>{entry.time}</Text>
                <Text style={styles.logMl}>{entry.ml}ml</Text>
              </View>
            ))
          )}
        </View>

        {/* Sweat test — personal sweat rate */}
        <SweatTestCard />

        <Text style={styles.sourceTag}>
          📚 Source: ACSM 2007 — aim to lose &lt;2% body weight during exercise. Pre-exercise:
          400–600ml, 30 min before.
        </Text>
      </ScrollView>

      {/* Custom amount modal */}
      <Modal visible={showCustom} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCustom(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Custom amount</Text>
            <TextInput
              style={styles.modalInput}
              value={customMl}
              onChangeText={(t) => setCustomMl(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="ml"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
              maxLength={4}
            />
            <Pressable onPress={handleCustom} style={({ pressed }) => [styles.modalSave, pressed && { opacity: 0.9 }]}>
              <Text style={styles.modalSaveText}>Add</Text>
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
  ringWrap: {
    alignItems: "center",
    paddingVertical: 20,
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
  },
  ringValue: {
    fontSize: 30,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  ringUnit: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ringHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.accentLight,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  quickBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  quickBtnGhost: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  quickBtnGhostText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  warningCard: {
    backgroundColor: Colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
    marginBottom: 10,
  },
  warningAmber: {
    borderLeftColor: "#F59E0B",
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text,
  },
  logCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    marginBottom: 14,
  },
  logTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  logEmpty: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logTime: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  logMl: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  sourceTag: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    width: "100%",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    color: Colors.text,
    fontSize: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    textAlign: "center",
    marginBottom: 14,
  },
  modalSave: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
});
