import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Animated,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Eye,
  FolderInput,
  Trash2,
  Flame,
  Zap,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSavedPlans, SavedPlanData } from "@/providers/SavedPlansProvider";

const DARK = {
  bg: "#0F1115",
  card: "#1A1D23",
  elevated: "#242830",
  border: "#2A2E38",
  text: "#FFFFFF",
  textSecondary: "#9CA3AF",
  teal: "#2dd4a8",
  tealDark: "#1a9e7a",
};

const FOLDER_EMOJIS = ["📋", "🥗", "💪", "🔥", "🥩", "🌱", "⚡", "🎯"];
const FOLDER_COLORS = ["#2dd4a8", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function SavedPlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    savedPlans,
    folders,
    removePlan,
    movePlanToFolder,
    createFolder,
  } = useSavedPlans();

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderEmoji, setNewFolderEmoji] = useState("📋");
  const [newFolderColor, setNewFolderColor] = useState("#2dd4a8");
  const [menuPlanId, setMenuPlanId] = useState<string | null>(null);
  const [showMoveFolder, setShowMoveFolder] = useState(false);
  const [movePlanTarget, setMovePlanTarget] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [_removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const slideAnims = useRef<Map<string, Animated.Value>>(new Map());

  const getSlideAnim = useCallback((id: string) => {
    if (!slideAnims.current.has(id)) {
      slideAnims.current.set(id, new Animated.Value(1));
    }
    return slideAnims.current.get(id)!;
  }, []);

  const filteredPlans = useMemo(() => {
    if (selectedFolder === null) return savedPlans;
    return savedPlans.filter((p) => p.folderId === selectedFolder);
  }, [savedPlans, selectedFolder]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  }, []);

  const handleRemovePlan = useCallback((planId: string) => {
    Alert.alert("Remove this plan?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setRemovingIds((prev) => new Set(prev).add(planId));
          const anim = getSlideAnim(planId);
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            removePlan(planId);
            setRemovingIds((prev) => {
              const next = new Set(prev);
              next.delete(planId);
              return next;
            });
          });
        },
      },
    ]);
    setMenuPlanId(null);
  }, [removePlan, getSlideAnim]);

  const handleMoveToFolder = useCallback((planId: string) => {
    setMovePlanTarget(planId);
    setShowMoveFolder(true);
    setMenuPlanId(null);
  }, []);

  const confirmMove = useCallback((folderId: string | null) => {
    if (movePlanTarget) {
      movePlanToFolder(movePlanTarget, folderId);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowMoveFolder(false);
    setMovePlanTarget(null);
  }, [movePlanTarget, movePlanToFolder]);

  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim(), newFolderEmoji, newFolderColor);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowCreateFolder(false);
    setNewFolderName("");
    setNewFolderEmoji("📋");
    setNewFolderColor("#2dd4a8");
  }, [newFolderName, newFolderEmoji, newFolderColor, createFolder]);

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Saved today";
    if (days === 1) return "Saved yesterday";
    return `Saved ${days} days ago`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <ArrowLeft size={22} color={DARK.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Saved Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.folderScroll}
        contentContainerStyle={styles.folderScrollContent}
      >
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedFolder(null);
          }}
          style={[
            styles.folderChip,
            selectedFolder === null && styles.folderChipActive,
          ]}
        >
          <Text style={[
            styles.folderChipText,
            selectedFolder === null && styles.folderChipTextActive,
          ]}>
            All Plans
          </Text>
        </Pressable>
        {folders.map((folder) => (
          <Pressable
            key={folder.id}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedFolder(folder.id);
            }}
            style={[
              styles.folderChip,
              selectedFolder === folder.id && { backgroundColor: folder.color + "22", borderColor: folder.color },
            ]}
          >
            <Text style={[
              styles.folderChipText,
              selectedFolder === folder.id && { color: folder.color },
            ]}>
              {folder.emoji} {folder.name}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setShowCreateFolder(true)}
          style={styles.addFolderBtn}
        >
          <Plus size={16} color={DARK.teal} />
        </Pressable>
      </ScrollView>

      <ScrollView
        style={styles.plansList}
        contentContainerStyle={[styles.plansContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DARK.teal} />
        }
      >
        {filteredPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No saved plans yet</Text>
            <Text style={styles.emptySubtitle}>
              Generate a meal plan and tap Save to keep it here
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
            >
              <Zap size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Generate Plan</Text>
            </Pressable>
          </View>
        ) : (
          filteredPlans.map((plan) => {
            const anim = getSlideAnim(plan.id);
            return (
              <Animated.View
                key={plan.id}
                style={{
                  opacity: anim,
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                      }),
                    },
                  ],
                }}
              >
                <PlanCard
                  plan={plan}
                  folders={folders}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: "/saved-plan-detail", params: { planId: plan.id } });
                  }}
                  onMenu={() => setMenuPlanId(plan.id === menuPlanId ? null : plan.id)}
                  showMenu={menuPlanId === plan.id}
                  onView={() => {
                    setMenuPlanId(null);
                    router.push({ pathname: "/saved-plan-detail", params: { planId: plan.id } });
                  }}
                  onMove={() => handleMoveToFolder(plan.id)}
                  onRemove={() => handleRemovePlan(plan.id)}
                  timeAgo={getTimeAgo(plan.dateSaved)}
                />
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showCreateFolder} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreateFolder(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Create Folder</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Folder name"
              placeholderTextColor="#6B7280"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <Text style={styles.modalLabel}>Emoji</Text>
            <View style={styles.emojiRow}>
              {FOLDER_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => setNewFolderEmoji(emoji)}
                  style={[
                    styles.emojiBtn,
                    newFolderEmoji === emoji && styles.emojiBtnActive,
                  ]}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.modalLabel}>Color</Text>
            <View style={styles.colorRow}>
              {FOLDER_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setNewFolderColor(color)}
                  style={[
                    styles.colorBtn,
                    { backgroundColor: color },
                    newFolderColor === color && styles.colorBtnActive,
                  ]}
                />
              ))}
            </View>
            <Pressable
              onPress={handleCreateFolder}
              style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.createBtnText}>Create</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showMoveFolder} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowMoveFolder(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Move to Folder</Text>
            <Pressable
              onPress={() => confirmMove(null)}
              style={styles.moveFolderItem}
            >
              <Text style={styles.moveFolderText}>📋 No Folder</Text>
            </Pressable>
            {folders.map((folder) => (
              <Pressable
                key={folder.id}
                onPress={() => confirmMove(folder.id)}
                style={styles.moveFolderItem}
              >
                <Text style={styles.moveFolderText}>{folder.emoji} {folder.name}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function PlanCard({
  plan,
  folders,
  onPress,
  onMenu,
  showMenu,
  onView,
  onMove,
  onRemove,
  timeAgo,
}: {
  plan: SavedPlanData;
  folders: { id: string; emoji: string; name: string; color: string }[];
  onPress: () => void;
  onMenu: () => void;
  showMenu: boolean;
  onView: () => void;
  onMove: () => void;
  onRemove: () => void;
  timeAgo: string;
}) {
  const folder = folders.find((f) => f.id === plan.folderId);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.planCard, pressed && { opacity: 0.95 }]}>
      <View style={styles.planCardHeader}>
        <View style={styles.planCardTitleArea}>
          <Text style={styles.planCardTitle} numberOfLines={1}>{plan.title}</Text>
          <Text style={styles.planCardDate}>{timeAgo}</Text>
        </View>
        <Pressable onPress={onMenu} hitSlop={12} style={styles.menuBtn}>
          <MoreVertical size={18} color={DARK.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.planCardBadges}>
        <View style={[styles.durationBadge, plan.duration === "7-Day" ? styles.weeklyBadge : styles.dailyBadge]}>
          <Text style={styles.durationText}>{plan.duration}</Text>
        </View>
        <View style={styles.calBadge}>
          <Flame size={12} color="#FF6B35" />
          <Text style={styles.calBadgeText}>{plan.targetCalories.toLocaleString()} kcal/day</Text>
        </View>
        <View style={styles.mealCountBadge}>
          <Text style={styles.mealCountText}>{plan.mealsPerDay} meals</Text>
        </View>
        {folder && (
          <View style={[styles.folderBadge, { borderColor: folder.color + "55" }]}>
            <Text style={[styles.folderBadgeText, { color: folder.color }]}>{folder.emoji} {folder.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.macroRow}>
        <View style={styles.macroPill}>
          <Text style={[styles.macroPillText, { color: "#E8734A" }]}>{plan.targetProtein}g P</Text>
        </View>
        <View style={styles.macroPill}>
          <Text style={[styles.macroPillText, { color: "#4A90D9" }]}>{plan.targetCarbs}g C</Text>
        </View>
        <View style={styles.macroPill}>
          <Text style={[styles.macroPillText, { color: "#D4A44C" }]}>{plan.targetFat}g F</Text>
        </View>
      </View>

      {showMenu && (
        <View style={styles.menuDropdown}>
          <Pressable onPress={onView} style={styles.menuItem}>
            <Eye size={16} color={DARK.text} />
            <Text style={styles.menuItemText}>View Plan</Text>
          </Pressable>
          <Pressable onPress={onMove} style={styles.menuItem}>
            <FolderInput size={16} color={DARK.text} />
            <Text style={styles.menuItemText}>Move to Folder</Text>
          </Pressable>
          <Pressable onPress={onRemove} style={[styles.menuItem, styles.menuItemDanger]}>
            <Trash2 size={16} color="#EF4444" />
            <Text style={[styles.menuItemText, { color: "#EF4444" }]}>Remove from Saved</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DARK.card,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: DARK.text,
  },
  folderScroll: {
    maxHeight: 48,
    marginBottom: 8,
  },
  folderScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  folderChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DARK.card,
    borderWidth: 1.5,
    borderColor: DARK.border,
  },
  folderChipActive: {
    backgroundColor: DARK.teal + "22",
    borderColor: DARK.teal,
  },
  folderChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: DARK.textSecondary,
  },
  folderChipTextActive: {
    color: DARK.teal,
  },
  addFolderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DARK.card,
    borderWidth: 1.5,
    borderColor: DARK.teal + "44",
    justifyContent: "center",
    alignItems: "center",
  },
  plansList: {
    flex: 1,
  },
  plansContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  planCard: {
    backgroundColor: DARK.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  planCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  planCardTitleArea: {
    flex: 1,
    marginRight: 12,
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: DARK.text,
    marginBottom: 2,
  },
  planCardDate: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: DARK.textSecondary,
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DARK.elevated,
    justifyContent: "center",
    alignItems: "center",
  },
  planCardBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  durationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dailyBadge: {
    backgroundColor: DARK.teal + "22",
  },
  weeklyBadge: {
    backgroundColor: "#8B5CF6" + "22",
  },
  durationText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: DARK.teal,
  },
  calBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#FF6B35" + "15",
  },
  calBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#FF8C5A",
  },
  mealCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: DARK.elevated,
  },
  mealCountText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: DARK.textSecondary,
  },
  folderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  folderBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  macroRow: {
    flexDirection: "row",
    gap: 8,
  },
  macroPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: DARK.elevated,
  },
  macroPillText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  menuDropdown: {
    position: "absolute",
    top: 52,
    right: 16,
    backgroundColor: DARK.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DARK.border,
    overflow: "hidden",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: DARK.text,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: DARK.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: DARK.textSecondary,
    textAlign: "center" as const,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: DARK.teal,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: DARK.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: DARK.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: DARK.elevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: DARK.text,
    borderWidth: 1,
    borderColor: DARK.border,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: DARK.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  emojiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DARK.elevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  emojiBtnActive: {
    borderColor: DARK.teal,
    backgroundColor: DARK.teal + "22",
  },
  emojiText: {
    fontSize: 18,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  colorBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorBtnActive: {
    borderColor: "#fff",
    transform: [{ scale: 1.15 }],
  },
  createBtn: {
    backgroundColor: DARK.teal,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  moveFolderItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
  },
  moveFolderText: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: DARK.text,
  },
});
