import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";

interface AnimatedTabIconProps {
  focused: boolean;
  children: React.ReactNode;
}

/**
 * Tab bar icon with a spring scale to 1.15 when focused and a small
 * 4px accent dot indicator below the active icon.
 */
export default function AnimatedTabIcon({ focused, children }: AnimatedTabIconProps) {
  const scale = useRef(new Animated.Value(focused ? 1.15 : 1)).current;
  const dot = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 6,
    }).start();
    Animated.timing(dot, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focused, scale, dot]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale }], alignItems: "center", justifyContent: "center" }}>
        {children}
      </Animated.View>
      <Animated.View
        style={[
          styles.dot,
          {
            opacity: dot,
            transform: [{ scale: dot }],
            backgroundColor: Colors.accent,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
    paddingTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
});
