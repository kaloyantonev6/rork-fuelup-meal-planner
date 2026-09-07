/**
 * FuelUp design system — color tokens.
 *
 * Layered dark palette for a premium performance-tool feel.
 * Legacy key names (background, surface, card, primary, ...) are kept
 * and remapped onto the new scale so the whole app inherits the
 * refined palette without touching every screen.
 */
const Colors = {
  // ── Backgrounds (layered depth) ─────────────────────────────
  bg0: "#0A0D11", // deepest background (behind everything)
  bg1: "#0F1115", // primary screen background
  bg2: "#161A20", // card background
  bg3: "#1C2128", // elevated card / active states
  bg4: "#242A33", // inputs, toggles off-state, dividers

  // ── Legacy surface aliases → new scale ──────────────────────
  background: "#0F1115",
  surface: "#161A20",
  surfaceElevated: "#1C2128",
  surfaceAlt: "#242A33",
  card: "#161A20",
  cardBorder: "#1E2430",

  // ── Borders ─────────────────────────────────────────────────
  border: "#1E2430",
  borderLight: "#2A3140",

  // ── Text ────────────────────────────────────────────────────
  text: "#F1F5F9",
  textSecondary: "#8B95A5",
  textTertiary: "#505A6A",
  textInverse: "#0A0D11",
  textOnAccent: "#0A0D11",

  // ── Accent (teal) ───────────────────────────────────────────
  primary: "#2DD4A8",
  primaryDark: "#22B88E",
  primaryLight: "#2DD4A820", // 12% teal — tint backgrounds
  accentMuted: "#2DD4A820", // subtle glows, tag backgrounds
  accentLight: "#2DD4A840", // progress tracks, pressed states
  accentGradientStart: "#2DD4A8",
  accentGradientEnd: "#22B88E",

  // ── Day type accents ────────────────────────────────────────
  match: "#EF4444",
  matchLight: "#EF444420",
  training: "#22C55E",
  trainingLight: "#22C55E20",
  recovery: "#F59E0B",
  recoveryLight: "#F59E0B20",
  rest: "#6B7280",
  restLight: "#6B728020",

  // ── Status ──────────────────────────────────────────────────
  error: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",

  // ── Tab bar ─────────────────────────────────────────────────
  tabIconDefault: "#505A6A",
  tint: "#2DD4A8",
  tabIconSelected: "#2DD4A8",

  // ── Premium ─────────────────────────────────────────────────
  premiumGold: "#D4A44C",
  premiumGoldLight: "#F0D68A",

  // ── Legacy compat ───────────────────────────────────────────
  accent: "#2DD4A8",
  discount: "#2DD4A8",
  overlay: "rgba(0,0,0,0.6)",
  tagBg: "#2DD4A820",
  tagText: "#2DD4A8",
} as const;

export default Colors;
