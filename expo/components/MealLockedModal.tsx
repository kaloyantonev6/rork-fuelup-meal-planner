import React, { useEffect, useRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Lock } from "lucide-react-native";
import Colors from "@/constants/colors";

interface MealLockedModalProps {
  visible: boolean;
  mealTitle: string;
  /** HH:mm when the meal's window opens */
  unlockTime: string;
  /** Minutes until the window opens — powers the countdown chip */
  minutesUntil: number;
  onClose: () => void;
}

/** Human countdown like "1h 23m" or "45m". */
function formatCountdown(minutes: number): string {
  if (minutes <= 0) return "";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Small popup shown when a player tries to check off (or skip) a meal before
 * its scheduled window opens. Anti-cheat guard — keeps logging honest.
 */
export default function MealLockedModal({
  visible,
  mealTitle,
  unlockTime,
  minutesUntil,
  onClose,
}: MealLockedModalProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      anim.setValue(0);
    }
  }, [visible, anim]);

  const countdown = formatCountdown(minutesUntil);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: anim,
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
              ],
            },
          ]}
        >
          <Pressable style={styles.cardInner} onPress={() => undefined}>
            <View style={styles.iconWrap}>
              <Lock size={22} color={Colors.primary} strokeWidth={2.4} />
            </View>
            <Text style={styles.title}>Too early to log</Text>
            <Text style={styles.body}>
              <Text style={styles.mealName}>{mealTitle}</Text> unlocks at {unlockTime}. Stay honest —
              fuel goes in on schedule.
            </Text>
            {countdown ? (
              <View style={styles.chip}>
                <Lock size={11} color={Colors.textSecondary} />
                <Text style={styles.chipText}>Opens in {countdown}</Text>
              </View>
            ) : null}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            >
              <Text style={styles.buttonText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
  },
  cardInner: {
    backgroundColor: Colors.bg2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 22,
    alignItems: "center",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(45,212,168,0.12)",
    borderWidth: 1,
    borderColor: "rgba(45,212,168,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },
  mealName: {
    fontWeight: "700" as const,
    color: Colors.text,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.bg4,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 14,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginTop: 18,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.bg0,
  },
});
