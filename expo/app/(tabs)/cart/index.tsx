import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Check,
  Circle,
  TrendingDown,
  Zap,
  Store,
  ChevronDown,
  ChevronUp,
  Tag,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { retailers } from "@/mocks/recipes";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { shoppingList, toggleShoppingItem, totalSavings, totalCartCost, checkedCount } = useMealPlan();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const categories = [...new Set(shoppingList.map((item) => item.category))];

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  const handleToggleItem = useCallback((id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleShoppingItem(id);
  }, [toggleShoppingItem]);

  const getCategoryItems = useCallback(
    (cat: string) => shoppingList.filter((item) => item.category === cat),
    [shoppingList]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Cart</Text>
        <View style={styles.aiBadge}>
          <Zap size={12} color={Colors.accent} />
          <Text style={styles.aiBadgeText}>AI-Optimized</Text>
        </View>
      </View>

      <View style={styles.savingsCard}>
        <LinearGradient
          colors={["#E8734A", "#D45A2E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.savingsGradient}
        >
          <View style={styles.savingsContent}>
            <View style={styles.savingsLeft}>
              <TrendingDown size={20} color="#fff" />
              <View>
                <Text style={styles.savingsLabel}>You're saving</Text>
                <Text style={styles.savingsAmount}>€{totalSavings.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.savingsRight}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>€{totalCartCost.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.retailerScan}>
            <Store size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.retailerScanText}>
              Scanned 270+ EU retailers for best prices
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.progressBar}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${shoppingList.length > 0 ? (checkedCount / shoppingList.length) * 100 : 0}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {checkedCount}/{shoppingList.length} items
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.retailerRow}
      >
        {retailers.map((r) => (
          <View key={r.id} style={styles.retailerChip}>
            <Text style={styles.retailerEmoji}>{r.logo}</Text>
            <Text style={styles.retailerName}>{r.name}</Text>
            <View style={styles.retailerDiscountBadge}>
              <Tag size={9} color={Colors.discount} />
              <Text style={styles.retailerDiscountText}>{r.discountCount}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((cat) => {
          const items = getCategoryItems(cat);
          const isExpanded = expandedCategories[cat] !== false;
          const catChecked = items.filter((i) => i.checked).length;

          return (
            <View key={cat} style={styles.categorySection}>
              <Pressable onPress={() => toggleCategory(cat)} style={styles.categoryHeader}>
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryName}>{cat}</Text>
                  <Text style={styles.categoryCount}>
                    {catChecked}/{items.length}
                  </Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={18} color={Colors.textTertiary} />
                ) : (
                  <ChevronDown size={18} color={Colors.textTertiary} />
                )}
              </Pressable>

              {isExpanded &&
                items.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleToggleItem(item.id)}
                    style={[styles.itemRow, item.checked && styles.itemRowChecked]}
                  >
                    <View style={styles.itemCheckbox}>
                      {item.checked ? (
                        <View style={styles.checkboxChecked}>
                          <Check size={12} color="#fff" />
                        </View>
                      ) : (
                        <Circle size={22} color={Colors.border} />
                      )}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text
                        style={[styles.itemName, item.checked && styles.itemNameChecked]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.itemAmount}>
                        {item.amount} {item.unit}
                      </Text>
                    </View>
                    <View style={styles.itemPricing}>
                      {item.discount && item.discount > 0 ? (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>-{item.discount}%</Text>
                        </View>
                      ) : null}
                      <Text style={styles.itemPrice}>€{item.bestPrice?.toFixed(2)}</Text>
                      {item.originalPrice && item.bestPrice && item.originalPrice > item.bestPrice && (
                        <Text style={styles.itemOriginalPrice}>
                          €{item.originalPrice.toFixed(2)}
                        </Text>
                      )}
                      {item.retailer && (
                        <Text style={styles.itemRetailer}>{item.retailer}</Text>
                      )}
                    </View>
                  </Pressable>
                ))}
            </View>
          );
        })}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3ED",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.accent,
  },
  savingsCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
  },
  savingsGradient: {
    padding: 18,
    gap: 12,
  },
  savingsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  savingsLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  savingsAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  savingsRight: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  retailerScan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  retailerScanText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  progressBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  retailerRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 14,
  },
  retailerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retailerEmoji: {
    fontSize: 14,
  },
  retailerName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },
  retailerDiscountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FFF3ED",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  retailerDiscountText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.discount,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  categoryCount: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: "500",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  itemRowChecked: {
    opacity: 0.6,
    backgroundColor: Colors.surfaceAlt,
  },
  itemCheckbox: {
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  itemNameChecked: {
    textDecorationLine: "line-through",
    color: Colors.textTertiary,
  },
  itemAmount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemPricing: {
    alignItems: "flex-end",
    gap: 2,
  },
  discountBadge: {
    backgroundColor: "#FFEDE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.discount,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  itemOriginalPrice: {
    fontSize: 11,
    color: Colors.textTertiary,
    textDecorationLine: "line-through",
  },
  itemRetailer: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
});
