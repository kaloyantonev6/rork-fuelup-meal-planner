import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Flame,
  Users,
  ChefHat,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { recipes } from "@/mocks/recipes";
import NutritionRing from "@/components/NutritionRing";

export default function RecipeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const recipe = recipes.find((r) => r.id === id);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (!recipe) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Recipe not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: recipe.image }} style={styles.heroImage} contentFit="cover" />
          <View style={[styles.imageOverlay, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.tagsRow}>
            {recipe.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.title}>{recipe.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{recipe.duration} min</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Users size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{recipe.servings} servings</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <ChefHat size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{recipe.difficulty}</Text>
            </View>
          </View>

          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>Nutrition per serving</Text>
            <View style={styles.nutritionRings}>
              <View style={styles.calorieCenter}>
                <Flame size={18} color={Colors.accent} />
                <Text style={styles.calorieValue}>{recipe.nutrition.calories}</Text>
                <Text style={styles.calorieUnit}>kcal</Text>
              </View>
              <NutritionRing
                current={recipe.nutrition.protein}
                target={50}
                label="Protein"
                color="#E8734A"
                size={64}
              />
              <NutritionRing
                current={recipe.nutrition.carbs}
                target={80}
                label="Carbs"
                color="#4A90D9"
                size={64}
              />
              <NutritionRing
                current={recipe.nutrition.fat}
                target={30}
                label="Fat"
                color="#D4A44C"
                size={64}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ing) => (
                <View key={ing.id} style={styles.ingredientRow}>
                  <View style={styles.ingredientDot} />
                  <Text style={styles.ingredientName}>{ing.name}</Text>
                  <Text style={styles.ingredientAmount}>
                    {ing.amount} {ing.unit}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.stepsList}>
              {recipe.steps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: insets.bottom + 20 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  imageContainer: {
    height: 280,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.background,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: Colors.tagBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: Colors.tagText,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  nutritionCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 24,
  },
  nutritionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  nutritionRings: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  calorieCenter: {
    alignItems: "center",
    gap: 2,
  },
  calorieValue: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.accent,
  },
  calorieUnit: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: -3,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  ingredientsList: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  ingredientName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  ingredientAmount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  stepsList: {
    gap: 14,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
});
