import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldAlert } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";

export default function ConsentPendingScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <ShieldAlert size={48} color={Colors.primary} />
      <Text style={styles.title}>Almost there</Text>
      <Text style={styles.body}>
        Since you&apos;re under 16, a parent or guardian needs to approve your
        account before FuelUp can build meal plans or store your details.
        We&apos;ll let you in as soon as that&apos;s confirmed.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={() => signOut()} activeOpacity={0.8}>
        <Text style={styles.btnText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#F0F7F2",
  },
  title: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700" as const,
    fontSize: 15,
  },
});
