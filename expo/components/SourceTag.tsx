import React from "react";
import { Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

/** Source attribution line: bodySmall, textTertiary, italic, 📚 prefix. */
export default function SourceTag({ text, style }: { text: string; style?: object }) {
  return <Text style={[styles.tag, style]}>📚 {text}</Text>;
}

const styles = StyleSheet.create({
  tag: {
    fontSize: 11,
    fontStyle: "italic",
    color: Colors.textTertiary,
  },
});
