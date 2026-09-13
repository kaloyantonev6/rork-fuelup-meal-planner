import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { coachSystemPrompt } from "@/lib/coachPrompt";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useToday } from "@/providers/TodayProvider";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const TOOLKIT_URL = process.env.EXPO_PUBLIC_TOOLKIT_URL ?? "";
const TOOLKIT_KEY = process.env.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY ?? "";
const MODEL = "anthropic/claude-haiku-4.5";

const SUGGESTIONS = [
  "What should I eat on match day?",
  "How much protein do I need?",
  "Best recovery meals?",
  "How do I pass a sweat test?",
];

/**
 * AI Coach — a football nutrition chat powered through the Rork Toolkit proxy
 * (Vercel AI Gateway, OpenAI-compatible chat completions) using the
 * source-aware FuelUp coach system prompt.
 */
export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useMealPlan();
  const { todayData } = useToday();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
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
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => undefined,
        );
      } catch (e) {
        console.log("[Coach] Chat failed:", e);
        setMessages(nextMessages);
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
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
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
            messages.map((m, i) => (
              <View
                key={i}
                style={[styles.bubble, m.role === "user" ? styles.bubbleUser : styles.bubbleCoach]}
              >
                <Text style={m.role === "user" ? styles.bubbleUserText : styles.bubbleCoachText}>
                  {m.content || (isLoading && i === messages.length - 1 ? "Thinking…" : "")}
                </Text>
              </View>
            ))
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
            <Send size={18} color={Colors.textInverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleCoach: {
    alignSelf: "flex-start",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleUserText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textInverse,
  },
  bubbleCoachText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
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
    backgroundColor: Colors.bg1,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 20,
    color: Colors.text,
    fontSize: 14,
    paddingHorizontal: 14,
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
