import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, ViewStyle, StyleProp, ViewProps } from "react-native";
import Colors from "@/constants/colors";
import { spacing, radius, cardStyle, elevatedCardStyle, glassCardStyle } from "@/constants/design";

type CardVariant = "standard" | "elevated" | "glass";

interface CardProps extends ViewProps {
  variant?: CardVariant;
  /** When set, the card fades in and slides up 20px, staggered by `index * 60ms`. */
  index?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, ViewStyle> = {
  standard: cardStyle as ViewStyle,
  elevated: elevatedCardStyle as ViewStyle,
  glass: glassCardStyle as ViewStyle,
};

/**
 * Base card used across the app. No hard shadows — subtle border only.
 * Pass `index` to get a staggered fade + slide-up entry on mount.
 */
export default function Card({ variant = "standard", index, style, children, ...rest }: CardProps) {
  const shouldAnimate = typeof index === "number";
  const opacity = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(shouldAnimate ? 20 : 0)).current;

  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }
    const delay = (index ?? 0) * 60;
    Animated.parallel([
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
    ]).start();
  }, [shouldAnimate, index, opacity, translateY]);

  return (
    <Animated.View
      style={[variantStyles[variant], shouldAnimate && { opacity, transform: [{ translateY }] }, style]}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}
