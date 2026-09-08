import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

interface NotificationPermissionModalProps {
  visible: boolean;
  onEnable: () => void;
  onLater: () => void;
}

/**
 * Custom first-run permission prompt (shown before the system dialog): explains
 * meal reminders in football terms. "Maybe Later" defers the ask by 3 days.
 */
export default function NotificationPermissionModal({
  visible,
  onEnable,
  onLater,
}: NotificationPermissionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.icon}>🔔</Text>
          <Text style={styles.title}>Stay on Track with Reminders</Text>
          <Text style={styles.body}>
            FuelUp can remind you when it&apos;s time to eat, so you never miss a meal before
            training or a match.
          </Text>
          <Pressable
            onPress={onEnable}
            style={({ pressed }) => [styles.enableBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.enableText}>Enable Reminders</Text>
          </Pressable>
          <Pressable onPress={onLater} style={styles.laterBtn}>
            <Text style={styles.laterText}>Maybe Later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.bg3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 24,
    alignItems: "center",
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  enableBtn: {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  enableText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textOnAccent,
  },
  laterBtn: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 16,
  },
  laterText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
});
