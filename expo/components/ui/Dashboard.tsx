import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { fonts } from "@/constants/design";
import ProgressRing from "@/components/ui/ProgressRing";

/**
 * Dashboard primitives in the performance-wearable language: compact metric
 * dials, sentence-case section headers, monitor tiles with tracked caps
 * titles, and a gradient-bordered insight card.
 */

function usePressScale(to = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 5 }).start();
  return { scale, onPressIn, onPressOut };
}

// ── Metric dial ──────────────────────────────────────────────────────────────

interface MetricDialProps {
  label: string;
  /** 0–100 or null for no data yet. */
  percent: number | null;
  color: string;
  size: number;
  onPress: () => void;
}

export function MetricDial({ label, percent, color, size, onPress }: MetricDialProps) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.94);
  const progress = percent === null ? 0 : Math.min(Math.max(percent, 0), 100) / 100;
  const valueSize = Math.round(size * 0.27);

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${percent === null ? "no data" : `${Math.round(percent)} percent`}`}
    >
      <Animated.View style={[dial.wrap, { transform: [{ scale }] }]}>
        <ProgressRing
          progress={progress}
          size={size}
          strokeWidth={Math.max(6, Math.round(size * 0.075))}
          color={color}
          trackColor={Colors.metricTrack}
        >
          <Text style={[dial.value, { fontSize: valueSize, lineHeight: valueSize * 1.12 }]}>
            {percent === null ? "–" : Math.round(percent)}
            {percent !== null ? (
              <Text style={[dial.unit, { fontSize: Math.round(valueSize * 0.55) }]}>%</Text>
            ) : null}
          </Text>
        </ProgressRing>
        <View style={dial.captionRow}>
          <Text style={dial.caption}>{label}</Text>
          <ChevronRight size={12} color={Colors.textSecondary} strokeWidth={2.5} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const dial = StyleSheet.create({
  wrap: { alignItems: "center" },
  value: {
    fontFamily: fonts.display,
    color: Colors.text,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
    textAlign: "center",
    includeFontPadding: false,
  },
  unit: {
    fontFamily: fonts.label,
    color: Colors.text,
  },
  captionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 10,
  },
  caption: {
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: 1.4,
    color: Colors.text,
  },
});

// ── Section header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  /** Optional right-side accessory (e.g. square + button). */
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  return (
    <View style={[section.row, style]}>
      <Text style={section.title}>{title}</Text>
      {action}
    </View>
  );
}

const section = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.3,
  },
});

// ── Monitor tile ─────────────────────────────────────────────────────────────

interface MonitorTileProps {
  title: string;
  icon: React.ReactNode;
  status: string;
  statusColor?: string;
  detail: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function MonitorTile({ title, icon, status, statusColor = Colors.primary, detail, onPress, style }: MonitorTileProps) {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <Pressable
      style={[{ flex: 1 }, style]}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${status}. ${detail}`}
    >
      <Animated.View style={[tile.card, { transform: [{ scale }] }]}>
        <View style={tile.titleRow}>
          <Text style={tile.title} numberOfLines={1}>
            {title}
          </Text>
          <ChevronRight size={14} color={Colors.text} strokeWidth={2.5} />
        </View>
        <View style={tile.body}>
          <View style={[tile.iconBox, { backgroundColor: `${statusColor}1F` }]}>{icon}</View>
          <View style={{ flex: 1 }}>
            <Text style={[tile.status, { color: statusColor }]} numberOfLines={1}>
              {status}
            </Text>
            <Text style={tile.detail} numberOfLines={1}>
              {detail}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const tile = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: 1.4,
    color: Colors.text,
    flexShrink: 1,
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  status: {
    fontFamily: fonts.display,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  detail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

// ── Insight card ─────────────────────────────────────────────────────────────

interface InsightCardProps {
  title?: string;
  body: string;
  actionLabel?: string;
  onPress?: () => void;
  /** Optional right-side badge (e.g. completed count). */
  badge?: React.ReactNode;
  children?: React.ReactNode;
  gradient?: boolean;
  /** Clamp the body to N lines (undefined = no clamp). */
  bodyLines?: number;
}

const LINK_COLOR = "#8E8CF5";

export function InsightCard({ title, body, actionLabel, onPress, badge, children, gradient = true, bodyLines }: InsightCardProps) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.98);
  const inner = (
    <View style={insight.inner}>
      <View style={insight.topRow}>
        <View style={{ flex: 1 }}>
          {title ? <Text style={insight.title}>{title}</Text> : null}
          <Text style={insight.body} numberOfLines={bodyLines}>
            {body}
          </Text>
        </View>
        {badge}
      </View>
      {children}
      {actionLabel ? (
        <View style={insight.actionRow}>
          <Text style={insight.action}>{actionLabel}</Text>
          <ArrowRight size={16} color={LINK_COLOR} strokeWidth={2.2} />
        </View>
      ) : null}
    </View>
  );

  return (
    <Pressable
      disabled={!onPress}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {gradient ? (
          <LinearGradient
            colors={[Colors.insightStart, Colors.insightEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={insight.border}
          >
            {inner}
          </LinearGradient>
        ) : (
          <View style={[insight.border, insight.plainBorder]}>{inner}</View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const insight = StyleSheet.create({
  border: {
    borderRadius: 16,
    padding: 1,
  },
  plainBorder: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  inner: {
    backgroundColor: "#171E23",
    borderRadius: 15,
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: "rgba(255,255,255,0.86)",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  action: {
    fontFamily: fonts.display,
    fontSize: 13,
    letterSpacing: 1.6,
    color: LINK_COLOR,
  },
});

// ── Pill ─────────────────────────────────────────────────────────────────────

/** Small rounded chip used in top bars (e.g. TODAY, streaks). */
export function TopPill({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[pill.wrap, style]}>{children}</View>;
}

const pill = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 32,
  },
});

// ── Screen header ────────────────────────────────────────────────────────────

interface ScreenHeaderProps {
  /** Tracked caps title, centred. */
  title: string;
  /** Optional small caps line under the title (e.g. a date range). */
  subtitle?: string;
  /** Show the circular back button on the left (default true). */
  onBack?: (() => void) | null;
  /** Right-side accessory (icon buttons). */
  right?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Detail-screen header: circular back button, centred tracked caps title with
 * an optional caps subtitle, and right-side icon actions. Height is fixed so
 * every screen's content starts at the same line.
 */
export function ScreenHeader({ title, subtitle, onBack, right, style }: ScreenHeaderProps) {
  return (
    <View style={[header.row, style]}>
      <View style={header.side}>
        {onBack ? (
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBack();
            }}
            hitSlop={8}
            style={({ pressed }) => [header.iconBtn, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={22} color={Colors.text} strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>
      <View style={header.center}>
        <Text style={header.title} numberOfLines={1}>
          {title.toUpperCase()}
        </Text>
        {subtitle ? (
          <Text style={header.subtitle} numberOfLines={1}>
            {subtitle.toUpperCase()}
          </Text>
        ) : null}
      </View>
      <View style={[header.side, header.sideRight]}>{right}</View>
    </View>
  );
}

/** Round, translucent icon button for header actions. */
export function HeaderIconButton({
  children,
  onPress,
  label,
  badge = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  label: string;
  badge?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => [header.iconBtn, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {children}
      {badge ? <View style={header.badge} /> : null}
    </Pressable>
  );
}

const header = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    marginBottom: 6,
  },
  side: {
    minWidth: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  center: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 15,
    letterSpacing: 1.8,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.canvasTop,
  },
});

// ── Slate card ───────────────────────────────────────────────────────────────

/** Standard slate surface — the base of every list/section card. */
export function SlateCard({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[slate.card, style]}>{children}</View>;
}

const slate = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});
