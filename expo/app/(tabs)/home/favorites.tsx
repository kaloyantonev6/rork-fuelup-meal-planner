import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Animated,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  ArrowLeft,
  Heart,
  Search,
  Flame,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSavedPlans, FavoriteMeal } from "@/providers/SavedPlansProvider";

const DARK = {
  bg: "#0F1115",
  card: "#1A1D23",
  elevated: "#242830",
  border: "#2A2E38",
  text: "#FFFFFF",
  textSecondary: "#9CA3AF",
  teal: "#2dd4a8",
};

const FILTER_OPTIONS = ["All", "Breakfast", "Lunch", "Dinner", "Snack"] as const;
type FilterType = (typeof FILTER_OPTIONS)[number];

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_GAP = 12;
const CARD_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favorites, removeFavorite } = useSavedPlans();

  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef<Map<string, Animated.Value>>(new Map());

  const getFadeAnim = useCallback((id: string) => {
    if (!fadeAnims.current.has(id)) {
      fadeAnims.current.set(id, new Animated.Value(1));
    }
    return fadeAnims.current.get(id)!;
  }, []);

  const filteredFavorites = useMemo(() => {
    let list = favorites;
    if (activeFilter !== "All") {
      list = list.filter((f) => f.mealType === activeFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list;
  }, [favorites, activeFilter, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  }, [toastAnim]);

  const handleRemoveFavorite = useCallback((meal: FavoriteMeal) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Remove from favorites?",
      `"${meal.name}" will be removed from your saved meals.`,
      [
        { text: "Keep It", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const anim = getFadeAnim(meal.id);
            Animated.timing(anim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start(() => {
              removeFavorite(meal.id);
              showToast("Removed from favorites");
              fadeAnims.current.delete(meal.id);
            });
          },
        },
      ]
    );
  }, [removeFavorite, showToast, getFadeAnim]);

  const rows: FavoriteMeal[][] = [];
  for (let i = 0; i < filteredFavorites.length; i += 2) {
    rows.push(filteredFavorites.slice(i, i + 2));
  }

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
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_OPTIONS.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveFilter(filter);
            }}
            style={[
              styles.filterChip,
              activeFilter === filter && styles.filterChipActive,
            ]}
          >
            <Text style={[
              styles.filterChipText,
              activeFilter === filter && styles.filterChipTextActive,
            ]}>
              {filter}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.searchWrap}>
        <Search size={18} color={DARK.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your favorites..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.grid}
        contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DARK.teal} />
        }
      >
        {filteredFavorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyHeart}>❤️</Text>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the ❤️ on any meal to save it here
            </Text>
          </View>
        ) : (
          rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map((meal) => {
                const anim = getFadeAnim(meal.id);
                return (
                  <Animated.View
                    key={meal.id}
                    style={[
                      styles.mealCardWrap,
                      {
                        opacity: anim,
                        transform: [{ scale: anim }],
                      },
                    ]}
                  >
                    <FavMealCard
                      meal={meal}
                      onRemove={() => handleRemoveFavorite(meal)}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push({
                          pathname: "/meal-detail",
                          params: {
                            meal: JSON.stringify({
                              id: meal.id,
                              name: meal.name,
                              calories: meal.calories,
                              protein: meal.protein,
                              carbs: meal.carbs,
                              fat: meal.fat,
                              ingredients: meal.ingredients,
                              ingredientQuantities: meal.ingredientQuantities ?? meal.ingredients,
                              instructions: meal.instructions ?? [],
                              nutritionTip: meal.nutritionTip ?? "",
                              prepTime: meal.prepTime ?? 0,
                              difficulty: meal.difficulty ?? "beginner",
                              mealType: meal.mealType,
                              image: meal.image,
                              isFavorite: true,
                            }),
                            isPremium: "false",
                          },
                        });
                      }}
                    />
                  </Animated.View>
                );
              })}
              {row.length === 1 && <View style={styles.mealCardWrap} />}
            </View>
          ))
        )}
      </ScrollView>

      {toastMessage && (
        <Animated.View style={[styles.toast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

function FavMealCard({
  meal,
  onRemove,
  onPress,
}: {
  meal: FavoriteMeal;
  onRemove: () => void;
  onPress: () => void;
}) {
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleHeartPress = useCallback(() => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, friction: 3, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
    onRemove();
  }, [heartScale, onRemove]);

  const mealTypeLabel = meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.mealCard, pressed && { opacity: 0.9 }]}>
      <View style={styles.mealImageWrap}>
        <Image source={{ uri: meal.image }} style={styles.mealImage} contentFit="cover" />
        <Animated.View style={[styles.heartBtn, { transform: [{ scale: heartScale }] }]}>
          <Pressable onPress={handleHeartPress} hitSlop={8}>
            <Heart size={18} color="#EF4444" fill="#EF4444" />
          </Pressable>
        </Animated.View>
        <View style={styles.mealTypeBadge}>
          <Text style={styles.mealTypeText}>{mealTypeLabel}</Text>
        </View>
      </View>
      <View style={styles.mealInfo}>
        <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
        <View style={styles.mealBadges}>
          <View style={styles.calorieBadge}>
            <Flame size={10} color="#FF6B35" />
            <Text style={styles.calorieText}>{meal.calories} kcal</Text>
          </View>
          <View style={styles.proteinBadge}>
            <Text style={styles.proteinText}>{meal.protein}g protein</Text>
          </View>
        </View>
      </View>
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
  filterScroll: {
    maxHeight: 46,
    marginBottom: 10,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DARK.card,
    borderWidth: 1.5,
    borderColor: DARK.border,
  },
  filterChipActive: {
    backgroundColor: DARK.teal + "22",
    borderColor: DARK.teal,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: DARK.textSecondary,
  },
  filterChipTextActive: {
    color: DARK.teal,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DARK.card,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: DARK.text,
  },
  grid: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: CARD_PADDING,
    gap: CARD_GAP,
  },
  gridRow: {
    flexDirection: "row",
    gap: CARD_GAP,
  },
  mealCardWrap: {
    flex: 1,
  },
  mealCard: {
    backgroundColor: DARK.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: DARK.border,
  },
  mealImageWrap: {
    width: "100%",
    height: CARD_WIDTH * 0.7,
  },
  mealImage: {
    width: "100%",
    height: "100%",
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  mealTypeBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mealTypeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#fff",
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  mealInfo: {
    padding: 10,
    gap: 6,
  },
  mealName: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: DARK.text,
    lineHeight: 17,
  },
  mealBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  calorieBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FF6B35" + "18",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  calorieText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: "#FF8C5A",
  },
  proteinBadge: {
    backgroundColor: DARK.elevated,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  proteinText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: DARK.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    gap: 8,
  },
  emptyHeart: {
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
  toast: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: DARK.elevated,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DARK.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: DARK.text,
  },
});
