import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Utensils,
  ChefHat,
  Clock,
  Wrench,
  AlertTriangle,
  Sparkles,
  X,
  Check,
  Pencil,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import {
  DIET_TYPES,
  COOKING_SKILLS,
  COOK_TIME_OPTIONS,
  ALLERGY_OPTIONS,
  KITCHEN_EQUIPMENT,
} from "@/constants/onboarding";
import type { CookingSkill } from "@/types";

type EditField = "dietType" | "cookingSkill" | "maxCookTime" | "kitchenEquipment" | "allergies" | null;

interface OptionItem {
  id: string;
  label: string;
  icon?: string;
  desc?: string;
}

/**
 * Nutrition & Cooking detail screen — diet type, cooking skill, max cook time,
 * the no-cook / simple-meals switches, kitchen equipment and allergies live
 * here; the Profile tab shows only a compact summary card that pushes in.
 */
export default function NutritionDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile } = useMealPlan();

  const [editField, setEditField] = useState<EditField>(null);

  const openEditor = useCallback((field: EditField) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditField(field);
  }, []);

  const closeEditor = useCallback(() => {
    setEditField(null);
  }, []);

  const toggleMultiSelect = useCallback(
    (field: "kitchenEquipment" | "allergies", value: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (field === "allergies" && value === "none") {
        const current = profile.allergies;
        updateProfile({ allergies: current.includes("none") ? [] : ["none"] });
        return;
      }
      if (field === "allergies" && profile.allergies.includes("none")) {
        updateProfile({ allergies: [value] });
        return;
      }
      const current = profile[field];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      updateProfile({ [field]: updated });
    },
    [profile, updateProfile],
  );

  const isMultiSelect = editField === "kitchenEquipment" || editField === "allergies";

  const getOptionsForField = (): OptionItem[] => {
    switch (editField) {
      case "dietType":
        return DIET_TYPES.map((d) => ({ id: d.id, label: d.label, icon: d.icon }));
      case "cookingSkill":
        return COOKING_SKILLS.map((c) => ({ id: c.id, label: c.label, icon: c.icon, desc: c.desc }));
      case "maxCookTime":
        return COOK_TIME_OPTIONS.map((c) => ({ id: c.id, label: c.label, icon: c.icon }));
      default:
        return [];
    }
  };

  const getSelectedValue = (): string => {
    switch (editField) {
      case "dietType":
        return profile.dietType;
      case "cookingSkill":
        return profile.cookingSkill;
      case "maxCookTime":
        return profile.maxCookTime ?? "any";
      default:
        return "";
    }
  };

  const getEditorTitle = (): string => {
    switch (editField) {
      case "dietType":
        return "Diet Type";
      case "cookingSkill":
        return "Cooking Skill";
      case "maxCookTime":
        return "Max Cook Time";
      case "kitchenEquipment":
        return "Kitchen Equipment";
      case "allergies":
        return "Allergies";
      default:
        return "";
    }
  };

  const renderEditorContent = () => {
    if (isMultiSelect) {
      const field = editField as "kitchenEquipment" | "allergies";
      const options = field === "kitchenEquipment" ? KITCHEN_EQUIPMENT : ALLERGY_OPTIONS;
      const selected = profile[field];

      return (
        <View style={styles.editorBody}>
          <View style={styles.multiGrid}>
            {options.map((opt) => {
              const isSelected = selected.includes(opt.id);
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => toggleMultiSelect(field, opt.id)}
                  style={[styles.multiChip, isSelected && styles.multiChipSelected]}
                >
                  <Text style={styles.multiChipIcon}>{opt.icon}</Text>
                  <Text style={[styles.multiChipLabel, isSelected && styles.multiChipLabelSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.multiChipCheck}>
                      <Check size={12} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={closeEditor}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.saveBtnText}>Done</Text>
          </Pressable>
        </View>
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
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (editField === "dietType") updateProfile({ dietType: opt.id });
                else if (editField === "cookingSkill") updateProfile({ cookingSkill: opt.id as CookingSkill });
                else if (editField === "maxCookTime")
                  updateProfile({ maxCookTime: opt.id as "any" | "under_15" | "under_30" | "under_45" });
                closeEditor();
              }}
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
        <Text style={styles.headerTitle}>Nutrition & Cooking</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <PrefRow
            icon={<Utensils size={18} color={Colors.accent} />}
            label="Diet Type"
            value={DIET_TYPES.find((d) => d.id === profile.dietType)?.label ?? "Not set"}
            onEdit={() => openEditor("dietType")}
          />
          <View style={styles.divider} />
          <PrefRow
            icon={<ChefHat size={18} color="#F59E0B" />}
            label="Cooking Skill"
            value={COOKING_SKILLS.find((c) => c.id === profile.cookingSkill)?.label ?? "Not set"}
            onEdit={() => openEditor("cookingSkill")}
          />
          <View style={styles.divider} />
          <PrefRow
            icon={<Clock size={18} color="#3B82F6" />}
            label="Max Cook Time"
            value={
              COOK_TIME_OPTIONS.find((c) => c.id === (profile.maxCookTime ?? "any"))?.label ?? "Any time"
            }
            onEdit={() => openEditor("maxCookTime")}
          />
          <View style={styles.divider} />
          <SwitchRow
            icon={<ChefHat size={18} color="#10B981" />}
            label="No-Cook Only"
            sublabel="Assembly-only meals"
            value={profile.noCookOnly ?? false}
            onChange={(v) => updateProfile({ noCookOnly: v })}
          />
          <View style={styles.divider} />
          <SwitchRow
            icon={<Sparkles size={18} color={Colors.premiumGold} />}
            label="Simple Meals Only"
            sublabel="Max 5 ingredients"
            value={profile.maxFiveIngredients ?? false}
            onChange={(v) => updateProfile({ maxFiveIngredients: v })}
          />
          <View style={styles.divider} />
          <PrefRow
            icon={<Wrench size={18} color="#64748B" />}
            label="Kitchen Equipment"
            value={
              profile.kitchenEquipment.length > 0
                ? profile.kitchenEquipment
                    .map((id) => KITCHEN_EQUIPMENT.find((k) => k.id === id)?.label ?? id)
                    .join(", ")
                : "Not set"
            }
            onEdit={() => openEditor("kitchenEquipment")}
          />
          <View style={styles.divider} />
          <PrefRow
            icon={<AlertTriangle size={18} color="#EF4444" />}
            label="Allergies"
            value={
              profile.allergies.length > 0
                ? profile.allergies
                    .map((id) => ALLERGY_OPTIONS.find((a) => a.id === id)?.label ?? id)
                    .join(", ")
                : "None"
            }
            onEdit={() => openEditor("allergies")}
          />
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

function SwitchRow({
  icon,
  label,
  sublabel,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefLeft}>
        <View style={styles.prefIconWrap}>{icon}</View>
        <View style={styles.prefTextWrap}>
          <Text style={styles.prefLabel}>{label}</Text>
          <Text style={styles.prefValue}>{sublabel}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange(v);
        }}
        trackColor={{ false: Colors.border, true: Colors.primaryLight }}
        thumbColor="#fff"
      />
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
    paddingHorizontal: 20,
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
  multiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  multiChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multiChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  multiChipIcon: {
    fontSize: 14,
  },
  multiChipLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  multiChipLabelSelected: {
    color: Colors.primary,
  },
  multiChipCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
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
