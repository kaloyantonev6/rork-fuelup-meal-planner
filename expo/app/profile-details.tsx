import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  User,
  Flame,
  Weight,
  Ruler,
  Activity,
  Target,
  Trophy,
  X,
  Check,
  Pencil,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import {
  FOOTBALL_POSITIONS,
  TRAINING_FREQUENCIES,
  SEASON_PHASES,
  PERFORMANCE_GOALS,
  goalLabelForAge,
  GENDER_OPTIONS,
} from "@/constants/onboarding";
import {
  Gender,
  FootballPosition,
  TrainingFrequency,
  SeasonPhase,
  PerformanceGoal,
} from "@/types";

type EditField =
  | "name"
  | "gender"
  | "age"
  | "weight"
  | "height"
  | "footballPosition"
  | "trainingFrequency"
  | "seasonPhase"
  | "performanceGoal"
  | null;

interface OptionItem {
  id: string;
  label: string;
  icon?: string;
  desc?: string;
}

/**
 * Player Profile detail screen — the full Body Profile and Football Profile
 * rows with their edit sheets live here; the Profile tab shows only a compact
 * summary card that pushes into this screen.
 */
export default function ProfileDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile } = useMealPlan();

  const [editField, setEditField] = useState<EditField>(null);
  const [textValue, setTextValue] = useState("");

  const positionLabel = FOOTBALL_POSITIONS.find((p) => p.id === profile.position)?.label;
  const perfGoalLabelMatch = PERFORMANCE_GOALS.find((p) => p.id === profile.performanceGoal);
  const perfGoalLabel = perfGoalLabelMatch
    ? goalLabelForAge(perfGoalLabelMatch.id, perfGoalLabelMatch.label, profile.age)
    : undefined;

  const openEditor = useCallback(
    (field: EditField) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (field === "name") setTextValue(profile.name);
      else if (field === "age") setTextValue(String(profile.age || ""));
      else if (field === "weight") setTextValue(String(profile.weight || ""));
      else if (field === "height") setTextValue(String(profile.height || ""));
      setEditField(field);
    },
    [profile],
  );

  const closeEditor = useCallback(() => {
    setEditField(null);
    setTextValue("");
  }, []);

  const saveTextValue = useCallback(() => {
    if (editField === "name") {
      updateProfile({ name: textValue.trim() });
    } else if (editField === "age") {
      const val = parseInt(textValue, 10);
      if (val > 0) updateProfile({ age: val });
    } else if (editField === "weight") {
      const val = parseInt(textValue, 10);
      if (val > 0) updateProfile({ weight: val });
    } else if (editField === "height") {
      const val = parseInt(textValue, 10);
      if (val > 0) updateProfile({ height: val });
    }
    closeEditor();
  }, [editField, textValue, updateProfile, closeEditor]);

  const selectOption = useCallback(
    (field: EditField, value: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      switch (field) {
        case "gender":
          updateProfile({ gender: value as Gender });
          break;
        case "footballPosition":
          updateProfile({ position: value as FootballPosition });
          break;
        case "trainingFrequency":
          updateProfile({ trainingFrequency: value as TrainingFrequency });
          break;
        case "seasonPhase":
          updateProfile({ seasonPhase: value as SeasonPhase });
          break;
        case "performanceGoal":
          updateProfile({ performanceGoal: value as PerformanceGoal });
          break;
      }
      closeEditor();
    },
    [updateProfile, closeEditor],
  );

  const isTextEditor =
    editField === "name" || editField === "age" || editField === "weight" || editField === "height";

  const getOptionsForField = (): OptionItem[] => {
    switch (editField) {
      case "gender":
        return GENDER_OPTIONS.map((g) => ({ id: g.id, label: g.label, icon: g.icon }));
      case "footballPosition":
        return FOOTBALL_POSITIONS.map((p) => ({ id: p.id, label: p.label, icon: p.icon, desc: p.desc }));
      case "trainingFrequency":
        return TRAINING_FREQUENCIES.map((t) => ({ id: t.id, label: t.label, icon: t.icon, desc: t.desc }));
      case "seasonPhase":
        return SEASON_PHASES.map((s) => ({ id: s.id, label: s.label, icon: s.icon, desc: s.desc }));
      case "performanceGoal":
        // Randell 2021: no weight-loss / body-comp goals for female users
        return PERFORMANCE_GOALS.filter((p) => !(profile.gender === "female" && p.id === "lean_fast")).map(
          (p) => ({
            id: p.id,
            label: goalLabelForAge(p.id, p.label, profile.age),
            icon: p.icon,
            desc: p.desc,
          }),
        );
      default:
        return [];
    }
  };

  const getSelectedValue = (): string => {
    switch (editField) {
      case "gender":
        return profile.gender;
      case "footballPosition":
        return profile.position ?? "";
      case "trainingFrequency":
        return profile.trainingFrequency ?? "";
      case "seasonPhase":
        return profile.seasonPhase ?? "";
      case "performanceGoal":
        return profile.performanceGoal ?? "";
      default:
        return "";
    }
  };

  const getEditorTitle = (): string => {
    switch (editField) {
      case "name":
        return "Edit Name";
      case "gender":
        return "Gender";
      case "age":
        return "Edit Age";
      case "weight":
        return "Edit Weight";
      case "height":
        return "Edit Height";
      case "footballPosition":
        return "Football Position";
      case "trainingFrequency":
        return "Training Frequency";
      case "seasonPhase":
        return "Season Phase";
      case "performanceGoal":
        return "Performance Goal";
      default:
        return "";
    }
  };

  const renderEditorContent = () => {
    if (isTextEditor) {
      const keyboardType = editField === "name" ? ("default" as const) : ("number-pad" as const);
      const placeholder =
        editField === "name"
          ? "Your name"
          : editField === "age"
            ? "e.g. 25"
            : editField === "weight"
              ? "e.g. 70"
              : "e.g. 175";
      const suffix =
        editField === "age" ? " years" : editField === "weight" ? " kg" : editField === "height" ? " cm" : "";

      return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.editorBody}>
            <View style={styles.textInputRow}>
              <TextInput
                style={styles.editorInput}
                value={textValue}
                onChangeText={(v) => {
                  if (editField === "name") setTextValue(v);
                  else setTextValue(v.replace(/[^0-9]/g, ""));
                }}
                keyboardType={keyboardType}
                placeholder={placeholder}
                placeholderTextColor={Colors.textTertiary}
                autoFocus
                maxLength={editField === "name" ? 40 : 3}
              />
              {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null}
            </View>
            <Pressable
              onPress={saveTextValue}
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      );
    }

    const options = getOptionsForField();
    const selectedId = getSelectedValue();

    return (
      <View style={styles.editorBody}>
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => selectOption(editField, opt.id)}
              style={[styles.optionRow, isSelected && styles.optionRowSelected]}
            >
              <View style={styles.optionContent}>
                {opt.icon ? <Text style={styles.optionIcon}>{opt.icon}</Text> : null}
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  {opt.desc ? (
                    <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>
                      {opt.desc}
                    </Text>
                  ) : null}
                </View>
              </View>
              {isSelected && <Check size={18} color={Colors.primary} />}
            </Pressable>
          );
        })}
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Player Profile</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Profile</Text>
          <View style={styles.sectionCard}>
            <PrefRow
              icon={<User size={18} color={Colors.primary} />}
              label="Name"
              value={profile.name || "Not set"}
              onEdit={() => openEditor("name")}
            />
            <View style={styles.divider} />
            <PrefRow
              icon={<User size={18} color="#8B5CF6" />}
              label="Gender"
              value={GENDER_OPTIONS.find((g) => g.id === profile.gender)?.label ?? "Not set"}
              onEdit={() => openEditor("gender")}
            />
            <View style={styles.divider} />
            <PrefRow
              icon={<Flame size={18} color="#EF4444" />}
              label="Age"
              value={profile.age ? `${profile.age} years` : "Not set"}
              onEdit={() => openEditor("age")}
            />
            <View style={styles.divider} />
            <PrefRow
              icon={<Weight size={18} color="#6366F1" />}
              label="Weight"
              value={profile.weight ? `${profile.weight} kg` : "Not set"}
              onEdit={() => openEditor("weight")}
            />
            <View style={styles.divider} />
            <PrefRow
              icon={<Ruler size={18} color="#8B5CF6" />}
              label="Height"
              value={profile.height ? `${profile.height} cm` : "Not set"}
              onEdit={() => openEditor("height")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Football Profile</Text>
          <View style={styles.sectionCard}>
            <PrefRow
              icon={<Activity size={18} color="#F59E0B" />}
              label="Position"
              value={positionLabel ?? "Not set"}
              onEdit={() => openEditor("footballPosition")}
            />
            <View style={styles.divider} />
            <PrefRow
              icon={<Activity size={18} color="#EF4444" />}
              label="Training Frequency"
              value={
                TRAINING_FREQUENCIES.find((t) => t.id === profile.trainingFrequency)?.label ?? "Not set"
              }
              onEdit={() => openEditor("trainingFrequency")}
            />
            <View style={styles.divider} />
            <PrefRow
              icon={<Target size={18} color={Colors.primary} />}
              label="Season Phase"
              value={SEASON_PHASES.find((s) => s.id === profile.seasonPhase)?.label ?? "Not set"}
              onEdit={() => openEditor("seasonPhase")}
            />
            <View style={styles.divider} />
            <PrefRow
              icon={<Trophy size={18} color={Colors.premiumGold} />}
              label="Performance Goal"
              value={perfGoalLabel ?? "Not set"}
              onEdit={() => openEditor("performanceGoal")}
            />
          </View>
        </View>
      </ScrollView>

      <Modal visible={editField !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeEditor} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getEditorTitle()}</Text>
              <Pressable onPress={closeEditor} hitSlop={12}>
                <X size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>
            {renderEditorContent()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PrefRow({
  icon,
  label,
  value,
  onEdit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => [styles.prefRow, pressed && { backgroundColor: Colors.surfaceAlt }]}
    >
      <View style={styles.prefLeft}>
        <View style={styles.prefIconWrap}>{icon}</View>
        <View style={styles.prefTextWrap}>
          <Text style={styles.prefLabel}>{label}</Text>
          <Text style={styles.prefValue} numberOfLines={1}>
            {value}
          </Text>
        </View>
      </View>
      <Pencil size={15} color={Colors.textTertiary} />
    </Pressable>
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
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  prefLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  prefIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  prefTextWrap: {
    flex: 1,
  },
  prefLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  prefValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingTop: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  editorBody: {
    padding: 20,
    gap: 16,
  },
  textInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    paddingHorizontal: 16,
  },
  editorInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    paddingVertical: 16,
  },
  inputSuffix: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
    marginLeft: 4,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textOnAccent,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  optionRowSelected: {
    backgroundColor: Colors.primaryLight,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  optionIcon: {
    fontSize: 18,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
    lineHeight: 16,
  },
  optionDescSelected: {
    color: Colors.primary,
    opacity: 0.7,
  },
});
