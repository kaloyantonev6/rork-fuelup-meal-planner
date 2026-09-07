import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { motion } from "@/constants/design";

/**
 * Returns a number that counts up from 0 to `target` over 600ms with
 * Easing.out(cubic), in sync with progress bar/ring fills.
 */
export function useCountUp(target: number, duration = motion.progressDuration, delay = motion.progressDelay): number {
  const anim = useRef(new Animated.Value(0)).current;
  const [value, setValue] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => {
      setValue(Math.round(target * v));
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
