import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";
import Colors from "@/constants/colors";
import { dailySeries, type SleepLog } from "@/lib/sleepEngine";

const CHART_HEIGHT = 150;
const LABEL_HEIGHT = 20;
const PAD_X = 10;
const PAD_TOP = 12;
const PAD_BOTTOM = 8;

/** Catmull-Rom → cubic Bézier smoothing over one run of known points. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) {
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    return "";
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]}`;
}

interface SleepTrendChartProps {
  log: SleepLog;
  /** Age-based minimum target in hours — drawn as a dashed reference line. */
  targetMin: number;
  /** Number of nights to plot (7 → day labels, 28 → week labels). */
  days: number;
}

/**
 * Smooth SVG line chart of nightly sleep with gradient fill, target line and
 * day/week labels. Gaps in the data break the line into separate runs.
 */
export default function SleepTrendChart({ log, targetMin, days }: SleepTrendChartProps) {
  const [width, setWidth] = useState<number>(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const chart = useMemo(() => {
    if (width <= 0) return null;
    const series = dailySeries(log, days);
    const known = series.filter((p) => p.hours !== null).map((p) => p.hours as number);
    if (known.length === 0) return { empty: true as const, series };

    const minVal = Math.min(...known, targetMin);
    const maxVal = Math.max(...known, targetMin);
    const yMin = Math.max(0, Math.floor(minVal - 1));
    const yMax = Math.ceil(maxVal + 0.5);
    const span = yMax - yMin || 1;
    const plotW = width - PAD_X * 2;
    const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

    const pts = series.map((p, i) => ({
      x: PAD_X + (plotW * i) / (days - 1),
      y: p.hours === null ? null : PAD_TOP + plotH - ((p.hours - yMin) / span) * plotH,
      point: p,
    }));

    // Split into runs of consecutive logged nights.
    const runs: { x: number; y: number }[][] = [];
    let current: { x: number; y: number }[] = [];
    for (const p of pts) {
      if (p.y === null) {
        if (current.length > 0) runs.push(current);
        current = [];
      } else {
        current.push({ x: p.x, y: p.y });
      }
    }
    if (current.length > 0) runs.push(current);

    const bottom = CHART_HEIGHT - PAD_BOTTOM;
    const fillPaths = runs
      .filter((run) => run.length > 1)
      .map((run) => `${smoothPath(run)} L ${run[run.length - 1].x} ${bottom} L ${run[0].x} ${bottom} Z`);
    const linePaths = runs.map((run) => smoothPath(run));
    const targetY = PAD_TOP + plotH - ((targetMin - yMin) / span) * plotH;

    return { empty: false as const, series, pts, linePaths, fillPaths, targetY, bottom };
  }, [log, days, width, targetMin]);

  return (
    <View onLayout={onLayout} style={styles.container}>
      {chart && !chart.empty ? (
        <>
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="sleepFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.35" />
                <Stop offset="1" stopColor={Colors.primary} stopOpacity="0.02" />
              </LinearGradient>
            </Defs>
            {chart.fillPaths.map((d, i) => (
              <Path key={`fill-${i}`} d={d} fill="url(#sleepFill)" />
            ))}
            {chart.linePaths.map((d, i) => (
              <Path
                key={`line-${i}`}
                d={d}
                stroke={Colors.primary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            <Line
              x1={PAD_X}
              x2={width - PAD_X}
              y1={chart.targetY}
              y2={chart.targetY}
              stroke={Colors.textTertiary}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            {chart.pts.map((p, i) =>
              p.y === null ? null : (
                <Circle
                  key={`dot-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={i === chart.pts.length - 1 ? 5 : 3}
                  fill={i === chart.pts.length - 1 ? Colors.primary : Colors.bg0}
                  stroke={Colors.primary}
                  strokeWidth={i === chart.pts.length - 1 ? 3 : 1.5}
                />
              ),
            )}
          </Svg>
          <View style={styles.labelRow}>
            {chart.series.map((p, i) => {
              const showLabel = days <= 7 || i % 7 === days - 1 || i === chart.series.length - 1;
              return (
                <View key={p.dateKey} style={styles.labelSlot}>
                  {showLabel ? <Text style={styles.label}>{days <= 7 ? p.label : dateLabel(p.dateKey)}</Text> : null}
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <View style={[styles.placeholder, { width, height: CHART_HEIGHT + LABEL_HEIGHT }]}>
          <Text style={styles.placeholderText}>
            {chart?.empty ? "Log a few nights to see your trend" : ""}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: CHART_HEIGHT + LABEL_HEIGHT,
  },
  labelRow: {
    flexDirection: "row",
    height: LABEL_HEIGHT,
  },
  labelSlot: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
});
