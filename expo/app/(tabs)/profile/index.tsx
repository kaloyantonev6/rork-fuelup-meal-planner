import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  LayoutAnimation,
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import {
  Crown,
  Target,
  Utensils,
  Bell,
  Shield,
  CircleHelp as HelpCircle,
  ChevronRight,
  Leaf,
  User,
  Flame,
  Ruler,
  Weight,
  Activity,
  ChefHat,
  Clock,
  MapPin,
  AlertTriangle,
  Wrench,
  X,
  Check,
  Pencil,
  ChevronDown,
  Settings,
  LogOut,
  Sparkles,
  Camera,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useNotifications } from "@/providers/NotificationProvider";

import {
  FOOTBALL_POSITIONS,
  TRAINING_FREQUENCIES,
  SEASON_PHASES,
  PERFORMANCE_GOALS,
  DIET_TYPES,
  ALLERGY_OPTIONS,
  COOKING_SKILLS,
  GENDER_OPTIONS,
  EU_COUNTRIES_WITH_FLAGS,
  COOK_TIME_OPTIONS,
  DAY_TYPE_OPTIONS,
  KITCHEN_EQUIPMENT,
} from "@/constants/onboarding";
import {
  Gender,
  FootballPosition,
  TrainingFrequency,
  SeasonPhase,
  PerformanceGoal,
  CookingSkill,
  DayType,
} from "@/types";
import DailyTargetsCard from "@/components/DailyTargetsCard";

type EditField =
  | "name"
  | "gender"
  | "age"
  | "weight"
  | "height"
  | "dietType"
  | "cookingSkill"
  | "maxCookTime"
  | "kitchenEquipment"
  | "allergies"
  | "country"
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile } = useMealPlan();
  const { signOut: signOutSupabase } = useAuth();
  const { mealRemindersEnabled, setMealRemindersEnabled } = useNotifications();

  const [editField, setEditField] = useState<EditField>(null);
  const [textValue, setTextValue] = useState("");
  const [prefsExpanded, setPrefsExpanded] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const togglePrefs = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPrefsExpanded((prev) => {
      Animated.timing(chevronAnim, {
        toValue: prev ? 0 : 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
      return !prev;
    });
  }, [chevronAnim]);

  const openEditor = useCallback((field: EditField) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (field === "name") setTextValue(profile.name);
    else if (field === "age") setTextValue(String(profile.age || ""));
    else if (field === "weight") setTextValue(String(profile.weight || ""));
    else if (field === "height") setTextValue(String(profile.height || ""));
    setEditField(field);
  }, [profile]);

  const pickProfileImage = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!req.granted) {
          Alert.alert(
            "Photo access needed",
            "Allow photo library access in Settings to choose a profile picture."
          );
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        selectionLimit: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0]?.uri;
        if (uri) updateProfile({ profileImage: uri });
      }
    } catch (e) {
      console.log("Image picker error:", e);
    }
  }, [updateProfile]);

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

  const selectOption = useCallback((field: EditField, value: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (field) {
      case "gender":
        updateProfile({ gender: value as Gender });
        break;
      case "dietType":
        updateProfile({ dietType: value });
        break;
      case "cookingSkill":
        updateProfile({ cookingSkill: value as CookingSkill });
        break;
      case "maxCookTime":
        updateProfile({ maxCookTime: value as "any" | "under_15" | "under_30" | "under_45" });
        break;
      case "country":
        updateProfile({ country: value });
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
  }, [updateProfile, closeEditor]);

  const toggleMultiSelect = useCallback((field: "kitchenEquipment" | "allergies", value: string) => {
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
  }, [profile, updateProfile]);

  const isTextEditor = editField === "name" || editField === "age" || editField === "weight" || editField === "height";

  const getOptionsForField = (): OptionItem[] => {
    switch (editField) {
      case "gender":
        return GENDER_OPTIONS.map((g) => ({ id: g.id, label: g.label, icon: g.icon }));
      case "dietType":
        return DIET_TYPES.map((d) => ({ id: d.id, label: d.label, icon: d.icon }));
      case "cookingSkill":
        return COOKING_SKILLS.map((c) => ({ id: c.id, label: c.label, icon: c.icon, desc: c.desc }));
      case "maxCookTime":
        return COOK_TIME_OPTIONS.map((c) => ({ id: c.id, label: c.label, icon: c.icon }));
      case "footballPosition":
        return FOOTBALL_POSITIONS.map((p) => ({ id: p.id, label: p.label, icon: p.icon, desc: p.desc }));
      case "trainingFrequency":
        return TRAINING_FREQUENCIES.map((t) => ({ id: t.id, label: t.label, icon: t.icon, desc: t.desc }));
      case "seasonPhase":
        return SEASON_PHASES.map((s) => ({ id: s.id, label: s.label, icon: s.icon, desc: s.desc }));
      case "performanceGoal":
        return PERFORMANCE_GOALS.map((p) => ({ id: p.id, label: p.label, icon: p.icon, desc: p.desc }));
      default:
        return [];
    }
  };

  const getSelectedValue = (): string => {
    switch (editField) {
      case "gender": return profile.gender;
      case "dietType": return profile.dietType;
      case "cookingSkill": return profile.cookingSkill;
      case "maxCookTime": return profile.maxCookTime ?? "any";
      case "country": return profile.country;
      case "footballPosition": return profile.position ?? "";
      case "trainingFrequency": return profile.trainingFrequency ?? "";
      case "seasonPhase": return profile.seasonPhase ?? "";
      case "performanceGoal": return profile.performanceGoal ?? "";
      default: return "";
    }
  };

  const getEditorTitle = (): string => {
    switch (editField) {
      case "name": return "Edit Name";
      case "gender": return "Gender";
      case "age": return "Edit Age";
      case "weight": return "Edit Weight";
      case "height": return "Edit Height";
      case "dietType": return "Diet Type";
      case "cookingSkill": return "Cooking Skill";
      case "maxCookTime": return "Max Cook Time";
      case "kitchenEquipment": return "Kitchen Equipment";
      case "allergies": return "Allergies";
      case "country": return "Country";
      case "footballPosition": return "Football Position";
      case "trainingFrequency": return "Training Frequency";
      case "seasonPhase": return "Season Phase";
      case "performanceGoal": return "Performance Goal";
      default: return "";
    }
  };

  const isMultiSelect = editField === "kitchenEquipment" || editField === "allergies";
  const isCountryPicker = editField === "country";
  const isSingleSelect = !isTextEditor && !isMultiSelect && !isCountryPicker && editField !== null;

  const positionLabel = FOOTBALL_POSITIONS.find((p) => p.id === profile.position)?.label;
  const trainingFreqLabel = TRAINING_FREQUENCIES.find((t) => t.id === profile.trainingFrequency)?.label;
  const seasonPhaseLabel = SEASON_PHASES.find((s) => s.id === profile.seasonPhase)?.label;
  const perfGoalLabel = PERFORMANCE_GOALS.find((p) => p.id === profile.performanceGoal)?.label;

  const renderEditorContent = () => {
    if (isTextEditor) {
      const keyboardType = editField === "name" ? "default" as const : "number-pad" as const;
      const placeholder = editField === "name" ? "Your name"
        : editField === "age" ? "e.g. 25"
        : editField === "weight" ? "e.g. 70"
        : "e.g. 175";
      const suffix = editField === "age" ? " years"
        : editField === "weight" ? " kg"
        : editField === "height" ? " cm"
        : "";

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

    if (isCountryPicker) {
      return (
        <FlatList
          data={EU_COUNTRIES_WITH_FLAGS}
          keyExtractor={(item) => item.code}
          style={styles.optionsList}
          renderItem={({ item }) => {
            const selected = profile.country === item.name;
            return (
              <Pressable
                onPress={() => selectOption("country", item.name)}
                style={[styles.optionRow, selected && styles.optionRowSelected]}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionIcon}>{item.flag}</Text>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{item.name}</Text>
                </View>
                {selected && <Check size={18} color={Colors.primary} />}
              </Pressable>
            );
          }}
        />
      );
    }

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

    if (isSingleSelect) {
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
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{opt.label}</Text>
                    {opt.desc ? <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>{opt.desc}</Text> : null}
                  </View>
                </View>
                {isSelected && <Check size={18} color={Colors.primary} />}
              </Pressable>
            );
          })}
        </View>
      );
    }

    return null;
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={pickProfileImage} style={styles.avatarContainer}>
          {profile.profileImage ? (
            <Image source={{ uri: profile.profileImage }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={["#1B5E3A", "#2D8B56"]}
              style={styles.avatar}
            >
              <Leaf size={28} color="#fff" />
            </LinearGradient>
          )}
          <View style={styles.avatarCameraBadge}>
            <Camera size={14} color="#fff" />
          </View>
        </Pressable>
        <Text style={styles.name}>{profile.name || "FuelUp Player"}</Text>
        <Text style={styles.goalText}>
          {FOOTBALL_POSITIONS.find((p) => p.id === profile.position)?.icon ?? "⚽"} {positionLabel ?? "Player"}
        </Text>
      </View>

      {!profile.isPremium && (
        <Pressable
          onPress={() => router.push("/premium")}
          style={({ pressed }) => [styles.premiumCard, pressed && { opacity: 0.9 }]}
        >
          <LinearGradient
            colors={["#D4A44C", "#B8862D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumGradient}
          >
            <Crown size={22} color="#fff" />
            <View style={styles.premiumText}>
              <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumSubtitle}>
                From €2.92/month — unlock match day tools
              </Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </Pressable>
      )}



      <View style={styles.section}>
        <Pressable onPress={togglePrefs} style={styles.folderCard}>
          <View style={styles.folderLeft}>
            <View style={styles.folderIconWrap}>
              <Settings size={20} color={Colors.primary} />
            </View>
            <View style={styles.folderTextWrap}>
              <Text style={styles.folderTitle}>Football Profile</Text>
              <Text style={styles.folderSubtitle}>Performance settings</Text>
            </View>
          </View>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: chevronAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "180deg"],
                  }),
                },
              ],
            }}
          >
            <ChevronDown size={20} color={Colors.textTertiary} />
          </Animated.View>
        </Pressable>

        {prefsExpanded && (
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
            <View style={styles.divider} />
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
              value={trainingFreqLabel ?? "Not set"}
              onEdit={() => openEditor("trainingFrequency")}
            />
            <View style={styles.divider} />
            <PrefRow
              icon={<Target size={18} color={Colors.primary} />}
              label="Season Phase"
              value={seasonPhaseLabel ?? "Not set"}
              onEdit={() => openEditor("seasonPhase")}
            />
            <View style={styles.divider} />
            <PrefRow
              icon={<Target size={18} color={Colors.primary} />}
              label="Performance Goal"
              value={perfGoalLabel ?? "Not set"}
              onEdit={() => openEditor("performanceGoal")}
            />
            <View style={styles.divider} />
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
              value={COOK_TIME_OPTIONS.find((c) => c.id === (profile.maxCookTime ?? "any"))?.label ?? "Any time"}
              onEdit={() => openEditor("maxCookTime")}
            />
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.prefIconWrap}>
                  <ChefHat size={18} color="#10B981" />
                </View>
                <View style={styles.prefTextWrap}>
                  <Text style={styles.prefLabel}>No-Cook Only</Text>
                  <Text style={styles.prefValue}>Assembly-only meals</Text>
                </View>
              </View>
              <Switch
                value={profile.noCookOnly ?? false}
                onValueChange={(v) => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateProfile({ noCookOnly: v });
                }}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.prefIconWrap}>
                  <Sparkles size={18} color={Colors.premiumGold} />
                </View>
                <View style={styles.prefTextWrap}>
                  <Text style={styles.prefLabel}>Simple Meals Only</Text>
                  <Text style={styles.prefValue}>Max 5 ingredients</Text>
                </View>
              </View>
              <Switch
                value={profile.maxFiveIngredients ?? false}
                onValueChange={(v) => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateProfile({ maxFiveIngredients: v });
                }}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor="#fff"
              />
            </View>
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
            <View style={styles.divider} />
            <PrefRow
              icon={<MapPin size={18} color="#10B981" />}
              label="Country"
              value={profile.country || "Not set"}
              onEdit={() => openEditor("country")}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <DailyTargetsCard profile={profile} dayType="training" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={18} color={Colors.textSecondary} />
              <View style={styles.settingLeftText}>
                <Text style={styles.settingLabel}>Meal Reminders</Text>
                <Text style={styles.settingSublabel}>Get notified before each meal</Text>
              </View>
            </View>
            <Switch
              value={mealRemindersEnabled}
              onValueChange={(v) => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMealRemindersEnabled(v);
              }}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={() => router.push('/profile/privacy')}>
            <View style={styles.settingLeft}>
              <Shield size={18} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Privacy</Text>
            </View>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={() => router.push('/profile/help')}>
            <View style={styles.settingLeft}>
              <HelpCircle size={18} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Help & Support</Text>
            </View>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Pressable
          onPress={async () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOutSupabase();
            router.replace("/");
          }}
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.85 }]}
        >
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>FuelUp AI v1.0.0</Text>
      <View style={{ height: 40 }} />

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
    </ScrollView>
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
          <Text style={styles.prefValue} numberOfLines={1}>{value}</Text>
        </View>
      </View>
      <Pencil size={15} color={Colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 20,
    gap: 8,
  },
  avatarContainer: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarCameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  goalText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  premiumCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  premiumGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  premiumSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 10,
  },
  folderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  folderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  folderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  folderTextWrap: {
    gap: 2,
  },
  folderTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  folderSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: "500" as const,
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
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingLeftText: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  settingSublabel: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 14,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 10,
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  optionsList: {
    maxHeight: 400,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionRowSelected: {
    backgroundColor: Colors.primaryLight,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    fontSize: 22,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  optionLabelSelected: {
    color: Colors.primaryDark,
    fontWeight: "600" as const,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  optionDescSelected: {
    color: Colors.primary,
  },
  multiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  multiChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    minWidth: "45%" as unknown as number,
    flex: 1,
  },
  multiChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  multiChipIcon: {
    fontSize: 18,
  },
  multiChipLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    flex: 1,
  },
  multiChipLabelSelected: {
    color: Colors.primaryDark,
  },
  multiChipCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 14,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.error,
  },
});
