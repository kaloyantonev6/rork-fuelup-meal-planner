import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Sparkles, Search } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import {
  Gender,
  FootballPosition,
  TrainingFrequency,
  SeasonPhase,
  PerformanceGoal,
  DayType,
  CookingSkill,
} from "@/types";
import {
  EU_COUNTRIES_WITH_FLAGS,
  FOOTBALL_POSITIONS,
  TRAINING_FREQUENCIES,
  SEASON_PHASES,
  PERFORMANCE_GOALS,
  DIET_TYPES,
  ALLERGY_OPTIONS,
  GENDER_OPTIONS,
  COOKING_SKILLS,
  DAY_TYPE_OPTIONS,
  DEFAULT_WEEKLY_SCHEDULE,
} from "@/constants/onboarding";
import { countryNameToCode, getTopRetailers } from "@/lib/priceEngine";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOTAL_STEPS = 7;

interface OnboardingData {
  gender: Gender | null;
  age: string;
  height: string;
  weight: string;
  position: FootballPosition | null;
  trainingFrequency: TrainingFrequency | null;
  seasonPhase: SeasonPhase | null;
  performanceGoal: PerformanceGoal | null;
  dietType: string | null;
  allergies: string[];
  weeklySchedule: DayType[];
  weeklyBudget: number;
  country: string;
  cookingSkill: CookingSkill;
}

const DEFAULT_DATA: OnboardingData = {
  gender: null,
  age: "",
  height: "",
  weight: "",
  position: null,
  trainingFrequency: null,
  seasonPhase: null,
  performanceGoal: null,
  dietType: null,
  allergies: [],
  weeklySchedule: DEFAULT_WEEKLY_SCHEDULE as DayType[],
  weeklyBudget: 35,
  country: "",
  cookingSkill: "beginner",
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { updateProfile, completeOnboarding } = useMealPlan();

  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);

  const animateSlide = useCallback((direction: "forward" | "back", newStep: number) => {
    const exitValue = direction === "forward" ? -SCREEN_WIDTH : SCREEN_WIDTH;
    const enterValue = direction === "forward" ? SCREEN_WIDTH : -SCREEN_WIDTH;

    Animated.timing(slideAnim, {
      toValue: exitValue,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(newStep);
      slideAnim.setValue(enterValue);
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 20,
        tension: 80,
        useNativeDriver: true,
      }).start();
    });

    Animated.timing(progressAnim, {
      toValue: (newStep + 1) / TOTAL_STEPS,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [slideAnim, progressAnim]);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateSlide("forward", step + 1);
    }
  }, [step, animateSlide]);

  const goBack = useCallback(() => {
    if (step > 0) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateSlide("back", step - 1);
    }
  }, [step, animateSlide]);

  const toggleAllergy = useCallback((value: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setData((prev) => {
      if (value === "none") {
        return { ...prev, allergies: prev.allergies.includes("none") ? [] : ["none"] };
      }
      if (prev.allergies.includes("none")) {
        return { ...prev, allergies: [value] };
      }
      const updated = prev.allergies.includes(value)
        ? prev.allergies.filter((v) => v !== value)
        : [...prev.allergies, value];
      return { ...prev, allergies: updated };
    });
  }, []);

  const cycleDayType = useCallback((dayIndex: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setData((prev) => {
      const types: DayType[] = ["training", "match", "rest", "recovery"];
      const current = prev.weeklySchedule[dayIndex] ?? "rest";
      const currentIdx = types.indexOf(current);
      const nextIdx = (currentIdx + 1) % types.length;
      const newSchedule = [...prev.weeklySchedule];
      newSchedule[dayIndex] = types[nextIdx] ?? "rest";
      return { ...prev, weeklySchedule: newSchedule };
    });
  }, []);

  const handleFinish = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const ageNum = parseInt(data.age, 10) || 18;
    const heightNum = parseInt(data.height, 10) || 170;
    const weightNum = parseInt(data.weight, 10) || 70;

    // Map weekly schedule to legacy matchDays format for generator compat
    const matchDayIndices: number[] = [];
    data.weeklySchedule.forEach((dt, idx) => {
      if (dt === "match") matchDayIndices.push(idx);
    });
    const trainingDayCount = data.weeklySchedule.filter((d) => d === "training").length;

    // Map new position to legacy soccerPosition
    const legacyPositionMap: Record<string, string> = {
      goalkeeper: "gk",
      centre_back: "defender",
      full_back: "defender",
      defensive_mid: "midfielder",
      central_mid: "midfielder",
      attacking_mid: "midfielder",
      winger: "forward",
      striker: "forward",
    };

    updateProfile({
      gender: data.gender ?? "other",
      age: ageNum,
      height: heightNum,
      weight: weightNum,
      position: data.position ?? "central_mid",
      // App targets amateur players aspiring to go pro — level is fixed internally
      level: "amateur",
      trainingFrequency: data.trainingFrequency ?? "3-4",
      seasonPhase: data.seasonPhase ?? "in_season",
      performanceGoal: data.performanceGoal ?? "general",
      dietType: data.dietType ?? "balanced",
      dietTypes: data.dietType ? [data.dietType] : ["balanced"],
      allergies: data.allergies.filter((a) => a !== "none"),
      weeklySchedule: data.weeklySchedule,
      defaultKickoffTime: "15:00",
      defaultTrainingTime: "18:00",
      weeklyBudget: data.weeklyBudget,
      country: data.country,
      cookingSkill: data.cookingSkill,
      // Legacy compat
      goal: "maintain",
      activityLevel: "moderate",
      budgetPreference: "moderate",
      kitchenEquipment: ["stovetop", "oven", "pan", "pot", "microwave", "blender"],
      maxCookTime: "any",
      noCookOnly: false,
      maxFiveIngredients: false,
      dietaryPreferences: [],
      budget: "medium",
      calorieTarget: 2500,
      soccerPosition: legacyPositionMap[data.position ?? "central_mid"],
      playerLevel: "amateur",
      trainingDaysPerWeek: trainingDayCount,
      trainingIntensity: "moderate",
      matchDays: matchDayIndices.map((dayOfWeek) => ({ dayOfWeek, timeOfDay: "afternoon" })),
      parentalConsent: ageNum < 16 ? "pending" : "not_required",
      cookAvailability: "quick",
    });
    await completeOnboarding();
    router.replace("/(tabs)/home");
  }, [data, updateProfile, completeOnboarding, router]);

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0: return true;
      case 1:
        return data.gender !== null && data.age.trim().length > 0 &&
          data.height.trim().length > 0 && data.weight.trim().length > 0;
      case 2:
        return data.position !== null && data.trainingFrequency !== null;
      case 3:
        return data.seasonPhase !== null && data.performanceGoal !== null;
      case 4:
        return data.dietType !== null && data.allergies.length > 0;
      case 5:
        return data.weeklySchedule.length === 7;
      case 6:
        return data.country.length > 0;
      default: return false;
    }
  }, [step, data]);

  const renderChip = (
    label: string,
    icon: string,
    isSelected: boolean,
    onPress: () => void,
    desc?: string,
    layout?: "grid3" | "grid2" | "full" | "grid4",
  ) => {
    const chipWidth = layout === "grid3"
      ? Math.floor((SCREEN_WIDTH - 48 - 16) / 3)
      : layout === "grid4"
        ? Math.floor((SCREEN_WIDTH - 48 - 24) / 4)
        : layout === "grid2"
          ? Math.floor((SCREEN_WIDTH - 48 - 8) / 2)
          : undefined;

    return (
      <Pressable
        key={label}
        onPress={onPress}
        style={({ pressed }) => [
          layout === "full" ? styles.chipFull : styles.chip,
          isSelected && styles.chipSelected,
          pressed && { opacity: 0.85 },
          chipWidth ? { width: chipWidth } : undefined,
        ]}
      >
        {icon ? <Text style={styles.chipIcon}>{icon}</Text> : null}
        <View style={layout === "full" ? styles.chipTextWrapFull : styles.chipTextWrap}>
          <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {label}
          </Text>
          {desc ? <Text style={[styles.chipDesc, isSelected && styles.chipDescSelected]} numberOfLines={2}>{desc}</Text> : null}
        </View>
        {isSelected && (
          <View style={styles.chipCheck}>
            <Check size={14} color="#0F1115" />
          </View>
        )}
      </Pressable>
    );
  };

  const countryCode = data.country ? countryNameToCode(data.country) : "DE";
  const topRetailers = getTopRetailers(countryCode);
  const top3Discount = topRetailers.discount.slice(0, 3).join(", ");

  // Step 0 — Welcome
  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeEmoji}>⚽</Text>
        <Text style={styles.welcomeTitle}>FuelUp</Text>
        <Text style={styles.welcomeSubtitle}>AI nutrition built for footballers</Text>
        <View style={styles.welcomeFeatures}>
          <FeatureLine icon="⚽" text="Meal plans adapted to training & match days" />
          <FeatureLine icon="🧠" text="Learn why each meal fuels your performance" />
          <FeatureLine icon="💪" text="Built for performance, not weight loss" />
          <FeatureLine icon="🏆" text="Match day fueling timeline & recovery plans" />
        </View>
      </View>
    </View>
  );

  // Step 1 — Body Profile
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Body Profile</Text>
      <Text style={styles.stepSubtitle}>For calculating your fuel targets — not weight loss</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map((g) =>
            renderChip(g.label, g.icon, data.gender === g.id, () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setData((p) => ({ ...p, gender: g.id as Gender }));
            }, undefined, "grid3")
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. 19"
          placeholderTextColor={Colors.textTertiary}
          value={data.age}
          onChangeText={(v) => setData((p) => ({ ...p, age: v.replace(/[^0-9]/g, "") }))}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 178"
            placeholderTextColor={Colors.textTertiary}
            value={data.height}
            onChangeText={(v) => setData((p) => ({ ...p, height: v.replace(/[^0-9]/g, "") }))}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 72"
            placeholderTextColor={Colors.textTertiary}
            value={data.weight}
            onChangeText={(v) => setData((p) => ({ ...p, weight: v.replace(/[^0-9]/g, "") }))}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
      </View>
    </View>
  );

  // Step 2 — Football Profile
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your Football Profile</Text>
      <Text style={styles.stepSubtitle}>So we can fuel the right position the right way</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Position</Text>
        <View style={styles.chipColumn}>
          {FOOTBALL_POSITIONS.map((pos) =>
            renderChip(pos.label, pos.icon, data.position === pos.id, () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setData((p) => ({ ...p, position: pos.id as FootballPosition }));
            }, pos.desc, "full")
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Training Frequency</Text>
        <View style={styles.chipColumn}>
          {TRAINING_FREQUENCIES.map((tf) =>
            renderChip(tf.label, tf.icon, data.trainingFrequency === tf.id, () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setData((p) => ({ ...p, trainingFrequency: tf.id as TrainingFrequency }));
            }, tf.desc, "full")
          )}
        </View>
      </View>
    </View>
  );

  // Step 3 — Season & Goal
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Season & Goal</Text>
      <Text style={styles.stepSubtitle}>Every option here is about performance, not the scale</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Current Season Phase</Text>
        <View style={styles.chipColumn}>
          {SEASON_PHASES.map((sp) =>
            renderChip(sp.label, sp.icon, data.seasonPhase === sp.id, () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setData((p) => ({ ...p, seasonPhase: sp.id as SeasonPhase }));
            }, sp.desc, "full")
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Performance Goal</Text>
        <View style={styles.chipColumn}>
          {PERFORMANCE_GOALS.map((g) =>
            renderChip(g.label, g.icon, data.performanceGoal === g.id, () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setData((p) => ({ ...p, performanceGoal: g.id as PerformanceGoal }));
            }, g.desc, "full")
          )}
        </View>
      </View>
    </View>
  );

  // Step 4 — Diet & Restrictions
  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Diet & Restrictions</Text>
      <Text style={styles.stepSubtitle}>What you eat and what you avoid</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Diet Type</Text>
        <View style={styles.chipRow}>
          {DIET_TYPES.map((d) =>
            renderChip(d.label, d.icon, data.dietType === d.id, () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setData((p) => ({ ...p, dietType: d.id }));
            }, undefined, "grid2")
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Allergies & Restrictions</Text>
        <View style={styles.chipRow}>
          {ALLERGY_OPTIONS.map((a) =>
            renderChip(a.label, a.icon, data.allergies.includes(a.id), () =>
              toggleAllergy(a.id)
            , undefined, "grid2")
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cooking Skill</Text>
        <View style={styles.chipColumn}>
          {COOKING_SKILLS.map((c) =>
            renderChip(c.label, c.icon, data.cookingSkill === c.id, () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setData((p) => ({ ...p, cookingSkill: c.id as CookingSkill }));
            }, c.desc, "full")
          )}
        </View>
      </View>
    </View>
  );

  // Step 5 — Weekly Schedule
  const renderStep5 = () => {
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Your Typical Week</Text>
        <Text style={styles.stepSubtitle}>Tap each day to set its type — this shapes your fuel plan</Text>

        <View style={styles.scheduleContainer}>
          {dayLabels.map((label, idx) => {
            const dayType = data.weeklySchedule[idx] ?? "rest";
            const dayTypeInfo = DAY_TYPE_OPTIONS.find((d) => d.id === dayType);
            const dayColor = dayTypeInfo?.color ?? Colors.rest;
            return (
              <Pressable
                key={label}
                onPress={() => cycleDayType(idx)}
                style={({ pressed }) => [
                  styles.dayCard,
                  { borderColor: dayColor + "60", backgroundColor: dayColor + "15" },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.dayCardLeft}>
                  <Text style={styles.dayLabel}>{label}</Text>
                  <View style={[styles.dayDot, { backgroundColor: dayColor }]} />
                  <Text style={[styles.dayTypeText, { color: dayColor }]}>
                    {dayType === "training" ? "Training" :
                     dayType === "match" ? "Match Day" :
                     dayType === "recovery" ? "Recovery" : "Rest"}
                  </Text>
                </View>
                <Text style={styles.dayIcon}>
                  {dayType === "training" ? "🟢" :
                   dayType === "match" ? "🔴" :
                   dayType === "recovery" ? "🟡" : "⚪"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.scheduleLegend}>
          <Text style={styles.legendTitle}>Day Types:</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.training }]} />
              <Text style={styles.legendText}>Training</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.match }]} />
              <Text style={styles.legendText}>Match</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.rest }]} />
              <Text style={styles.legendText}>Rest</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.recovery }]} />
              <Text style={styles.legendText}>Recovery</Text>
            </View>
          </View>
          <Text style={styles.legendHint}>Tap a day above to cycle through types</Text>
        </View>
      </View>
    );
  };

  // Step 6 — Budget & Country
  const renderStep6 = () => {
    const dailyBudget = (data.weeklyBudget / 7).toFixed(2);
    const selectedCountry = EU_COUNTRIES_WITH_FLAGS.find((c) => c.name === data.country);

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Budget & Country</Text>
        <Text style={styles.stepSubtitle}>For price comparison and local retailers</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weekly Grocery Budget</Text>
          <View style={styles.budgetCard}>
            <Text style={styles.budgetAmount}>€{data.weeklyBudget}/week</Text>
            <Text style={styles.budgetDaily}>That's about €{dailyBudget}/day</Text>
            <View style={styles.budgetStepperRow}>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setData((p) => ({ ...p, weeklyBudget: Math.max(15, p.weeklyBudget - 5) }));
                }}
                style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <View style={styles.budgetBarWrap}>
                <View style={styles.budgetBarTrack}>
                  <View style={[styles.budgetBarFill, { width: `${((data.weeklyBudget - 15) / 65) * 100}%` }]} />
                </View>
              </View>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setData((p) => ({ ...p, weeklyBudget: Math.min(80, p.weeklyBudget + 5) }));
                }}
                style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>€15</Text>
              <Text style={styles.sliderLabel}>€80</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Country</Text>
          <Pressable
            onPress={() => setShowCountryPicker(true)}
            style={({ pressed }) => [styles.textInput, styles.dropdownTrigger, pressed && { opacity: 0.7 }]}
          >
            {selectedCountry ? (
              <View style={styles.dropdownSelected}>
                <Text style={styles.dropdownFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.dropdownText}>{data.country}</Text>
              </View>
            ) : (
              <Text style={styles.dropdownPlaceholder}>Select your country</Text>
            )}
            <ChevronDown size={18} color={Colors.textTertiary} />
          </Pressable>
        </View>

        {data.country ? (
          <View style={styles.retailerPreview}>
            <Text style={styles.retailerPreviewTitle}>
              We'll show prices from {data.country} retailers
            </Text>
            <Text style={styles.retailerPreviewList}>{top3Discount}</Text>
          </View>
        ) : (
          <View style={styles.countryMapPlaceholder}>
            <Text style={styles.mapEmoji}>🇪🇺</Text>
            <Text style={styles.mapTitle}>27 EU Countries Supported</Text>
            <Text style={styles.mapDesc}>
              We'll show you local grocery prices so you can fuel up without breaking the bank.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const steps = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];
  const isLastStep = step === TOTAL_STEPS - 1;

  const filteredCountries = EU_COUNTRIES_WITH_FLAGS.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        {step > 0 ? (
          <Pressable onPress={goBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
            <ArrowLeft size={20} color={Colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.stepIndicator}>
          {step + 1} of {TOTAL_STEPS}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 60 : 0}
      >
        <Animated.View style={[styles.flex, { transform: [{ translateX: slideAnim }] }]}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {steps[step]?.()}
          </ScrollView>
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {isLastStep ? (
            <Pressable
              onPress={() => void handleFinish()}
              disabled={!canProceed()}
              style={({ pressed }) => [
                styles.finishBtn,
                !canProceed() && styles.nextBtnDisabled,
                pressed && canProceed() && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Sparkles size={18} color={canProceed() ? "#0F1115" : Colors.textTertiary} />
              <Text style={[styles.finishBtnText, !canProceed() && styles.nextBtnTextDisabled]}>
                Generate My Fuel Plan
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={goNext}
              disabled={!canProceed()}
              style={({ pressed }) => [
                styles.nextBtn,
                !canProceed() && styles.nextBtnDisabled,
                pressed && canProceed() && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={[styles.nextBtnText, !canProceed() && styles.nextBtnTextDisabled]}>
                {step === 0 ? "Get Started" : "Continue"}
              </Text>
              <ArrowRight size={18} color={canProceed() ? "#0F1115" : Colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <Pressable onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.modalDone}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.searchWrap}>
              <Search size={16} color={Colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search countries..."
                placeholderTextColor={Colors.textTertiary}
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setData((p) => ({ ...p, country: item.name }));
                    setShowCountryPicker(false);
                    setCountrySearch("");
                  }}
                  style={({ pressed }) => [
                    styles.countryItem,
                    data.country === item.name && styles.countryItemSelected,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={styles.countryItemLeft}>
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text style={[styles.countryItemText, data.country === item.name && styles.countryItemTextSelected]}>
                      {item.name}
                    </Text>
                  </View>
                  {data.country === item.name && <Check size={18} color={Colors.primary} />}
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FeatureLine({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={featureStyles.row}>
      <Text style={featureStyles.icon}>{icon}</Text>
      <Text style={featureStyles.text}>{text}</Text>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  icon: {
    fontSize: 20,
  },
  text: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
    flex: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  stepContent: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: -8,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipColumn: {
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 6,
  },
  chipFull: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  chipIcon: {
    fontSize: 18,
  },
  chipTextWrap: {
    flexShrink: 1,
    flex: 1,
  },
  chipTextWrapFull: {
    flex: 1,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  chipLabelSelected: {
    color: "#0F1115",
  },
  chipDesc: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  chipDescSelected: {
    color: "#0F1115",
    opacity: 0.8,
  },
  chipCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0F1115",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownSelected: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dropdownFlag: {
    fontSize: 20,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  budgetCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 4,
  },
  budgetAmount: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  budgetDaily: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  budgetStepperRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    width: "100%",
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  budgetBarWrap: {
    flex: 1,
    height: 44,
    justifyContent: "center" as const,
  },
  budgetBarTrack: {
    height: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 4,
    overflow: "hidden" as const,
  },
  budgetBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  sliderLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: "600" as const,
  },
  countryMapPlaceholder: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapEmoji: {
    fontSize: 48,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  mapDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  retailerPreview: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  retailerPreviewTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginBottom: 6,
  },
  retailerPreviewList: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  scheduleContainer: {
    gap: 8,
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
  },
  dayCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    width: 44,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayTypeText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  dayIcon: {
    fontSize: 18,
  },
  scheduleLegend: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap" as const,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  legendHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontStyle: "italic" as const,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  nextBtnDisabled: {
    backgroundColor: Colors.surfaceElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#0F1115",
  },
  nextBtnTextDisabled: {
    color: Colors.textTertiary,
  },
  finishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  finishBtnText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#0F1115",
  },
  welcomeContainer: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
    textAlign: "center" as const,
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    marginBottom: 24,
    lineHeight: 24,
  },
  welcomeFeatures: {
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  modalDone: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countryItemSelected: {
    backgroundColor: Colors.primaryLight,
  },
  countryItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  countryFlag: {
    fontSize: 22,
  },
  countryItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  countryItemTextSelected: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
});
