import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Animated,
} from "react-native";
import { Crown, ChevronDown, ChevronUp, Check, AlertTriangle, Brain, ShoppingBag } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  PriceComparison,
  BulkSuggestion,
  SmartMix,
  compareShoppingListPrices,
  getBulkSuggestions,
  calculateSmartMix,
  countryNameToCode,
  getTopRetailers,
} from "@/lib/priceEngine";

interface PriceComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  ingredients: { name: string; quantity: number; unit: string }[];
  country: string;
  isPremium: boolean;
  onUpgrade: () => void;
}

export default function PriceComparisonModal({
  visible,
  onClose,
  ingredients,
  country,
  isPremium,
  onUpgrade,
}: PriceComparisonModalProps) {
  const [expandedRetailer, setExpandedRetailer] = useState<string | null>(null);
  const [expandedBulk, setExpandedBulk] = useState<boolean>(false);

  const countryCode = useMemo(() => countryNameToCode(country), [country]);
  const topRetailers = useMemo(() => getTopRetailers(countryCode), [countryCode]);

  const comparisons = useMemo<PriceComparison[]>(() => {
    if (ingredients.length === 0) return [];
    return compareShoppingListPrices(ingredients, countryCode);
  }, [ingredients, countryCode]);

  const bulkSuggestions = useMemo<BulkSuggestion[]>(() => {
    if (ingredients.length === 0) return [];
    return getBulkSuggestions(ingredients.map((i) => i.name));
  }, [ingredients]);

  const smartMix = useMemo<SmartMix>(() => {
    return calculateSmartMix(ingredients, countryCode);
  }, [ingredients, countryCode]);

  const cheapest = comparisons[0];
  const midRange = comparisons.find((c) => c.retailerType === "midRange");

  const getTypeBadge = (type: "discount" | "midRange" | "premium") => {
    switch (type) {
      case "discount": return { label: "Discount", color: "#22c55e" };
      case "midRange": return { label: "Mid-Range", color: "#f59e0b" };
      case "premium": return { label: "Premium", color: "#ef4444" };
    }
  };

  const toggleRetailer = (name: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedRetailer(expandedRetailer === name ? null : name);
  };

  if (!isPremium) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.upgradeCard} onPress={() => {}}>
            <View style={styles.upgradeIconWrap}>
              <Crown size={28} color={Colors.premiumGold} />
            </View>
            <Text style={styles.upgradeTitle}>Premium Feature</Text>
            <Text style={styles.upgradeMessage}>
              Compare prices across 270+ retailers in {country || "your country"} and find the best deals for your shopping list.
            </Text>
            <Pressable
              onPress={() => { onClose(); onUpgrade(); }}
              style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.9 }]}
            >
              <Crown size={16} color="#fff" />
              <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
            </Pressable>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.laterBtn, pressed && { opacity: 0.7 }]}>
              <Text style={styles.laterBtnText}>Maybe Later</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.header}>
              <Text style={styles.title}>🏷️ Best Prices for Your List</Text>
              <Text style={styles.subtitle}>
                Based on {country || "Germany"} prices · {ingredients.length} items
              </Text>
            </View>

            {/* Smart Mix Card */}
            {smartMix && smartMix.items.length > 0 && smartMix.savings > 0.01 && (
              <View style={styles.smartMixCard}>
                <View style={styles.smartMixHeader}>
                  <Brain size={16} color="#8b5cf6" />
                  <Text style={styles.smartMixTitle}>Smart Mix — Best Price Per Item</Text>
                </View>
                <View style={styles.smartMixContent}>
                  {Object.entries(smartMix.byRetailer).slice(0, 4).map(([retailer, data]) => (
                    <View key={retailer} style={styles.smartMixRow}>
                      <ShoppingBag size={12} color={Colors.textSecondary} />
                      <Text style={styles.smartMixRetailer}>{retailer}:</Text>
                      <Text style={styles.smartMixItems} numberOfLines={1}>
                        {data.items.join(", ")}
                      </Text>
                      <Text style={styles.smartMixPrice}>€{data.total.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.smartMixTotal}>
                  <Text style={styles.smartMixTotalLabel}>Smart Mix Total</Text>
                  <Text style={styles.smartMixTotalPrice}>€{smartMix.totalSmartMix.toFixed(2)}</Text>
                </View>
                {smartMix.savings > 0.01 && (
                  <View style={styles.smartMixSavings}>
                    <Text style={styles.smartMixSavingsText}>
                      Save €{smartMix.savings.toFixed(2)} vs shopping at one store
                    </Text>
                  </View>
                )}
                <Text style={styles.smartMixCaveat}>Requires visiting multiple stores</Text>
              </View>
            )}

            {/* Retailer Cards */}
            <Text style={styles.sectionTitle}>Retailer Comparison</Text>
            {comparisons.map((comp, idx) => {
              const isCheapest = idx === 0;
              const isExpanded = expandedRetailer === comp.retailerName;
              const badge = getTypeBadge(comp.retailerType);

              return (
                <View key={comp.retailerName} style={[styles.retailerCard, isCheapest && styles.retailerCardBest]}>
                  <Pressable onPress={() => toggleRetailer(comp.retailerName)} style={styles.retailerHeader}>
                    <View style={styles.retailerLeft}>
                      {isCheapest && <Text style={styles.crownBadge}>👑</Text>}
                      <View>
                        <Text style={[styles.retailerName, isCheapest && styles.retailerNameBest]}>
                          {comp.retailerName}
                        </Text>
                        <View style={[styles.typeBadge, { backgroundColor: badge.color + "18" }]}>
                          <Text style={[styles.typeBadgeText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.retailerRight}>
                      <Text style={[styles.retailerTotal, isCheapest && styles.retailerTotalBest]}>
                        €{comp.totalPrice.toFixed(2)}
                      </Text>
                      {comp.savingsPercent > 0 && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsBadgeText}>Save {comp.savingsPercent}%</Text>
                        </View>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={14} color={Colors.textTertiary} />
                      ) : (
                        <ChevronDown size={14} color={Colors.textTertiary} />
                      )}
                    </View>
                  </Pressable>

                  {isExpanded && comp.itemPrices.length > 0 && (
                    <View style={styles.itemList}>
                      {comp.itemPrices.map((ip) => (
                        <View key={ip.name} style={styles.itemRow}>
                          <View style={styles.itemLeft}>
                            <Text style={styles.itemName} numberOfLines={1}>{ip.name}</Text>
                            <Text style={styles.itemQty}>{ip.quantity}{ip.unit}</Text>
                          </View>
                          <Text style={styles.itemPrice}>€{ip.price.toFixed(2)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Bulk Buy Suggestions */}
            {bulkSuggestions.length > 0 && (
              <View style={styles.bulkSection}>
                <Pressable
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setExpandedBulk(!expandedBulk);
                  }}
                  style={styles.bulkHeader}
                >
                  <Text style={styles.sectionTitle}>💡 Bulk Buy Savings</Text>
                  {expandedBulk ? (
                    <ChevronUp size={16} color={Colors.textTertiary} />
                  ) : (
                    <ChevronDown size={16} color={Colors.textTertiary} />
                  )}
                </Pressable>

                {expandedBulk && bulkSuggestions.map((bs) => (
                  <View key={bs.ingredientName} style={styles.bulkCard}>
                    <View style={styles.bulkTop}>
                      <Text style={styles.bulkName}>{bs.ingredientName}</Text>
                      <View style={styles.bulkSavingsBadge}>
                        <Text style={styles.bulkSavingsText}>Save {bs.bulkSavingsPercent}%</Text>
                      </View>
                    </View>
                    <View style={styles.bulkRow}>
                      <View style={styles.bulkOption}>
                        <Text style={styles.bulkOptionLabel}>Regular</Text>
                        <Text style={styles.bulkOptionValue}>
                          {bs.regularUnit === "kg" ? "1kg" : `1 ${bs.regularUnit}`} for €{bs.regularPrice.toFixed(2)}
                        </Text>
                        <Text style={styles.bulkOptionPerUnit}>
                          €{bs.pricePerUnitRegular.toFixed(2)}/{bs.regularUnit}
                        </Text>
                      </View>
                      <View style={styles.bulkArrow}>
                        <Text style={styles.bulkArrowText}>→</Text>
                      </View>
                      <View style={styles.bulkOptionBulk}>
                        <Text style={styles.bulkOptionLabel}>Bulk</Text>
                        <Text style={styles.bulkOptionValueBulk}>
                          {bs.bulkSize}{bs.bulkUnit} for €{bs.bulkPrice.toFixed(2)}
                        </Text>
                        <Text style={styles.bulkOptionPerUnitBulk}>
                          €{bs.pricePerUnitBulk.toFixed(2)}/{bs.bulkUnit}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.bulkHint}>
                      Lasts ~{Math.ceil(bs.bulkSize / 0.3)} weeks based on your meal plans
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 8,
  },
  retailerCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 8,
    overflow: "hidden" as const,
  },
  retailerCardBest: {
    borderColor: "#22c55e",
    borderWidth: 1.5,
  },
  retailerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  retailerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  crownBadge: {
    fontSize: 18,
  },
  retailerName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  retailerNameBest: {
    color: "#22c55e",
    fontWeight: "700" as const,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    alignSelf: "flex-start" as const,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
  },
  retailerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  retailerTotal: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  retailerTotalBest: {
    color: "#22c55e",
    fontSize: 18,
  },
  savingsBadge: {
    backgroundColor: "#22c55e15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#22c55e",
  },
  itemList: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  itemQty: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  smartMixCard: {
    marginHorizontal: 20,
    backgroundColor: "#8b5cf612",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#8b5cf630",
    padding: 14,
    marginBottom: 16,
  },
  smartMixHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  smartMixTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#8b5cf6",
  },
  smartMixContent: {
    gap: 6,
    marginBottom: 10,
  },
  smartMixRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  smartMixRetailer: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  smartMixItems: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  smartMixPrice: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#22c55e",
  },
  smartMixTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#8b5cf620",
  },
  smartMixTotalLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  smartMixTotalPrice: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: "#22c55e",
  },
  smartMixSavings: {
    backgroundColor: "#22c55e12",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  smartMixSavingsText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#22c55e",
    textAlign: "center" as const,
  },
  smartMixCaveat: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: "center" as const,
    marginTop: 6,
  },
  bulkSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  bulkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 20,
  },
  bulkCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    marginBottom: 8,
  },
  bulkTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  bulkName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  bulkSavingsBadge: {
    backgroundColor: "#22c55e15",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bulkSavingsText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#22c55e",
  },
  bulkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bulkOption: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
  },
  bulkOptionBulk: {
    flex: 1,
    backgroundColor: "#22c55e10",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#22c55e30",
  },
  bulkOptionLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  bulkOptionValue: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  bulkOptionValueBulk: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#22c55e",
  },
  bulkOptionPerUnit: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  bulkOptionPerUnitBulk: {
    fontSize: 11,
    color: "#22c55e",
    marginTop: 2,
  },
  bulkArrow: {
    width: 24,
    alignItems: "center" as const,
  },
  bulkArrowText: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  bulkHint: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 8,
    fontStyle: "italic" as const,
  },
  closeBtn: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  upgradeCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginHorizontal: 32,
    alignSelf: "center",
    marginBottom: 32,
  },
  upgradeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FDF6E3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center" as const,
    marginBottom: 8,
  },
  upgradeMessage: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    backgroundColor: Colors.premiumGold,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  upgradeBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#fff",
  },
  laterBtn: {
    paddingVertical: 10,
  },
  laterBtnText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
});
