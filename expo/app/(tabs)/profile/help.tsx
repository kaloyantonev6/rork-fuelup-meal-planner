import React from "react";
import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mail } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function HelpScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Help & Support",
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: { color: Colors.text, fontWeight: "600" as const, fontSize: 17 },
          headerTintColor: Colors.primary,
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Help & Support — FuelUp</Text>
        <Text style={styles.body}>
          We are here to help you get the most out of FuelUp. Please find answers to the most common questions below, or reach out to our support team directly.
        </Text>

        <Text style={styles.sectionTitle}>Frequently asked questions</Text>

        <Text style={styles.question}>How does FuelUp generate my meal plan?</Text>
        <Text style={styles.body}>
          FuelUp uses artificial intelligence to create personalised meal plans based on your dietary preferences, health goals, and nutritional requirements. The more information you provide in your profile, the more accurate and tailored your plan will be.
        </Text>

        <Text style={styles.question}>Can I update my dietary preferences or health goals?</Text>
        <Text style={styles.body}>
          Yes. You can update your profile information at any time by navigating to Profile → Edit Details. Your meal plan will automatically adjust to reflect any changes.
        </Text>

        <Text style={styles.question}>How do I cancel or manage my subscription?</Text>
        <Text style={styles.body}>
          You can manage or cancel your subscription at any time through Profile → Subscription. Cancellations take effect at the end of your current billing period. For payment-related queries, please contact us directly.
        </Text>

        <Text style={styles.question}>Is my health data kept private?</Text>
        <Text style={styles.body}>
          Yes. FuelUp does not sell or share your personal or health data with third parties for marketing purposes. Please refer to our Privacy Policy for full details.
        </Text>

        <Text style={styles.question}>I found a bug or something is not working. What should I do?</Text>
        <Text style={styles.body}>
          We apologise for the inconvenience. Please contact our support team with a brief description of the issue and, if possible, a screenshot. We aim to respond within 1–2 business days.
        </Text>

        <Text style={styles.sectionTitle}>Contact us</Text>
        <Text style={styles.body}>
          For any questions, concerns, or feedback, please reach out to us:
        </Text>

        <Pressable
          onPress={() => Linking.openURL("mailto:support@fuelup.app")}
          style={({ pressed }) => [styles.contactCard, pressed && { opacity: 0.85 }]}
        >
          <View style={styles.contactIconWrap}>
            <Mail size={20} color={Colors.primary} />
          </View>
          <View style={styles.contactTextWrap}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>support@fuelup.app</Text>
          </View>
        </Pressable>

        <Text style={styles.responseTime}>Response time: within 1–2 business days</Text>

        <Text style={styles.bodySpaced}>
          We value your feedback and are continuously working to improve FuelUp.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  question: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  bodySpaced: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  contactTextWrap: {
    gap: 2,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  responseTime: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: "500" as const,
    marginBottom: 4,
  },
});
