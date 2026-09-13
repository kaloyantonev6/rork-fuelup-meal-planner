/**
 * Forgiving parser that converts raw AI coach markdown into structured
 * sections the chat UI renders as styled cards. Anything it can't
 * confidently classify falls back to plain styled text.
 */

export interface MacroSet {
  protein: string;
  carbs: string;
  fats: string;
  proteinPerKg?: string;
  carbsPerKg?: string;
  fatsPerKg?: string;
}

export interface ParsedMeal {
  name: string;
  calories: number;
  ingredients: string;
  timing: string;
  why: string;
}

export interface ParsedSection {
  type: "header" | "macros" | "meal_card" | "tip" | "text";
  icon?: string;
  title?: string;
  content?: string;
  macros?: MacroSet;
  meal?: ParsedMeal;
  source?: string;
}

export interface ParsedResponse {
  sections: ParsedSection[];
}

/** Parenthetical citations like (UEFA 2021) or (ISSN position stand 2017). */
const SOURCE_RE = /\(([^()]*?(?:19|20)\d{2}[^()]*?)\)/;
const CALORIE_RE = /~?\s*(\d{2,4})\s*k?cal/i;

type MacroKey = "protein" | "carbs" | "fats";

type MacroParts = Partial<Record<`${MacroKey}` | `${MacroKey}PerKg`, string>>;

type Draft =
  | { kind: "header"; title: string; icon: string; source?: string }
  | { kind: "macros"; parts: MacroParts; source?: string }
  | { kind: "meal"; meal: ParsedMeal; source?: string }
  | { kind: "tip"; content: string; source?: string }
  | { kind: "text"; content: string; source?: string };

/** Remove markdown bold markers and stray heading hashes. */
function stripBold(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

/** Pick a semantic icon name from a header title. */
function guessIcon(title: string): string {
  const t = title.toLowerCase();
  if (/hydrat|fluid|water|drink/.test(t)) return "droplet";
  if (/meal|plate|food|menu|option|breakfast|lunch|dinner|snack/.test(t)) return "utensils";
  if (/target|intake|number|goal|macro/.test(t)) return "target";
  if (/recover|sleep|rest day|regenerat/.test(t)) return "moon";
  if (/match|game|kick-?off|90 min/.test(t)) return "trophy";
  if (/timing|window|when|schedule|hour/.test(t)) return "clock";
  if (/shop|grocer|budget|buy|list/.test(t)) return "shopping-cart";
  return "zap";
}

/** Split "3-4g/kg = ~216-288g" into per-kg range + absolute value. */
function splitMacroValue(rest: string): { value: string; perKg?: string } {
  const cleaned = rest.trim();
  const eq = cleaned.indexOf("=");
  if (eq > -1) {
    return { perKg: cleaned.slice(0, eq).trim(), value: cleaned.slice(eq + 1).trim() };
  }
  return { value: cleaned };
}

const TIP_START_RE =
  /^\*?\*?(Tip|Quick tip|Pro tip|Note|Science note|Hydration tip|Coach'?s note)\b\s*:?/i;
const TIP_STRIP_RE =
  /^\*?\*?(Tip|Quick tip|Pro tip|Note|Science note|Hydration tip|Coach'?s note)\b\s*:?\*?\*?\s*/i;

/**
 * Parse a raw AI response into renderable sections.
 *
 * Rules:
 * - `#`/`##` lines → header (with a keyword-matched icon)
 * - `**Protein:** …` / `**Carbs:** …` / `**Fats:** …` → grouped macro pills
 * - `### **Option N: …**` + following bullets → meal card
 * - `**Tip:** …` or hydration/fluid advice → tip callout
 * - `(UEFA 2021)`-style citations → extracted into `source` badges
 * - everything else → plain text
 */
export function parseAIResponse(raw: string): ParsedResponse {
  const sections: ParsedSection[] = [];
  let draft: Draft | null = null;

  // Consumes the in-progress draft into `sections` and always returns null,
  // so callers reassign `draft` directly (keeps TS narrowing sound).
  const flushDraft = (d: Draft | null): Draft | null => {
    if (!d) return null;
    const source = d.source;
    const withSource = <T extends object>(base: T): T =>
      source ? ({ ...base, source } as T) : base;

    switch (d.kind) {
      case "header":
        sections.push(withSource({ type: "header", icon: d.icon, title: d.title }));
        break;
      case "macros": {
        const p = d.parts;
        if (p.protein || p.carbs || p.fats) {
          sections.push(
            withSource({
              type: "macros",
              macros: {
                protein: p.protein ?? "",
                carbs: p.carbs ?? "",
                fats: p.fats ?? "",
                ...(p.proteinPerKg ? { proteinPerKg: p.proteinPerKg } : {}),
                ...(p.carbsPerKg ? { carbsPerKg: p.carbsPerKg } : {}),
                ...(p.fatsPerKg ? { fatsPerKg: p.fatsPerKg } : {}),
              },
            }),
          );
        }
        break;
      }
      case "meal":
        sections.push(withSource({ type: "meal_card", meal: d.meal }));
        break;
      case "tip":
        if (d.content) sections.push(withSource({ type: "tip", content: d.content }));
        break;
      case "text":
        if (d.content) sections.push(withSource({ type: "text", content: d.content }));
        break;
    }
    return null;
  };

  const lines = raw.split(/\r?\n/);
  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Extract parenthetical source citations, e.g. (UEFA 2021)
    const srcMatch = line.match(SOURCE_RE);
    if (srcMatch && srcMatch[1].trim().length <= 60) {
      if (draft) draft.source = srcMatch[1].trim();
      line = line.replace(SOURCE_RE, "").trim();
      if (!line) continue;
    }

    const isBullet = /^[-•*]\s+/.test(line);
    const content = line.replace(/^[-•*]\s+/, "").trim();
    const bare = stripBold(content);
    if (!bare) continue;

    // ── Headings (## … / ### **Option N: …**) ──────────────────────
    const headingMatch = content.match(/^#{1,6}\s*(.*)$/);
    if (headingMatch) {
      const text = stripBold(headingMatch[1]);
      if (/^Option\s*\d*\s*[:\-]/i.test(text) || /^Option\s/i.test(text)) {
        let name = text.replace(/^Option\s*\d*\s*[:\-]?\s*/i, "").trim();
        let calories = 0;
        const calMatch = name.match(CALORIE_RE);
        if (calMatch) {
          calories = parseInt(calMatch[1], 10);
          name = name.replace(CALORIE_RE, "").replace(/[\s(\u2013-]+$/u, "").trim();
        }
        draft = flushDraft(draft);
        draft = {
          kind: "meal",
          meal: { name: name || "Meal option", calories, ingredients: "", timing: "", why: "" },
        };
      } else if (text) {
        draft = flushDraft(draft);
        draft = { kind: "header", title: text, icon: guessIcon(text) };
      }
      continue;
    }

    // ── Macro target lines ─────────────────────────────────────────
    const macroMatch = bare.match(/^(Protein|Carbs|Fats)\s*:\s*(.+)$/i);
    if (macroMatch) {
      const key = macroMatch[1].toLowerCase() as MacroKey;
      const { value, perKg } = splitMacroValue(macroMatch[2]);
      if (!draft || draft.kind !== "macros") {
        draft = flushDraft(draft);
        draft = { kind: "macros", parts: {} };
      }
      if (draft.kind === "macros") {
        draft.parts[key] = value;
        if (perKg) draft.parts[`${key}PerKg` as `${MacroKey}PerKg`] = perKg;
      }
      continue;
    }

    // ── Meal card detail bullets ───────────────────────────────────
    if (draft?.kind === "meal" && isBullet) {
      const meal = draft.meal;
      const ing = bare.match(/^(Ingredients?|Made with|Contains)\s*:\s*(.+)$/i);
      const tim = bare.match(/^(Timing|Time|When|Best time|Eat it)\s*:\s*(.+)$/i);
      const why = bare.match(/^(Why|Rationale|Benefit|Pitch)\s*:\s*(.+)$/i);
      const cal = bare.match(/^~?\s*(\d{2,4})\s*k?cal\b/i);
      if (ing) {
        meal.ingredients = meal.ingredients
          ? `${meal.ingredients}, ${ing[2].trim()}`
          : ing[2].trim();
      } else if (tim) {
        meal.timing = tim[2].trim();
      } else if (why) {
        meal.why = meal.why ? `${meal.why} ${why[2].trim()}` : why[2].trim();
      } else if (cal) {
        meal.calories = parseInt(cal[1], 10);
      } else if (/^\d{2,4}\s*k?cal/i.test(bare)) {
        meal.calories = parseInt(bare.replace(/[^\d]/g, ""), 10);
      } else if (!meal.ingredients) {
        meal.ingredients = bare;
      } else {
        meal.why = meal.why ? `${meal.why} ${bare}` : bare;
      }
      continue;
    }

    // ── "**Option 1: …**" without a heading marker ─────────────────
    const optionInline = bare.match(/^Option\s*\d*\s*[:\-]\s*(.+)$/i);
    if (optionInline && content.includes("**")) {
      let name = optionInline[1].trim();
      let calories = 0;
      const calMatch = name.match(CALORIE_RE);
      if (calMatch) {
        calories = parseInt(calMatch[1], 10);
        name = name.replace(CALORIE_RE, "").replace(/[\s(\u2013-]+$/u, "").trim();
      }
      draft = flushDraft(draft);
      draft = {
        kind: "meal",
        meal: { name: name || "Meal option", calories, ingredients: "", timing: "", why: "" },
      };
      continue;
    }

    // ── Tips / callouts ────────────────────────────────────────────
    if (TIP_START_RE.test(bare) || (isBullet && /hydrat|fluid/i.test(bare) && bare.length < 200)) {
      draft = flushDraft(draft);
      draft = { kind: "tip", content: bare.replace(TIP_STRIP_RE, "") };
      continue;
    }

    // ── Plain text (merge consecutive lines) ───────────────────────
    if (draft?.kind === "text") {
      draft.content = `${draft.content}\n${bare}`;
    } else {
      draft = flushDraft(draft);
      draft = { kind: "text", content: bare };
    }
  }

  draft = flushDraft(draft);

  // Forgiving fallback — unparseable input renders as plain styled text.
  if (sections.length === 0) {
    sections.push({ type: "text", content: raw.trim() });
  }
  return { sections };
}
