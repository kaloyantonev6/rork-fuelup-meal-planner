import React, { useState, useCallback, useEffect, useRef } from "react";
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
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import {
  Crown,
  Utensils,
  Bell,
  Shield,
  CircleHelp as HelpCircle,
  ChevronRight,
  Leaf,
  User,
  Clock,
  MapPin,
  X,
  Check,
  Pencil,
  LogOut,
  Camera,
  Pill,
} from "lucide-react-native";
import { loadCycleSettings, saveCycleSettings, CYCLE_SOURCE_TAG, type CycleSettings } from "@/lib/cycleTracker";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useNotifications } from "@/providers/NotificationProvider";

import {
  FOOTBALL_POSITIONS,
  DIET_TYPES,
  COOKING_SKILLS,
  EU_COUNTRIES_WITH_FLAGS,
  DAY_TYPE_OPTIONS,
} from "@/constants/onboarding";
import {
  DayType,
} from "@/types";
import WeeklyProgramEditor from "@/components/WeeklyProgramEditor";
import Toast from "@/components/ui/Toast";
import { useToday } from "@/providers/TodayProvider";
import {
  DAY_TYPE_META,
  DEFAULT_WEEKLY_SCHEDULE,
  getMondayIndex,
} from "@/constants/dayTypes";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile } = useMealPlan();
  const { signOut: signOutSupabase } = useAuth();
  const { mealRemindersEnabled, setMealRemindersEnabled } = useNotifications();

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const { todayData, refreshToday, resetHydration } = useToday();
  const [cycle, setCycle] = useState<CycleSettings | null>(null);
  useEffect(() => {
    void loadCycleSettings().then(setCycle);
  }, []);
  const [programToastVisible, setProgramToastVisible] = useState(false);

  const weeklySchedule: DayType[] =
    profile.weeklySchedule && profile.weeklySchedule.length === 7
      ? profile.weeklySchedule
      : DEFAULT_WEEKLY_SCHEDULE;

  /** Auto-saves the program; if today's day type changed, offers to reset today's progress. */
  const handleProgramChange = useCallback(
    (next: DayType[]) => {
      const prevType = weeklySchedule[getMondayIndex()];
      const nextType = next[getMondayIndex()];
      updateProfile({ weeklySchedule: next });
      refreshToday();
      setProgramToastVisible(true);
      if (prevType !== nextType) {
        Alert.alert(
          "Daily targets updated",
          "Your daily targets have changed. Reset today's progress?",
          [
            { text: "Keep", style: "cancel" },
            { text: "Reset", style: "destructive", onPress: resetHydration },
          ],
        );
      }
    },
    [weeklySchedule, updateProfile, refreshToday, resetHydration],
  );

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

  const positionLabel = FOOTBALL_POSITIONS.find((p) => p.id === profile.position)?.label;

  /** One-line summary shown on the compact Player Profile card. */
  const playerSummary =
    [
      profile.age ? `${profile.age} yrs` : null,
      profile.weight ? `${profile.weight} kg` : null,
      profile.height ? `${profile.height} cm` : null,
      positionLabel,
    ]
      .filter(Boolean)
      .join(" · ") || "Tap to view and edit";

  /** One-line summaries shown on the compact Nutrition and Meal Times cards. */
  const nutritionSummary = `${
    DIET_TYPES.find((d) => d.id === profile.dietType)?.label ?? "Not set"
  } · ${COOKING_SKILLS.find((c) => c.id === profile.cookingSkill)?.label ?? "Not set"}`;
  const mealTimesSummary = mealRemindersEnabled ? "Reminders on" : "Reminders off";

  return (
    <>
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



      {/* My Program — weekly program editor (first settings section) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Program</Text>
        <View style={styles.programCard}>
          <Text style={styles.programHeader}>⚽ My Weekly Program</Text>
          <WeeklyProgramEditor
            schedule={weeklySchedule}
            onChange={handleProgramChange}
            title={null}
            subtitle="Tap each day to set your schedule"
          />
          <Text style={styles.programNote}>
            Your meal plans and daily targets automatically adjust based on this schedule.
          </Text>
          {todayData ? (
            <View style={styles.nextDayCard}>
              <Text style={styles.nextDayIcon}>
                {DAY_TYPE_META[todayData.tomorrow.dayType].icon}
              </Text>
              <View style={styles.nextDayTextWrap}>
                <Text style={styles.nextDayLabel}>
                  Tomorrow — {todayData.tomorrow.dayName}
                </Text>
                <Text
                  style={[
                    styles.nextDayValue,
                    { color: DAY_TYPE_META[todayData.tomorrow.dayType].color },
                  ]}
                >
                  {DAY_TYPE_META[todayData.tomorrow.dayType].label} ·{" "}
                  {todayData.tomorrow.calorieTarget} kcal
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      {/* Meal Times — compact card; full eating windows live on the detail page */}
      <View style={styles.section}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/meal-times");
          }}
          style={({ pressed }) => [
            styles.sectionCard,
            styles.playerCard,
            pressed && { backgroundColor: Colors.surfaceElevated },
          ]}
        >
          <View style={styles.playerIconWrap}>
            <Clock size={20} color={Colors.primary} />
          </View>
          <View style={styles.playerTextWrap}>
            <Text style={styles.playerTitle}>Meal Times</Text>
            <Text style={styles.playerSubtitle} numberOfLines={1}>
              {`Eating windows · ${mealTimesSummary}`}
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </Pressable>
      </View>

      {/* Player Profile — compact summary; full editing lives on the detail page */}
      <View style={styles.section}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/profile-details");
          }}
          style={({ pressed }) => [
            styles.sectionCard,
            styles.playerCard,
            pressed && { backgroundColor: Colors.surfaceElevated },
          ]}
        >
          <View style={styles.playerIconWrap}>
            <User size={20} color={Colors.primary} />
          </View>
          <View style={styles.playerTextWrap}>
            <Text style={styles.playerTitle}>Body & Football Profile</Text>
            <Text style={styles.playerSubtitle} numberOfLines={1}>
              {playerSummary}
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </Pressable>
      </View>

      {/* Nutrition & Cooking — compact card; full settings live on the detail page */}
      <View style={styles.section}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/nutrition-details");
          }}
          style={({ pressed }) => [
            styles.sectionCard,
            styles.playerCard,
            pressed && { backgroundColor: Colors.surfaceElevated },
          ]}
        >
          <View style={styles.playerIconWrap}>
            <Utensils size={20} color={Colors.accent} />
          </View>
          <View style={styles.playerTextWrap}>
            <Text style={styles.playerTitle}>Nutrition & Cooking</Text>
            <Text style={styles.playerSubtitle} numberOfLines={1}>
              {nutritionSummary}
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
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
          <PrefRow
            icon={<MapPin size={18} color="#10B981" />}
            label="Country"
            value={profile.country || "Not set"}
            onEdit={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCountryPicker(true);
            }}
          />
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={() => router.push("/premium")}>
            <View style={styles.settingLeft}>
              <Crown size={18} color={Colors.premiumGold} />
              <Text style={styles.settingLabel}>Subscription</Text>
            </View>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={() => router.push("/supplements" as never)}>
            <View style={styles.settingLeft}>
              <Pill size={18} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Supplements</Text>
            </View>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={() => router.push("/profile/privacy")}>
            <View style={styles.settingLeft}>
              <Shield size={18} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Privacy</Text>
            </View>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={() => router.push("/profile/help")}>
            <View style={styles.settingLeft}>
              <HelpCircle size={18} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Help & Support</Text>
            </View>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </Pressable>
        </View>
      </View>

      {/* Cycle nutrition — opt-in, female users only (Randell 2021: education, not prescription) */}
      {profile.gender === "female" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cycle Nutrition (Optional)</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Track menstrual cycle for nutrition adjustments</Text>
                <Text style={styles.settingSublabel}>Education only — never prescriptive</Text>
              </View>
              <Switch
                value={cycle?.enabled ?? false}
                onValueChange={(v) => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const next: CycleSettings = {
                    enabled: v,
                    cycleLengthDays: cycle?.cycleLengthDays ?? 28,
                    lastPeriodDate: cycle?.lastPeriodDate ?? "",
                  };
                  setCycle(next);
                  void saveCycleSettings(next);
                }}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor="#fff"
              />
            </View>
            {cycle?.enabled ? (
              <>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingLabel}>Average cycle length (days)</Text>
                  </View>
                  <TextInput
                    style={{
                      backgroundColor: Colors.surfaceElevated,
                      borderWidth: 1,
                      borderColor: Colors.borderLight,
                      borderRadius: 8,
                      color: Colors.text,
                      fontSize: 13,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      width: 64,
                      textAlign: "center" as const,
                    }}
                    value={String(cycle.cycleLengthDays)}
                    keyboardType="number-pad"
                    maxLength={2}
                    onChangeText={(t) => {
                      const next: CycleSettings = { ...cycle, cycleLengthDays: parseInt(t, 10) || 28 };
                      setCycle(next);
                      void saveCycleSettings(next);
                    }}
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingLabel}>First day of last period</Text>
                    <Text style={styles.settingSublabel}>YYYY-MM-DD</Text>
                  </View>
                  <TextInput
                    style={{
                      backgroundColor: Colors.surfaceElevated,
                      borderWidth: 1,
                      borderColor: Colors.borderLight,
                      borderRadius: 8,
                      color: Colors.text,
                      fontSize: 13,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      width: 120,
                      textAlign: "center" as const,
                    }}
                    value={cycle.lastPeriodDate}
                    placeholder="2026-01-01"
                    placeholderTextColor={Colors.textTertiary}
                    maxLength={10}
                    onChangeText={(t) => {
                      const next: CycleSettings = { ...cycle, lastPeriodDate: t };
                      setCycle(next);
                      void saveCycleSettings(next);
                    }}
                  />
                </View>
                <Text style={{ fontSize: 10, fontStyle: "italic", color: Colors.textTertiary, marginTop: 8 }}>
                  📚 {CYCLE_SOURCE_TAG}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      ) : null}

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

      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCountryPicker(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Country</Text>
              <Pressable onPress={() => setShowCountryPicker(false)} hitSlop={12}>
                <X size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={EU_COUNTRIES_WITH_FLAGS}
              keyExtractor={(item) => item.code}
              style={styles.optionsList}
              renderItem={({ item }) => {
                const selected = profile.country === item.name;
                return (
                  <Pressable
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateProfile({ country: item.name });
                      setShowCountryPicker(false);
                    }}
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
          </View>
        </View>
      </Modal>
    </ScrollView>
    <Toast
      visible={programToastVisible}
      message="Program updated · Today's targets adjusted"
      icon="⚽"
      onHide={() => setProgramToastVisible(false)}
    />
    </>
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
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  playerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  playerTextWrap: {
    flex: 1,
  },
  playerTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  playerSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
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
  programCard: {
    backgroundColor: Colors.bg3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
  },
  programHeader: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  programNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 10,
  },
  nextDayCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginTop: 12,
  },
  nextDayIcon: {
    fontSize: 16,
  },
  nextDayTextWrap: {
    flex: 1,
  },
  nextDayLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
  },
  nextDayValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginTop: 2,
  },
});
