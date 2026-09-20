import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Droplet,
  Lightbulb,
  Moon,
  Send,
  ShoppingCart,
  Target,
  Trophy,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { coachSystemPrompt } from "@/lib/coachPrompt";
import { parseAIResponse, type ParsedSection } from "@/lib/parseAIResponse";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useToday } from "@/providers/TodayProvider";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const TOOLKIT_URL = process.env.EXPO_PUBLIC_TOOLKIT_URL ?? "";
const TOOLKIT_KEY = process.env.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY ?? "";
const MODEL = "anthropic/claude-haiku-4.5";

/** Delay between revealed words in the typing animation (ms). */
const WORD_DELAY_MS = 30;
/** Auto-scroll during the typing reveal only every N words. */
const SCROLL_EVERY_N_WORDS = 5;

const MACRO_COLORS = { protein: "#60A5FA", carbs: "#FBBF24", fats: "#F87171" } as const;

const SECTION_ICONS: Record<string, LucideIcon> = {
  utensils: UtensilsCrossed,
  droplet: Droplet,
  target: Target,
  zap: Zap,
  moon: Moon,
  trophy: Trophy,
  clock: Clock,
  "shopping-cart": ShoppingCart,
};

const SUGGESTIONS = [
  "What should I eat on match day?",
  "How much protein do I need?",
  "Best recovery meals?",
  "How do I pass a sweat test?",
];

/** One staggered pulsing dot for the "coach is thinking" bubble. */
function ThinkingDot({ delay }: { delay: number }) {
  const scale = useRef<Animated.Value>(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.4, duration: 420, useNativeDriver: true }),
        ]),
      ),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, scale]);
  return <Animated.View style={[styles.thinkingDot, { transform: [{ scale }] }]} />;
}

/** Small inline citation badge, e.g. (UEFA 2021) rendered under a section. */
function SourceBadge({ label }: { label: string }) {
  return (
    <View style={styles.sourceBadge}>
      <Text style={styles.sourceBadgeText}>{label}</Text>
    </View>
  );
}

/** Renders one parsed section as a styled card/pill/callout. */
function SectionView({ section }: { section: ParsedSection }) {
  switch (section.type) {
    case "header": {
      const Icon = SECTION_ICONS[section.icon ?? "zap"] ?? Zap;
      return (
        <View>
          <View style={styles.sectionHeader}>
            <Icon size={16} color={Colors.primary} />
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
          {section.source ? <SourceBadge label={section.source} /> : null}
        </View>
      );
    }
    case "macros": {
      const m = section.macros!;
      const pills = [
        { label: "Protein", color: MACRO_COLORS.protein, value: m.protein, perKg: m.proteinPerKg },
        { label: "Carbs", color: MACRO_COLORS.carbs, value: m.carbs, perKg: m.carbsPerKg },
        { label: "Fats", color: MACRO_COLORS.fats, value: m.fats, perKg: m.fatsPerKg },
      ];
      return (
        <View>
          <View style={styles.macroRow}>
            {pills.map((p) => (
              <View
                key={p.label}
                style={[styles.macroPill, { backgroundColor: `${p.color}20`, borderColor: `${p.color}40` }]}
              >
                <Text style={[styles.macroPillName, { color: `${p.color}B3` }]}>{p.label}</Text>
                <Text style={[styles.macroPillValue, { color: p.color }]}>{p.value || "—"}</Text>
                {p.perKg ? <Text style={styles.macroPillPerKg}>{p.perKg}</Text> : null}
              </View>
            ))}
          </View>
          {section.source ? <SourceBadge label={section.source} /> : null}
        </View>
      );
    }
    case "meal_card": {
      const meal = section.meal!;
      return (
        <View>
          <View style={styles.mealCard}>
            <View style={styles.mealCardTop}>
              <Text style={styles.mealCardName} numberOfLines={1}>
                {meal.name}
              </Text>
              {meal.calories > 0 && (
                <View style={styles.calBadge}>
                  <Text style={styles.calBadgeText}>~{meal.calories} kcal</Text>
                </View>
              )}
            </View>
            {meal.ingredients ? (
              <Text style={styles.mealCardIngredients} numberOfLines={2}>
                {meal.ingredients}
              </Text>
            ) : null}
            {meal.timing || meal.why ? (
              <View style={styles.mealCardBottom}>
                {meal.timing ? (
                  <View style={styles.timingChip}>
                    <Text style={styles.timingChipText} numberOfLines={1}>
                      {meal.timing}
                    </Text>
                  </View>
                ) : null}
                {meal.why ? (
                  <Text style={styles.mealCardWhy} numberOfLines={1}>
                    {meal.why}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
          {section.source ? <SourceBadge label={section.source} /> : null}
        </View>
      );
    }
    case "tip":
      return (
        <View>
          <View style={styles.tipBox}>
            <Lightbulb size={14} color={Colors.primary} />
            <Text style={styles.tipText} numberOfLines={2}>
              {section.content}
            </Text>
          </View>
          {section.source ? <SourceBadge label={section.source} /> : null}
        </View>
      );
    default:
      return (
        <View>
          <Text style={styles.plainText}>{section.content}</Text>
          {section.source ? <SourceBadge label={section.source} /> : null}
        </View>
      );
  }
}

/** Parses assistant text and lays out the styled card sections. */
function CoachContent({ text }: { text: string }) {
  const parsed = useMemo(() => parseAIResponse(text), [text]);
  return (
    <View style={styles.sectionStack}>
      {parsed.sections.map((s, i) => (
        <SectionView key={i} section={s} />
      ))}
    </View>
  );
}

/**
 * AI Coach — a football nutrition chat powered through the Rork Toolkit proxy
 * (Vercel AI Gateway, OpenAI-compatible chat completions) using the
 * source-aware Fuelify coach system prompt. Responses reveal word-by-word
 * after a pulsing "thinking" indicator, rendered as styled cards.
 */
export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useMealPlan();
  const { todayData } = useToday();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Typing reveal for the latest assistant message only.
  const [reveal, setReveal] = useState<{ full: string; shown: number } | null>(null);
  const revealWordsRef = useRef<string[]>([]);
  const autoScrollRef = useRef(true);
  const scrollRef = useRef<ScrollView>(null);

  const systemContent = useCallback(() => {
    const context = [
      profile.age ? `Age: ${profile.age}` : "",
      profile.weight ? `Weight: ${profile.weight}kg` : "",
      profile.position ? `Position: ${profile.position}` : "",
      profile.gender ? `Gender: ${profile.gender}` : "",
      todayData ? `Today: ${todayData.dayName}, ${todayData.dayType} day (${todayData.calorieTarget} kcal target)` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return `${coachSystemPrompt}\n\nPlayer context (for personalisation): ${context || "not provided"}`;
  }, [profile, todayData]);

  // Word-by-word reveal of the newest AI response (30ms per word).
  useEffect(() => {
    if (!reveal) return;
    const total = revealWordsRef.current.length;
    if (reveal.shown >= total) {
      const done = setTimeout(() => setReveal(null), 400);
      return () => clearTimeout(done);
    }
    const id = setInterval(() => {
      setReveal((prev) => (prev ? { ...prev, shown: Math.min(prev.shown + 1, total) } : null));
    }, WORD_DELAY_MS);
    if (reveal.shown > 0 && (reveal.shown % SCROLL_EVERY_N_WORDS === 0 || reveal.shown >= total)) {
      if (autoScrollRef.current) scrollRef.current?.scrollToEnd({ animated: true });
    }
    return () => clearInterval(id);
  }, [reveal]);

  // Track whether the user is at the bottom; pause auto-scroll when they scroll up.
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    autoScrollRef.current =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 80;
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
      setReveal(null); // finish any in-flight typing animation instantly
      setMessages([...nextMessages, { role: "assistant", content: "" }]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch(`${TOOLKIT_URL}/v2/vercel/v1/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOOLKIT_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [{ role: "system", content: systemContent() }, ...nextMessages],
            max_tokens: 700,
          }),
        });
        if (!res.ok) throw new Error(`Gateway responded ${res.status}`);
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (!reply) throw new Error("Empty response");
        setMessages([...nextMessages, { role: "assistant", content: reply }]);
        revealWordsRef.current = reply.split(/\s+/).filter(Boolean);
        setReveal({ full: reply, shown: 0 });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => undefined,
        );
      } catch (e) {
        console.log("[Coach] Chat failed:", e);
        setMessages(nextMessages);
        setReveal(null);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
          () => undefined,
        );
        Alert.alert(
          "Coach unavailable",
          "Couldn't reach the AI coach. Check your connection and try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, systemContent],
  );

  const displayed = reveal ? revealWordsRef.current.slice(0, reveal.shown).join(" ") : "";

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Coach</Text>
          <Text style={styles.headerSubtitle}>Food-first · Source-aware</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          onContentSizeChange={() => {
            if (autoScrollRef.current) scrollRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🤖</Text>
              <Text style={styles.emptyTitle}>Ask your performance coach</Text>
              <Text style={styles.emptyBody}>
                Football nutrition questions answered with cited research — food first, never
                fads.
              </Text>
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => void send(s)}
                    style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              const prev = i > 0 ? messages[i - 1] : null;
              const gap = prev && prev.role !== m.role ? 16 : 8;

              if (m.role === "user") {
                return (
                  <View key={i} style={[styles.userRow, { marginBottom: gap }]}>
                    <View style={styles.bubbleUser}>
                      <Text style={styles.bubbleUserText}>{m.content}</Text>
                    </View>
                  </View>
                );
              }

              // Thinking indicator while the coach generates the response.
              if (!m.content && isLast && isLoading) {
                return (
                  <View key={i} style={[styles.coachRow, { marginBottom: gap }]}>
                    <View style={styles.thinkingBubble}>
                      <ThinkingDot delay={0} />
                      <ThinkingDot delay={150} />
                      <ThinkingDot delay={300} />
                    </View>
                  </View>
                );
              }

              const text = isLast && reveal ? displayed : m.content;
              return (
                <View key={i} style={[styles.coachRow, { marginBottom: gap }]}>
                  <View style={styles.bubbleCoach}>
                    {text ? <CoachContent text={text} /> : null}
                    {isLast && reveal ? <Text style={styles.typingCursor}>▍</Text> : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about fueling, recovery, hydration…"
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={() => void send(input)}
            disabled={isLoading || !input.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              pressed && { opacity: 0.8 },
              (!input.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
          >
            <Send size={18} color={Colors.bg0} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 48,
  },
  emptyIcon: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 12,
  },
  emptyBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 6,
    paddingHorizontal: 24,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  suggestion: {
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.bg4,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },

  // ── Message layout ────────────────────────────────────────────
  userRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  coachRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  bubbleUser: {
    maxWidth: "75%",
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUserText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.bg0,
  },
  bubbleCoach: {
    maxWidth: "90%",
    backgroundColor: Colors.bg2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 14,
  },

  // ── Thinking indicator ────────────────────────────────────────
  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.bg3,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: `${Colors.primary}66`, // teal at 40%
  },
  typingCursor: {
    color: Colors.primary,
    fontSize: 13,
    marginTop: 2,
  },

  // ── Parsed response sections ──────────────────────────────────
  sectionStack: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.bg2,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  sectionHeaderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  sourceBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.bg4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  sourceBadgeText: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: "600" as const,
  },
  macroRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  macroPill: {
    flex: 1,
    minWidth: 96,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  macroPillName: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  macroPillValue: {
    fontSize: 15,
    fontWeight: "700" as const,
  },
  macroPillPerKg: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  mealCard: {
    backgroundColor: Colors.bg3,
    borderRadius: 12,
    padding: 14,
  },
  mealCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mealCardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  calBadge: {
    backgroundColor: Colors.accentMuted,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  calBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  mealCardIngredients: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  mealCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  timingChip: {
    backgroundColor: Colors.bg4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  timingChipText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  mealCardWhy: {
    flex: 1,
    fontSize: 13,
    fontStyle: "italic" as const,
    color: Colors.textSecondary,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: `${Colors.primary}14`, // teal at 8%
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#B8C0CC",
  },
  plainText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#D7DDE5",
  },

  // ── Input bar ─────────────────────────────────────────────────
  inputBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.bg0,
    borderTopWidth: 1,
    borderTopColor: Colors.bg4,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.bg4,
    borderRadius: 24,
    color: Colors.text,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
