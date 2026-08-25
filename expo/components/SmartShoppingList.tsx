import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  Switch,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Crown, Check, MapPin, Sparkles, Trophy, Tag, TrendingDown, Users, ShoppingBag, User } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  SmartShoppingItem,
  ShoppingCategory,
  CATEGORY_CONFIGS,
  compileSmartShoppingList,
  calculateRetailerTotals,
  getRetailersForCountry,
  getCountryFlag,
  getCheckedTotal,
  RetailerTotal,
} from "@/utils/shoppingListUtils";
import { GeneratedPlan, ShoppingIngredient } from "@/utils/mealGenerator";
import PriceComparisonModal from "@/components/PriceComparisonModal";
import { isSharedItem, calculateSplitCosts, countryNameToCode } from "@/lib/priceEngine";

interface SmartShoppingListProps {
  plans: GeneratedPlan[];
  country: string;
  isPremium: boolean;
  onUpgrade: () => void;
  onExport: () => void;
  isExporting: boolean;
  shoppingIngredients?: ShoppingIngredient[];
}

export default function SmartShoppingList({
  plans,
  country,
  isPremium,
  onUpgrade,
  onExport,
  isExporting,
  shoppingIngredients,
}: SmartShoppingListProps) {
  const [items, setItems] = useState<SmartShoppingItem[]>(() =>
    compileSmartShoppingList(plans, country)
  );
  const [showPrices, setShowPrices] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPriceComparison, setShowPriceComparison] = useState(false);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [manualSplitOverrides, setManualSplitOverrides] = useState<Record<string, boolean>>({});

  const retailers = useMemo(() => getRetailersForCountry(country), [country]);
  const flag = useMemo(() => getCountryFlag(country), [country]);

  const grouped = useMemo(() => {
    const map = new Map<ShoppingCategory, SmartShoppingItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [items]);

  const retailerTotals = useMemo<RetailerTotal[]>(() => {
    if (!showPrices) return [];
    return calculateRetailerTotals(items, retailers);
  }, [items, retailers, showPrices]);

  const checkedTotal = useMemo(() => getCheckedTotal(items), [items]);
  const totalItems = items.length;
  const checkedCount = useMemo(() => items.filter((i) => i.checked).length, [items]);

  const cheapest = retailerTotals[0];
  const mostExpensive = retailerTotals[retailerTotals.length - 1];
  const savings = cheapest && mostExpensive
    ? Math.round((mostExpensive.total - cheapest.total) * 100) / 100
    : 0;

  const handleToggleCheck = useCallback((id: string) => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  }, [isPremium]);

  const priceComparisonIngredients = useMemo(() => {
    if (!shoppingIngredients || shoppingIngredients.length === 0) {
      return items.map((i) => ({ name: i.name, quantity: 1, unit: "piece" as const }));
    }
    return shoppingIngredients.map((si) => ({ name: si.name, quantity: si.count, unit: "piece" as const }));
  }, [shoppingIngredients, items]);

  const splitCalculations = useMemo(() => {
    if (!splitEnabled) return null;
    const countryCode = countryNameToCode(country);
    const ingredients = items.map((i) => ({
      name: i.name,
      quantity: 1,
      unit: "piece" as const,
      isShared: manualSplitOverrides[i.id] !== undefined ? manualSplitOverrides[i.id] : isSharedItem(i.name),
    }));
    return calculateSplitCosts(ingredients, countryCode, splitCount);
  }, [splitEnabled, items, country, splitCount, manualSplitOverrides]);

  const handleToggleSplit = useCallback((val: boolean) => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSplitEnabled(val);
  }, [isPremium]);

  const handleToggleShared = useCallback((itemId: string, currentIsShared: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setManualSplitOverrides((prev) => ({ ...prev, [itemId]: !currentIsShared }));
  }, []);

  const handleSplitCountChange = useCallback(() => {
    setSplitCount((prev) => (prev >= 4 ? 2 : prev + 1));
  }, []);

  const handleTogglePrices = useCallback((val: boolean) => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPrices(val);
  }, [isPremium]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setItems(compileSmartShoppingList(plans, country));
    setRefreshing(false);
  }, [plans, country]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>🛒 Smart Shopping List</Text>
          <View style={styles.aiBadge}>
            <Sparkles size={10} color={Colors.primary} />
            <Text style={styles.aiBadgeText}>FuelUp AI</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <MapPin size={12} color={Colors.textTertiary} />
          <Text style={styles.locationText}>{flag} {country || "Not set"}</Text>
        </View>
      </View>

      <View style={styles.priceToggleRow}>
        <View style={styles.priceToggleLeft}>
          <Tag size={14} color={showPrices ? Colors.primary : Colors.textTertiary} />
          <Text style={styles.priceToggleLabel}>Show Prices</Text>
          {!isPremium && <Crown size={12} color={Colors.premiumGold} />}
        </View>
        <Switch
          value={showPrices}
          onValueChange={handleTogglePrices}
          trackColor={{ false: Colors.borderLight, true: Colors.primary }}
          thumbColor="#fff"
        />
      </View>

      {isPremium && showPrices && checkedCount > 0 && (
        <BudgetTracker
          checkedTotal={checkedTotal}
          totalEstimate={cheapest?.total ?? 0}
          checkedCount={checkedCount}
          totalItems={totalItems}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
        style={styles.listScroll}
      >
        {CATEGORY_CONFIGS.map((config) => {
          const catItems = grouped.get(config.key);
          if (!catItems || catItems.length === 0) return null;
          return (
            <CategorySection
              key={config.key}
              config={config}
              items={catItems}
              showPrices={showPrices && isPremium}
              isPremium={isPremium}
              onToggleCheck={handleToggleCheck}
            />
          );
        })}

        {isPremium && showPrices && retailerTotals.length > 0 && (
          <PriceComparisonCard
            totals={retailerTotals.slice(0, 3)}
            savings={savings}
            cheapest={cheapest?.retailer ?? ""}
            mostExpensive={mostExpensive?.retailer ?? ""}
          />
        )}

        <Pressable
          onPress={isPremium ? onExport : onUpgrade}
          disabled={isExporting}
          style={({ pressed }) => [
            styles.exportBtn,
            pressed && { opacity: 0.85 },
            isExporting && { opacity: 0.5 },
          ]}
        >
          {!isPremium && <Crown size={14} color={Colors.premiumGold} />}
          <Text style={[styles.exportBtnText, !isPremium && { color: Colors.premiumGold }]}>
            Export Shopping List PDF
          </Text>
        </Pressable>

        <Text style={styles.disclaimer}>Prices are estimated based on average market data</Text>
        <View style={{ height: 20 }} />
      </ScrollView>

      <PriceComparisonModal
        visible={showPriceComparison}
        onClose={() => setShowPriceComparison(false)}
        ingredients={priceComparisonIngredients}
        country={country}
        isPremium={isPremium}
        onUpgrade={onUpgrade}
      />

      <Modal visible={showUpgradeModal} transparent animationType="fade" onRequestClose={() => setShowUpgradeModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowUpgradeModal(false)}>
          <Pressable style={styles.upgradeCard} onPress={() => {}}>
            <View style={styles.upgradeIconWrap}>
              <Crown size={28} color={Colors.premiumGold} />
            </View>
            <Text style={styles.upgradeTitle}>Premium Feature</Text>
            <Text style={styles.upgradeMessage}>
              Price comparison, checkboxes, and smart budget tracking are available with FuelUp Premium.
            </Text>
            <Pressable
              onPress={() => {
                setShowUpgradeModal(false);
                onUpgrade();
              }}
              style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.9 }]}
            >
              <Crown size={16} color="#fff" />
              <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowUpgradeModal(false)}
              style={({ pressed }) => [styles.laterBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.laterBtnText}>Maybe Later</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function BudgetTracker({
  checkedTotal,
  totalEstimate,
  checkedCount,
  totalItems,
}: {
  checkedTotal: number;
  totalEstimate: number;
  checkedCount: number;
  totalItems: number;
}) {
  const progress = totalEstimate > 0 ? checkedTotal / totalEstimate : 0;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: Math.min(progress, 1),
      friction: 10,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [progress, widthAnim]);

  const barColor = progress < 0.5 ? "#22c55e" : progress < 0.75 ? "#f59e0b" : "#ef4444";

  return (
    <View style={styles.budgetCard}>
      <View style={styles.budgetHeader}>
        <Text style={styles.budgetTitle}>Budget Tracker</Text>
        <Text style={styles.budgetCount}>{checkedCount}/{totalItems} items</Text>
      </View>
      <View style={styles.budgetAmountRow}>
        <Text style={[styles.budgetSpent, { color: barColor }]}>€{checkedTotal.toFixed(2)}</Text>
        <Text style={styles.budgetTotal}> / €{totalEstimate.toFixed(2)} est.</Text>
      </View>
      <View style={styles.budgetBarTrack}>
        <Animated.View
          style={[
            styles.budgetBarFill,
            {
              backgroundColor: barColor,
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

function CategorySection({
  config,
  items,
  showPrices,
  isPremium,
  onToggleCheck,
  splitEnabled,
  manualSplitOverrides,
  onToggleShared,
}: {
  config: { key: ShoppingCategory; emoji: string; color: string };
  items: SmartShoppingItem[];
  showPrices: boolean;
  isPremium: boolean;
  onToggleCheck: (id: string) => void;
  splitEnabled?: boolean;
  manualSplitOverrides?: Record<string, boolean>;
  onToggleShared?: (itemId: string, currentIsShared: boolean) => void;
}) {
  return (
    <View style={styles.categorySection}>
      <View style={[styles.categoryHeader, { borderLeftColor: config.color }]}>
        <Text style={styles.categoryTitle}>{config.emoji} {config.key}</Text>
        <View style={[styles.categoryCountBadge, { backgroundColor: config.color + "18" }]}>
          <Text style={[styles.categoryCount, { color: config.color }]}>{items.length}</Text>
        </View>
      </View>
      {items.map((item) => {
        const isShared = manualSplitOverrides?.[item.id] !== undefined
          ? manualSplitOverrides[item.id]
          : isSharedItem(item.name);
        return (
          <IngredientRow
            key={item.id}
            item={item}
            showPrices={showPrices}
            isPremium={isPremium}
            onToggle={() => onToggleCheck(item.id)}
            accentColor={config.color}
            splitEnabled={splitEnabled}
            isShared={isShared}
            onToggleShared={onToggleShared ? () => onToggleShared(item.id, isShared) : undefined}
          />
        );
      })}
    </View>
  );
}

function IngredientRow({
  item,
  showPrices,
  isPremium,
  onToggle,
  accentColor,
  splitEnabled,
  isShared,
  onToggleShared,
}: {
  item: SmartShoppingItem;
  showPrices: boolean;
  isPremium: boolean;
  onToggle: () => void;
  accentColor: string;
  splitEnabled?: boolean;
  isShared?: boolean;
  onToggleShared?: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
    onToggle();
  }, [onToggle, scaleAnim]);

  const handleExpandToggle = useCallback(() => {
    if (!showPrices || !isPremium) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !expanded;
    setExpanded(next);
    Animated.spring(expandAnim, {
      toValue: next ? 1 : 0,
      friction: 12,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [showPrices, isPremium, expanded, expandAnim]);

  const sortedPrices = useMemo(() => {
    if (!item.prices || item.prices.length === 0) return [];
    return [...item.prices].sort((a, b) => a.price - b.price);
  }, [item.prices]);

  const cheapestPrice = sortedPrices.length > 0 ? sortedPrices[0].price : 0;
  const mostExpensivePrice = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1].price : 0;

  const expandHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(sortedPrices.length * 38 + 12, 0)],
  });

  const expandOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleExpandToggle}
        style={({ pressed }) => [
          styles.ingredientRow,
          item.checked && styles.ingredientRowChecked,
          expanded && styles.ingredientRowExpanded,
          pressed && { opacity: 0.85 },
        ]}
      >
        {isPremium ? (
          <View style={[styles.checkbox, item.checked && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
            {item.checked && <Check size={12} color="#fff" />}
          </View>
        ) : (
          <View style={[styles.dot, { backgroundColor: accentColor }]} />
        )}
        <View style={styles.ingredientInfo}>
          <Text
            style={[styles.ingredientName, item.checked && styles.ingredientNameChecked]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.quantity !== "" && (
            <Text style={styles.ingredientQty}>{item.quantity}</Text>
          )}
        </View>
        {showPrices && (
          <View style={styles.ingredientRight}>
            {splitEnabled && onToggleShared ? (
              <Pressable
                onPress={(e) => { e.stopPropagation(); onToggleShared(); }}
                hitSlop={8}
                style={[styles.splitIconBtn, isShared ? styles.splitIconBtnShared : styles.splitIconBtnPersonal]}
              >
                {isShared ? (
                  <Users size={14} color="#8b5cf6" />
                ) : (
                  <User size={14} color="#f59e0b" />
                )}
              </Pressable>
            ) : null}
            <Pressable onPress={handleExpandToggle} hitSlop={8} style={styles.priceColTappable}>
              <View style={styles.priceCol}>
                <Text style={styles.priceText}>€{item.bestPrice.toFixed(2)}</Text>
                <Text style={styles.retailerText}>{item.bestRetailer}</Text>
              </View>
              {isPremium && (
                <View style={[styles.expandArrow, expanded && styles.expandArrowUp]}>
                  <Text style={styles.expandArrowText}>{expanded ? "▲" : "▼"}</Text>
                </View>
              )}
            </Pressable>
          </View>
        )}
      </Pressable>

      {showPrices && isPremium && (
        <Animated.View style={[styles.priceBreakdown, { height: expandHeight, opacity: expandOpacity }]}>
          <View style={styles.priceBreakdownInner}>
            {sortedPrices.map((rp, idx) => {
              const isCheapest = rp.price === cheapestPrice;
              const isMostExpensive = rp.price === mostExpensivePrice && sortedPrices.length > 1;
              const savingsVsCheapest = rp.price - cheapestPrice;
              return (
                <View
                  key={rp.retailer}
                  style={[
                    styles.retailerPriceRow,
                    isCheapest && styles.retailerPriceRowCheapest,
                    idx === sortedPrices.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.retailerPriceLeft}>
                    {isCheapest && (
                      <View style={styles.bestDealBadge}>
                        <Text style={styles.bestDealText}>BEST</Text>
                      </View>
                    )}
                    <Text style={[
                      styles.retailerPriceName,
                      isCheapest && styles.retailerPriceNameBest,
                    ]}>
                      {rp.retailer}
                    </Text>
                  </View>
                  <View style={styles.retailerPriceRight}>
                    {savingsVsCheapest > 0.01 && (
                      <Text style={[
                        styles.retailerPriceDiff,
                        isMostExpensive ? { color: "#ef4444" } : { color: Colors.textTertiary },
                      ]}>
                        +€{savingsVsCheapest.toFixed(2)}
                      </Text>
                    )}
                    <Text style={[
                      styles.retailerPriceValue,
                      isCheapest && styles.retailerPriceValueBest,
                      isMostExpensive && styles.retailerPriceValueExpensive,
                    ]}>
                      €{rp.price.toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

function PriceComparisonCard({
  totals,
  savings,
  cheapest,
  mostExpensive,
}: {
  totals: { retailer: string; total: number }[];
  savings: number;
  cheapest: string;
  mostExpensive: string;
}) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <View style={styles.comparisonCard}>
      <View style={styles.comparisonHeader}>
        <Trophy size={16} color="#f59e0b" />
        <Text style={styles.comparisonTitle}>Best Prices For You</Text>
      </View>
      {totals.map((t, idx) => (
        <View key={t.retailer} style={[styles.comparisonRow, idx === 0 && styles.comparisonRowBest]}>
          <Text style={styles.comparisonMedal}>{medals[idx]}</Text>
          <Text style={[styles.comparisonRetailer, idx === 0 && { color: Colors.text, fontWeight: "700" as const }]}>
            {t.retailer}
          </Text>
          <Text style={[styles.comparisonTotal, idx === 0 && { color: "#22c55e", fontWeight: "700" as const }]}>
            €{t.total.toFixed(2)}
          </Text>
        </View>
      ))}
      {savings > 0 && (
        <View style={styles.savingsRow}>
          <Text style={styles.savingsText}>
            You save €{savings.toFixed(2)} by shopping at {cheapest} vs {mostExpensive}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
  },
  priceToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
  },
  priceToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceToggleLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  listScroll: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 14,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderLeftWidth: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 6,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  categoryCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  ingredientRowChecked: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.borderLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ingredientInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.text,
    flex: 1,
  },
  ingredientNameChecked: {
    textDecorationLine: "line-through" as const,
    color: Colors.textTertiary,
  },
  ingredientQty: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceColTappable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceCol: {
    alignItems: "flex-end",
    gap: 1,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  retailerText: {
    fontSize: 10,
    fontWeight: "500" as const,
    color: "#22c55e",
  },
  expandArrow: {
    width: 16,
    height: 16,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  expandArrowUp: {},
  expandArrowText: {
    fontSize: 8,
    color: Colors.textTertiary,
  },
  ingredientRowExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
  },
  priceBreakdown: {
    overflow: "hidden" as const,
    marginBottom: 4,
  },
  priceBreakdownInner: {
    backgroundColor: Colors.surfaceAlt,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retailerPriceRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  retailerPriceRowCheapest: {
    backgroundColor: "#22c55e0D",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderBottomWidth: 0,
    marginBottom: 2,
  },
  retailerPriceLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    flex: 1,
  },
  bestDealBadge: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bestDealText: {
    fontSize: 8,
    fontWeight: "800" as const,
    color: "#fff",
    letterSpacing: 0.5,
  },
  retailerPriceName: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
  },
  retailerPriceNameBest: {
    color: Colors.text,
    fontWeight: "600" as const,
  },
  retailerPriceRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  retailerPriceDiff: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  retailerPriceValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    minWidth: 52,
    textAlign: "right" as const,
  },
  retailerPriceValueBest: {
    color: "#22c55e",
    fontWeight: "700" as const,
  },
  retailerPriceValueExpensive: {
    color: "#ef4444",
  },
  budgetCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  budgetTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  budgetCount: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  budgetAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  budgetSpent: {
    fontSize: 22,
    fontWeight: "800" as const,
  },
  budgetTotal: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.textTertiary,
  },
  budgetBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    overflow: "hidden",
  },
  budgetBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  comparisonCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginTop: 6,
    marginBottom: 14,
  },
  comparisonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  comparisonTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  comparisonRowBest: {
    backgroundColor: "#22c55e10",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 2,
  },
  comparisonMedal: {
    fontSize: 18,
    width: 28,
  },
  comparisonRetailer: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
  },
  comparisonTotal: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  savingsRow: {
    marginTop: 12,
    backgroundColor: "#22c55e10",
    borderRadius: 8,
    padding: 10,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#22c55e",
    textAlign: "center" as const,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginTop: 6,
  },
  exportBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  disclaimer: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: Colors.textTertiary,
    textAlign: "center" as const,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  upgradeCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
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
  compareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: 10,
  },
  compareBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  splitToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
  },
  splitToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  splitToggleLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  splitPanel: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
    gap: 10,
  },
  splitCountBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    alignItems: "center" as const,
  },
  splitCountText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  splitCountHint: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  splitSummary: {
    gap: 6,
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  splitLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
  },
  splitValue: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  splitTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
    marginTop: 4,
  },
  splitTotalLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  splitTotalValue: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  ingredientRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  splitIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  splitIconBtnShared: {
    backgroundColor: "#8b5cf615",
  },
  splitIconBtnPersonal: {
    backgroundColor: "#f59e0b15",
  },
});
