import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

/**
 * Slate canvas — a lit blue-grey at the top of the screen fading to
 * near-black, the signature backdrop behind every main screen. Render it as
 * the first child of a screen container; it never captures touches.
 */
export default function ScreenBackground({ tint }: { tint?: string }) {
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[Colors.canvasTop, Colors.canvasMid, Colors.canvasBottom]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      {tint ? (
        <LinearGradient
          pointerEvents="none"
          colors={[`${tint}22`, `${tint}00`]}
          locations={[0, 1]}
          style={styles.tint}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  tint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
});
