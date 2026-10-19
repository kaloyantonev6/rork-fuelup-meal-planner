import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import Colors from "@/constants/colors";
import { fonts } from "@/constants/design";
import ProgressRing from "@/components/ui/ProgressRing";
import { metricLevel } from "@/lib/sleepPerformance";

/**
 * WHOOP-style performance scorecard pieces shared by the Sleep and Hydration
 * screens: a big hero ring with level dashes, uppercase metric rows with a
 * three-dash level bar, and the Poor / Sufficient / Optimal legend.
 */

export const LEVEL_COLORS = ["#F5A623", "#8A949C", "#2EE6B0"] as const; // poor, sufficient, optimal
export const RING_ACCENT = Colors.metricSleep; // desaturated ice blue — the hero arc

// ── Hero ring ────────────────────────────────────────────────────────────────

interface RingHeroProps {
  brand?: string;
  /** 0–100, null renders an em dash placeholder. */
  percent: number | null;
  label: string;
  /** Headline metric level — drives the three indicator dashes. */
  level: 0 | 1 | 2 | null;
  ringColor?: string;
  size?: number;
  strokeWidth?: number;
  subText?: string;
}

export function RingHero({
  brand,
  percent,
  label,
  level,
  ringColor = RING_ACCENT,
  size = 216,
  strokeWidth = 15,
  subText,
}: RingHeroProps) {
  const progress = percent === null ? 0 : Math.min(percent / 100, 1);
  const lines = label.split("\n");

  return (
    <View style={hero.wrap} accessibilityLabel={`${label}: ${percent !== null ? `${percent}%` : "no data"}`}>
      <ProgressRing
        progress={progress}
        size={size}
        strokeWidth={strokeWidth}
        color={ringColor}
        trackColor={Colors.metricTrack}
      >
        <View style={hero.center}>
          {brand ? <Text style={hero.brand}>{brand}</Text> : null}
          <Text style={hero.value}>
            {percent === null ? "–" : Math.round(percent)}
            {percent !== null ? <Text style={hero.unit}>%</Text> : null}
          </Text>
          {lines.map((line, i) => (
            <Text key={`${line}-${i}`} style={hero.label}>
              {line}
            </Text>
          ))}
          <View style={hero.dashRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  hero.dash,
                  { backgroundColor: level !== null && i === level ? LEVEL_COLORS[level] : "#3A444C" },
                ]}
              />
            ))}
          </View>
        </View>
      </ProgressRing>
      {subText ? <Text style={hero.subText}>{subText}</Text> : null}
    </View>
  );
}

const hero = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 10,
  },
  center: {
    alignItems: "center",
    width: "100%",
  },
  brand: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 6,
    marginBottom: 6,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 66,
    color: Colors.text,
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
    lineHeight: 72,
  },
  unit: {
    fontFamily: fonts.label,
    fontSize: 32,
    color: Colors.text,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: Colors.text,
    letterSpacing: 2.2,
    marginTop: 4,
    textAlign: "center",
  },
  dashRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  dash: {
    width: 18,
    height: 4,
    borderRadius: 2,
  },
  subText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
    textAlign: "center",
  },
});

// ── Metric row ───────────────────────────────────────────────────────────────

interface MetricRowProps {
  icon: LucideIcon;
  label: string;
  /** Display value, e.g. "62%". */
  value: string;
  /** Precomputed level (0 poor, 1 sufficient, 2 optimal) or null for no data. */
  level: 0 | 1 | 2 | null;
  last?: boolean;
}

export function MetricRow({ icon: Icon, label, value, level, last = false }: MetricRowProps) {
  return (
    <View style={[row.row, !last && row.rowBordered]}>
      <Icon size={17} color="rgba(241,245,249,0.6)" strokeWidth={2} />
      <Text style={row.label}>{label}</Text>
      <View style={row.bar}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              row.barDash,
              {
                backgroundColor:
                  level !== null && i === level ? LEVEL_COLORS[level] : "#323B42",
              },
            ]}
          />
        ))}
      </View>
      <Text style={row.value}>{value}</Text>
    </View>
  );
}

const row = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 15,
  },
  rowBordered: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(241,245,249,0.08)",
  },
  label: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 1.6,
  },
  bar: {
    flexDirection: "row",
    gap: 4,
  },
  barDash: {
    width: 14,
    height: 4,
    borderRadius: 2,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: Colors.text,
    minWidth: 58,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
});

// ── Legend ───────────────────────────────────────────────────────────────────

export function MetricLegend() {
  return (
    <View style={legend.wrap}>
      {["Poor", "Sufficient", "Optimal"].map((label, i) => (
        <View key={label} style={legend.item}>
          <View style={[legend.dash, { backgroundColor: LEVEL_COLORS[i] }]} />
          <Text style={legend.text}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const legend = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dash: {
    width: 14,
    height: 4,
    borderRadius: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
  },
});

// ── Range helpers ────────────────────────────────────────────────────────────

/** "OCT 13 TO TODAY" — start of the 7-day window in the header. */
export function rangeLabel(days = 6): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const start = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  return `${start} TO TODAY`;
}

export { metricLevel };
