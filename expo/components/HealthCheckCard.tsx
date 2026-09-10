import React, { useEffect, useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import {
  REDS_INFO_TEXT,
  REDS_RESPONSE_TEXT,
  REDS_SYMPTOMS,
  markHealthCheckShown,
  shouldShowHealthCheck,
} from "@/lib/youthSafety";
import SourceTag from "@/components/SourceTag";

/**
 * RED-S quick health check (IOC REDs 2023). Appears monthly for adults,
 * fortnightly for under-18s. Never diagnoses — signposts to a professional.
 */
export default function HealthCheckCard({ age }: { age: number }) {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [answered, setAnswered] = useState<"none" | "symptoms" | null>(null);

  useEffect(() => {
    let cancelled = false;
    void shouldShowHealthCheck(age).then((show) => {
      if (cancelled || !show) return;
      setVisible(true);
      // Log that the check was shown so it doesn't repeat inside the interval
      void markHealthCheckShown();
    });
    return () => {
      cancelled = true;
    };
  }, [age]);

  if (!visible) return null;

  const toggleSymptom = (idx: number) => {
    setSelected((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🩺 Quick Health Check</Text>
      <Text style={styles.intro}>
        Under-fuelling can silently harm your health and performance. Have you experienced any of
        these recently?
      </Text>

      {REDS_SYMPTOMS.map((symptom, idx) => {
        const checked = selected.includes(idx);
        return (
          <Pressable
            key={symptom}
            onPress={() => toggleSymptom(idx)}
            style={({ pressed }) => [styles.symptomRow, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.symptomText}>{symptom}</Text>
          </Pressable>
        );
      })}

      {answered === "symptoms" ? (
        <View style={styles.responseBlock}>
          <Text style={styles.responseText}>{REDS_RESPONSE_TEXT}</Text>
          <Text style={styles.responseText}>{REDS_INFO_TEXT}</Text>
          <SourceTag text="IOC REDs Consensus 2023" />
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => setAnswered("none")}
            style={({ pressed }) => [styles.button, styles.buttonSecondary, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.buttonSecondaryText}>None of these</Text>
          </Pressable>
          <Pressable
            onPress={() => setAnswered("symptoms")}
            style={({ pressed }) => [styles.button, styles.buttonPrimary, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.buttonPrimaryText}>I've had 1+</Text>
          </Pressable>
        </View>
      )}

      {answered === "none" ? (
        <Text style={styles.noneText}>Great — keep fuelling well and training consistently.</Text>
      ) : null}
    </View>
  );
}

const AMBER = "#F59E0B";

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: AMBER,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  intro: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  symptomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: AMBER,
    borderColor: AMBER,
  },
  checkMark: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#0A0D11",
  },
  symptomText: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: AMBER,
  },
  buttonSecondary: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  buttonPrimaryText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#0A0D11",
  },
  buttonSecondaryText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  responseBlock: {
    marginTop: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  responseText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
  },
  noneText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
});
