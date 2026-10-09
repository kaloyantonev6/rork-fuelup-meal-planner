import React, { useCallback, useEffect, useRef } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelColumnProps {
  /** Display options; index in this array is the source of truth. */
  options: string[];
  index: number;
  onIndexChange: (index: number) => void;
  width: number | `${number}%`;
}

/**
 * One iOS-style picker wheel: scroll to select, snap-to-item, tick haptics on
 * value change and tap-to-select on rows.
 */
function WheelColumn({ options, index, onIndexChange, width }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lastIndex = useRef<number>(index);
  const didInitialScroll = useRef<boolean>(false);

  // Position the wheel at the current value without animation on mount/value change.
  useEffect(() => {
    if (didInitialScroll.current && lastIndex.current !== index) {
      scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
      lastIndex.current = index;
    }
  }, [index]);

  const settle = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const next = Math.max(0, Math.min(options.length - 1, Math.round(y / ITEM_HEIGHT)));
      if (next !== lastIndex.current) {
        lastIndex.current = next;
        void Haptics.selectionAsync().catch(() => undefined);
        onIndexChange(next);
      }
    },
    [options.length, onIndexChange],
  );

  return (
    <View style={[styles.wheel, { width }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled
        onMomentumScrollEnd={settle}
        onLayout={() => {
          if (!didInitialScroll.current) {
            didInitialScroll.current = true;
            scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
          }
        }}
        contentContainerStyle={{ paddingVertical: (WHEEL_HEIGHT - ITEM_HEIGHT) / 2 }}
      >
        {options.map((option, i) => {
          const distance = Math.abs(i - index);
          const isSelected = distance === 0;
          return (
            <Pressable
              key={`${option}-${i}`}
              onPress={() => scrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true })}
              style={[styles.item, { height: ITEM_HEIGHT }]}
            >
              <Text
                style={[
                  styles.itemText,
                  isSelected && styles.itemTextSelected,
                  distance > 1 && styles.itemTextFar,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {/* Edge fades, iOS picker style */}
      <LinearGradient
        pointerEvents="none"
        colors={[Colors.bg2, "transparent"]}
        style={[styles.fade, { top: 0 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", Colors.bg2]}
        style={[styles.fade, { bottom: 0 }]}
      />
      {/* Selection hairlines */}
      <View pointerEvents="none" style={[styles.hairline, { top: (WHEEL_HEIGHT - ITEM_HEIGHT) / 2 }]} />
      <View pointerEvents="none" style={[styles.hairline, { bottom: (WHEEL_HEIGHT - ITEM_HEIGHT) / 2 }]} />
    </View>
  );
}

interface SleepWheelPickerProps {
  /** Selected hour (0–14). */
  hours: number;
  /** Selected minutes, 5-minute steps (0–55). */
  minutes: number;
  onHoursChange: (hours: number) => void;
  onMinutesChange: (minutes: number) => void;
}

const HOUR_OPTIONS = Array.from({ length: 15 }, (_, i) => `${i}h`);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => `${String(i * 5).padStart(2, "0")}m`);

/** Side-by-side hour + minute wheels for logging sleep duration. */
export default function SleepWheelPicker({ hours, minutes, onHoursChange, onMinutesChange }: SleepWheelPickerProps) {
  return (
    <View style={styles.row}>
      <WheelColumn options={HOUR_OPTIONS} index={hours} onIndexChange={onHoursChange} width={110} />
      <WheelColumn options={MINUTE_OPTIONS} index={minutes} onIndexChange={onMinutesChange} width={110} />
    </View>
  );
}

const WAKE_HOUR_OPTIONS = ["04", "05", "06", "07", "08", "09", "10", "11"];
const WAKE_MINUTE_OPTIONS = ["00", "15", "30", "45"];

interface TimeWheelPickerProps {
  /** "HH:MM" 24-hour value. */
  value: string;
  onChange: (value: string) => void;
}

/** Compact hour + minute wheels for picking a clock time (wake time). */
export function TimeWheelPicker({ value, onChange }: TimeWheelPickerProps) {
  const [h, m] = value.split(":").map(Number);
  const hourIndex = Math.max(0, Math.min(WAKE_HOUR_OPTIONS.length - 1, (h ?? 7) - 4));
  const minuteIndex = Math.max(0, Math.min(WAKE_MINUTE_OPTIONS.length - 1, Math.round((m ?? 0) / 15)));

  const handleHour = useCallback(
    (index: number) => {
      onChange(`${WAKE_HOUR_OPTIONS[index]}:${String(WAKE_MINUTE_OPTIONS[minuteIndex]).slice(0, 2)}`);
    },
    [minuteIndex, onChange],
  );
  const handleMinute = useCallback(
    (index: number) => {
      onChange(`${WAKE_HOUR_OPTIONS[hourIndex]}:${WAKE_MINUTE_OPTIONS[index]}`);
    },
    [hourIndex, onChange],
  );

  return (
    <View style={styles.row}>
      <WheelColumn options={WAKE_HOUR_OPTIONS} index={hourIndex} onIndexChange={handleHour} width={88} />
      <WheelColumn options={WAKE_MINUTE_OPTIONS} index={minuteIndex} onIndexChange={handleMinute} width={88} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  wheel: {
    height: WHEEL_HEIGHT,
    backgroundColor: Colors.bg2,
    borderRadius: 16,
    overflow: "hidden",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontSize: 21,
    fontWeight: "500",
    color: Colors.textTertiary,
    fontVariant: ["tabular-nums"],
  },
  itemTextSelected: {
    fontSize: 25,
    fontWeight: "700",
    color: Colors.text,
  },
  itemTextFar: {
    fontSize: 18,
    opacity: 0.5,
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
  },
  hairline: {
    position: "absolute",
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
});
