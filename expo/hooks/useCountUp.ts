import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { motion } from "@/constants/design";

/**
 * Returns a number that counts up to `target` over 600ms with
 * Easing.out(cubic). When `target` changes, the value rolls smoothly
 * from its current value to the new one (never jumps).
 */
export function useCountUp(target: number, duration = motion.progressDuration, delay = motion.progressDelay): number {
  const anim = useRef(new Animated.Value(0)).current;
  const currentRef = useRef(0);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const from = currentRef.current;
    anim.setValue(0);
    const id = anim.addListener(({ value: v }) => {
      const next = Math.round(from + (target - from) * v);
      currentRef.current = next;
      setValue(next);
    });
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
      anim.removeListener(id);
    };
  }, [anim, target, duration, delay]);

  return value;
}
