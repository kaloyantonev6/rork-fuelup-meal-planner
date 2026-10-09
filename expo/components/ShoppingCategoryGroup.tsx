import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Apple, Beef, Carrot, ChevronDown, Milk, Package, Wheat, CookingPot } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import type { CategoryConfig, ShoppingCategory, SmartShoppingItem } from "@/utils/shoppingListUtils";

const CATEGORY_ICONS = {
  Proteins: Beef,
  Vegetables: Carrot,
  Fruits: Apple,
  Dairy: Milk,
  "Grains & Carbs": Wheat,
  "Pantry & Spices": CookingPot,
  Other: Package,
};

interface ShoppingCategoryGroupProps {
  categories: CategoryConfig[];
  grouped: Map<ShoppingCategory, SmartShoppingItem[]>;
  renderItems: (category: CategoryConfig) => React.ReactNode;
}

/** A compact pair of aisle cards with an animated, measured ingredient drawer. */
export default function ShoppingCategoryGroup({ categories, grouped, renderItems }: ShoppingCategoryGroupProps) {
  const [active, setActive] = useState<CategoryConfig | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const height = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.spring(height, {
        toValue: isOpen ? contentHeight : 0,
        damping: 26,
        stiffness: 210,
        mass: 1,
        overshootClamping: true,
        useNativeDriver: false,
      }),
      Animated.timing(reveal, { toValue: isOpen ? 1 : 0, duration: 220, useNativeDriver: false }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [isOpen, contentHeight, height, reveal]);

  const toggle = (category: CategoryConfig) => {
    void Haptics.selectionAsync().catch(() => undefined);
    if (active?.key === category.key) {
      setIsOpen((prev) => !prev);
    } else {
      setActive(category);
      setIsOpen(true);
    }
  };

  return (
    <View style={styles.group}>
      <View style={styles.row}>
        {categories.map((category) => (
          <CategoryTile
            key={category.key}
            category={category.key}
            items={grouped.get(category.key) ?? []}
            expanded={isOpen && active?.key === category.key}
            onPress={() => toggle(category)}
          />
        ))}
      </View>
      <Animated.View
        pointerEvents={isOpen ? "auto" : "none"}
        accessibilityElementsHidden={!isOpen}
        importantForAccessibility={isOpen ? "auto" : "no-hide-descendants"}
        style={{ height, overflow: "hidden", opacity: reveal }}
      >
        {active ? (
          <View
            style={styles.drawerMeasure}
            onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
          >
            <View style={styles.drawer}>{renderItems(active)}</View>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

function CategoryTile({ category, items, expanded, onPress }: {
  category: ShoppingCategory;
  items: SmartShoppingItem[];
  expanded: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const arrow = useRef(new Animated.Value(0)).current;
  const Icon = CATEGORY_ICONS[category];
  const checked = items.filter((item) => item.checked).length;

  useEffect(() => {
    const animation = Animated.spring(arrow, { toValue: expanded ? 1 : 0, damping: 20, stiffness: 180, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [expanded, arrow]);

  return (
    <Animated.View style={[styles.tileWrap, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${category}, ${items.length} ingredients`}
        accessibilityState={{ expanded }}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, speed: 45, bounciness: 0, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, speed: 25, bounciness: 3, useNativeDriver: true }).start()}
        style={[styles.tile, expanded && styles.tileActive]}
      >
        <View style={styles.tileTop}>
          <View style={styles.icon}><Icon size={23} color={Colors.primary} strokeWidth={1.7} /></View>
          <Animated.View style={{ transform: [{ rotate: arrow.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}>
            <ChevronDown size={17} color={expanded ? Colors.primary : Colors.textTertiary} />
          </Animated.View>
        </View>
        <Text style={styles.title}>{category}</Text>
        <View style={styles.countRow}>
          <Text style={styles.count}>{items.length}</Text>
          <Text style={styles.caption}>ingredient{items.length === 1 ? "" : "s"}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${items.length ? checked / items.length * 100 : 0}%` }]} />
        </View>
        <Text style={styles.hint}>{checked > 0 ? `${checked} of ${items.length} collected` : expanded ? "Tap to close" : "Tap to explore"}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 10 },
  row: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  tileWrap: { flex: 1 },
  tile: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg2, minHeight: 170 },
  tileActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  tileTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.bg3, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "700", letterSpacing: -0.3, color: Colors.text },
  countRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 },
  count: { fontSize: 26, fontWeight: "800", letterSpacing: -0.8, color: Colors.text, fontVariant: ["tabular-nums"] },
  caption: { fontSize: 11, color: Colors.textSecondary },
  progressTrack: { height: 3, borderRadius: 2, backgroundColor: Colors.bg4, marginTop: 12, overflow: "hidden" },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: Colors.primary },
  hint: { fontSize: 10, fontWeight: "500", color: Colors.textTertiary, marginTop: 7 },
  drawerMeasure: { position: "absolute", top: 0, left: 0, right: 0, paddingTop: 10 },
  drawer: { padding: 10, backgroundColor: Colors.bg2, borderRadius: 18, borderWidth: 1, borderColor: Colors.border },
});
