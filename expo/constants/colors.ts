/**
 * Fuelify design system — color tokens.
 *
 * Performance-wearable palette: a cool slate canvas that fades from a lit
 * blue-grey at the top to near-black at the bottom, charcoal slate cards,
 * crisp white type with cool grey secondaries, and a small set of saturated
 * metric accents (sleep blue-grey, fuel mint, hydration blue).
 *
 * Legacy key names (background, surface, card, primary, ...) are kept and
 * remapped onto the scale so the whole app inherits the palette without
 * touching every screen.
 */
const Colors = {
  // ── Canvas gradient (top → bottom) ──────────────────────────
  canvasTop: "#26323A",
  canvasMid: "#161D22",
  canvasBottom: "#0C1013",

  // ── Backgrounds (layered depth) ─────────────────────────────
  bg0: "#0F1417", // deepest background (behind everything)
  bg1: "#141A1E", // primary screen background
  bg2: "#1C2328", // card background
  bg3: "#242C32", // elevated card / active states
  bg4: "#2F383F", // inputs, toggles off-state, tracks

  // ── Legacy surface aliases → new scale ──────────────────────
  background: "#0F1417",
  surface: "#1C2328",
  surfaceElevated: "#242C32",
  surfaceAlt: "#2F383F",
  card: "#1C2328",
  cardBorder: "#273037",

  // ── Borders ─────────────────────────────────────────────────
  border: "#273037",
  borderLight: "#343E46",

  // ── Text ────────────────────────────────────────────────────
  text: "#FFFFFF",
  textSecondary: "#9AA5AD",
  textTertiary: "#5F6B74",
  textInverse: "#0C1013",
  textOnAccent: "#0C1013",

  // ── Brand accent (mint teal) ────────────────────────────────
  primary: "#2EE6B0",
  primaryDark: "#20C496",
  primaryLight: "#2EE6B01F", // 12% — tint backgrounds
  accentMuted: "#2EE6B01F", // subtle glows, tag backgrounds
  accentLight: "#2EE6B040", // progress tracks, pressed states
  accentGradientStart: "#2EE6B0",
  accentGradientEnd: "#20C496",

  // ── Metric accents (dial colours) ───────────────────────────
  metricSleep: "#7BA1BB", // desaturated steel blue
  metricFuel: "#2EE6B0", // brand mint
  metricHydration: "#1E9BEA", // electric blue
  metricTrack: "#2C353C", // dial track
  insightStart: "#6E6AF0", // insight card gradient border
  insightEnd: "#3BA7D9",

  // ── Day type accents ────────────────────────────────────────
  match: "#FF4D5E",
  matchLight: "#FF4D5E20",
  training: "#3DDC84",
  trainingLight: "#3DDC8420",
  recovery: "#FFC93C",
  recoveryLight: "#FFC93C20",
  rest: "#7E8A93",
  restLight: "#7E8A9320",

  // ── Status ──────────────────────────────────────────────────
  error: "#FF4D5E",
  success: "#2EE6B0",
  warning: "#F5A623",

  // ── Tab bar ─────────────────────────────────────────────────
  tabBar: "#0E1215",
  tabIconDefault: "#6B7780",
  tint: "#FFFFFF",
  tabIconSelected: "#FFFFFF",

  // ── Premium ─────────────────────────────────────────────────
  premiumGold: "#D4A44C",
  premiumGoldLight: "#F0D68A",

  // ── Legacy compat ───────────────────────────────────────────
  accent: "#2EE6B0",
  discount: "#2EE6B0",
  overlay: "rgba(0,0,0,0.6)",
  tagBg: "#2EE6B01F",
  tagText: "#2EE6B0",
} as const;

export default Colors;
