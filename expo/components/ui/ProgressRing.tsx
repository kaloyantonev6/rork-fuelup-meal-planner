import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { motion } from "@/constants/design";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** 0..1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Circular progress ring with a smooth animated fill (rolls from the
 * previous value over 600ms, Easing.out cubic). Center content is
 * rendered via children.
 */
export default function ProgressRing({
  progress,
  size = 104,
  strokeWidth = 6,
  color,
  trackColor,
  children,
  style,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const anim = useRef(new Animated.Value(0)).current;
  const reachedRef = useRef(0);
  const [range, setRange] = useState({ from: 0, to: progress });

  useEffect(() => {
    const from = reachedRef.current;
    if (Math.abs(from - progress) < 0.001) {
      return;
    }
    setRange({ from, to: progress });
    anim.setValue(0);
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: motion.progressDuration,
      delay: motion.progressDelay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(() => {
      reachedRef.current = progress;
    });
    return () => animation.stop();
  }, [progress, anim]);

  const dashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference * (1 - range.from), circumference * (1 - range.to)],
  });

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}
