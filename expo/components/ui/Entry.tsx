import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, ViewStyle } from "react-native";

interface EntryProps {
  /** Stagger delay in ms (e.g. index * 60). */
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Card entry animation: fades in and slides up 20px over 300ms with
 * Easing.out(cubic). Use `delay` to stagger siblings.
 */
export default function Entry({ delay = 0, style, children }: EntryProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
