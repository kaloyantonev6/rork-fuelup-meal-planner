/**
 * FuelUp design system — typography, spacing and radius scales.
 *
 * Typography uses the system font stack (San Francisco on iOS,
 * Roboto on Android) with tightened letter-spacing on headings
 * and negative tracking on large stats for a premium feel.
 */
import { TextStyle } from "react-native";
import Colors from "@/constants/colors";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

const bold = "700" as const;
const semibold = "600" as const;
const medium = "500" as const;
const regular = "400" as const;

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: bold,
    letterSpacing: -0.5,
    lineHeight: 34,
    color: Colors.text,
  } satisfies TextStyle,
  h2: {
    fontSize: 22,
    fontWeight: bold,
    letterSpacing: -0.3,
    lineHeight: 28,
    color: Colors.text,
  } satisfies TextStyle,
  h3: {
    fontSize: 18,
    fontWeight: semibold,
    letterSpacing: -0.2,
    lineHeight: 24,
    color: Colors.text,
  } satisfies TextStyle,

  bodyLarge: { fontSize: 16, fontWeight: regular, lineHeight: 24 } satisfies TextStyle,
  body: { fontSize: 14, fontWeight: regular, lineHeight: 20 } satisfies TextStyle,
  bodyMedium: { fontSize: 14, fontWeight: medium, lineHeight: 20 } satisfies TextStyle,
  bodySmall: { fontSize: 12, fontWeight: regular, lineHeight: 16 } satisfies TextStyle,

  label: {
    fontSize: 11,
    fontWeight: semibold,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
    lineHeight: 14,
  } satisfies TextStyle,
  labelSmall: {
    fontSize: 10,
    fontWeight: semibold,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    lineHeight: 12,
  } satisfies TextStyle,

  statLarge: {
    fontSize: 32,
    fontWeight: bold,
    letterSpacing: -1,
    lineHeight: 38,
  } satisfies TextStyle,
  statMedium: {
    fontSize: 24,
    fontWeight: bold,
    letterSpacing: -0.5,
    lineHeight: 30,
  } satisfies TextStyle,
  statSmall: {
    fontSize: 18,
    fontWeight: semibold,
    lineHeight: 22,
  } satisfies TextStyle,
};

/** Standard card — every card in the app uses this base. */
export const cardStyle = {
  backgroundColor: Colors.bg2,
  borderRadius: radius.lg,
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: Colors.border,
} as const;

/** Elevated card — primary actions, today's plan, match day. */
export const elevatedCardStyle = {
  backgroundColor: Colors.bg3,
  borderRadius: radius.xl,
  padding: spacing.xl,
  borderWidth: 1,
  borderColor: Colors.borderLight,
} as const;

/** Glass card — overlays, modals, premium upsell. */
export const glassCardStyle = {
  backgroundColor: "rgba(22, 26, 32, 0.85)",
  borderRadius: radius.xl,
  padding: spacing.xl,
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.06)",
} as const;

/** Animation timing presets shared across the app. */
export const motion = {
  entryDuration: 300,
  entryStagger: 60,
  pressScale: 0.97,
  progressDuration: 600,
  progressDelay: 200,
} as const;
