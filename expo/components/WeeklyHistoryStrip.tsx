import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import type { DailyTracking } from "@/constants/mealTimes";

interface WeeklyHistoryStripProps {
  history: DailyTracking[];
  /** Live tracking for today (may not be in history yet) */
  today: DailyTracking | null;
}

interface DayCell {
  date: string;
  dayLabel: string;
  tracking: DailyTracking | null;
  isFuture: boolean;
  isToday: boolean;
}

function toLocalDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Teal intensity by completion; red tint when the day had meals but 0% completion. */
function cellColor(cell: DayCell): string {
  if (cell.isFuture || !cell.tracking || cell.tracking.meals.length === 0) return Colors.bg3;
  const pct = cell.tracking.completionPercent;
  if (pct >= 100) return "#2DD4A840";
  if (pct >= 75) return "#2DD4A830";
  if (pct >= 50) return "#2DD4A820";
  if (pct > 0) return "#2DD4A810";
  return "#EF444420";
}

/**
 * "This Week" heatmap: Mon–Sun cells shaded by meal completion (last 4 weeks of
 * history is kept internally). Tapping a day shows its breakdown in a tooltip row.
 */
export default function WeeklyHistoryStrip({ history, today }: WeeklyHistoryStripProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo<DayCell[]>(() => {
    const now = new Date();
    const todayStr = toLocalDate(now);
    const dow = now.getDay(); // 0 = Sunday
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + mondayOffset + i);
      const date = toLocalDate(d);
      const isFuture = date > todayStr;
      const isToday = date === todayStr;
      const tracking = isToday ? today : (history.find((h) => h.date === date) ?? null);
      return { date, dayLabel: DAY_LABELS[i], tracking, isFuture, isToday };
    });
  }, [history, today]);

  const selectedCell = cells.find((c) => c.date === selected) ?? null;

  const breakdown = (cell: DayCell): string | null => {
    const t = cell.tracking;
    if (!t || t.meals.length === 0) return null;
    const done = t.meals.filter((m) => m.completedAt).length;
    const skipped = t.meals.filter((m) => m.skipped).length;
    const missed = t.meals.length - done - skipped;
    const parts = [`${done}/${t.meals.length} meals`, `${t.caloriesConsumed.toLocaleString()} kcal`];
    if (skipped > 0) parts.push(`${skipped} skipped`);
    if (missed > 0) parts.push(`${missed} missed`);
    return parts.join(" · ");
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>This Week</Text>
      <View style={styles.row}>
        {cells.map((cell) => {
          const t = cell.tracking;
          const hasData = t && t.meals.length > 0;
          const pct = hasData ? t.completionPercent : 0;
          const isSelected = selected === cell.date;
          return (
            <Pressable
              key={cell.date}
              onPress={() => hasData ? setSelected(isSelected ? null : cell.date) : undefined}
              style={styles.cellWrap}
            >
              <Text style={styles.dayLabel}>{cell.dayLabel}</Text>
              <View
                style={[
                  styles.cell,
                  { backgroundColor: cellColor(cell) },
                  cell.isToday && styles.todayRing,
                  isSelected && styles.selectedRing,
                ]}
              >
                <Text
                  style={[
                    styles.cellText,
                    {
                      color:
                        !hasData || cell.isFuture
                          ? Colors.textTertiary
                          : pct > 0
                            ? Colors.primary
                            : "#EF4444",
                    },
                  ]}
                >
                  {cell.isFuture || !hasData ? "·" : pct >= 100 ? "✓" : pct > 0 ? `${pct}%` : "—"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {selectedCell && breakdown(selectedCell) ? (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {selectedCell.isToday ? "Today" : selectedCell.dayLabel}: {breakdown(selectedCell)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cellWrap: {
    alignItems: "center",
    gap: 6,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  cell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  todayRing: {
    borderWidth: 2,
    borderColor: "#F1F5F9",
  },
  selectedRing: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  cellText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  tooltip: {
    marginTop: 12,
    backgroundColor: Colors.bg3,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  tooltipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
