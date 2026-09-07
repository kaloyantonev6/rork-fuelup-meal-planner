import React, { useRef, useCallback } from "react";
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  /** Wrap in an Animated.View that scales on press. Disable to handle your own animation. */
  scaleTo?: number;
  /** Fire a light haptic impact on press-in. */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Tappable wrapper that springs to `scaleTo` (default 0.97) on press
 * and back on release, with optional light haptic feedback.
 */
export default function PressableScale({
  children,
  scaleTo = 0.97,
  haptic = true,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressIn"]>>[0]) => {
      Animated.spring(scale, {
        toValue: scaleTo,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }).start();
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      onPressIn?.(e);
    },
    [scale, scaleTo, haptic, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressOut"]>>[0]) => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }).start();
      onPressOut?.(e);
    },
    [scale, onPressOut],
  );

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
