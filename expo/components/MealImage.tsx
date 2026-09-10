import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { getMealImage } from "@/lib/pexelsApi";

interface MealImageProps {
  /** Meal title — drives the Pexels search (curated map first). */
  title: string;
  /** Meal category (breakfast/lunch/dinner/snack) for fallback selection. */
  category: string;
  /** Known-good image URL shown if Pexels is unavailable. */
  fallbackUri?: string;
  /** Image height in px (cards: 160, detail hero: 240). */
  height?: number;
  /** Semi-transparent category pill in the top-left corner. */
  showBadge?: boolean;
  /** Rounded corners on the image block. */
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Meal photo with a shimmer placeholder while the Pexels URL resolves, a
 * 300ms fade-in on load, and a bottom gradient for text readability.
 */
export default function MealImage({
  title,
  category,
  fallbackUri,
  height = 160,
  showBadge = false,
  borderRadius = 0,
  style,
}: MealImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    setIsLoaded(false);
    fadeAnim.setValue(0);
    void getMealImage(title, category, fallbackUri).then((url) => {
      if (!cancelled) setImageUrl(url);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const handleLoad = () => {
    setIsLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 400],
  });

  return (
    <View
      style={[
        styles.container,
        { height, borderRadius, overflow: "hidden" },
        style,
      ]}
    >
      {/* Shimmer placeholder — always present until the photo fades in */}
      {!isLoaded ? (
        <View style={[StyleSheet.absoluteFill, styles.shimmerBase]}>
          <Animated.View
            style={[styles.shimmerBar, { transform: [{ translateX }] }]}
          />
        </View>
      ) : null}

      {imageUrl ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            onLoad={handleLoad}
            transition={0}
          />
          {/* Bottom gradient keeps overlaid text readable */}
          <LinearGradient
            colors={["transparent", "#0F1115"]}
            locations={[0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}

      {showBadge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{category.toUpperCase()}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg3,
  },
  shimmerBase: {
    backgroundColor: Colors.bg3,
    justifyContent: "center",
  },
  shimmerBar: {
    width: "40%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(10,13,17,0.7)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
});
