import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";
import { motion } from "@/constants/design";

/**
 * Drives a ring fill. On first mount the value starts at 0 and eases out to
 * `target` after a short delay (so a pushed screen's slide-in doesn't hide
 * it). Later changes animate from wherever the fill currently is, so
 * interrupted or rapid updates never jump. Honours Reduce Motion.
 */
export function useRingFill(target: number): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  const hasStarted = useRef(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (alive) setReduceMotion(enabled);
      })
      .catch(() => {
        if (alive) setReduceMotion(false);
      });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;
    const safeTarget = Number.isFinite(target) ? target : 0;

    if (reduceMotion) {
      value.setValue(safeTarget);
      hasStarted.current = true;
      return;
    }

    const isFirstFill = !hasStarted.current;
    hasStarted.current = true;

    const animation = Animated.timing(value, {
      toValue: safeTarget,
      duration: motion.progressDuration,
      delay: isFirstFill ? motion.progressDelay : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [target, reduceMotion, value]);

  return value;
}
