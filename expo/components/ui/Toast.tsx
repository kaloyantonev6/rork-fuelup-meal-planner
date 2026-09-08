import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

interface ToastProps {
  visible: boolean;
  message: string;
  /** Emoji shown before the message */
  icon?: string;
  /** Accent dot color (defaults to the teal accent) */
  accentColor?: string;
  /** Auto-dismiss delay in ms */
  duration?: number;
  onHide?: () => void;
}

/**
 * Lightweight in-app toast that slides in from the top, holds for `duration`,
 * then fades out and calls onHide. Renders nothing visible while hidden.
 */
export default function Toast({
  visible,
  message,
  icon,
  accentColor = Colors.primary,
  duration = 2200,
  onHide,
}: ToastProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    if (!visible) return;
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        onHideRef.current?.();
      });
    }, duration);
    return () => clearTimeout(timer);
  }, [visible, message, duration, anim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: accentColor }]} />
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 100,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  icon: {
    fontSize: 14,
  },
  message: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
});
